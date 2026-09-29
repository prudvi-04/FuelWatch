package com.fuelwatch.service;

import com.fuelwatch.dto.Requests;
import com.fuelwatch.dto.Responses;
import com.fuelwatch.entity.*;
import com.fuelwatch.repository.*;
import com.fuelwatch.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FuelService {

    private final GeneratorRepository generatorRepo;
    private final LevelReadingRepository readingRepo;
    private final AlertRuleRepository ruleRepo;
    private final AlertRepository alertRepo;

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Generator requireOwnedGen(String id) {
        return generatorRepo.findByIdAndUserId(id, CurrentUser.id())
                .orElseThrow(() -> new NoSuchElementException("Generator not found: " + id));
    }

    private Set<String> myGenIds() {
        return generatorRepo.findByUserId(CurrentUser.id()).stream()
                .map(Generator::getId).collect(Collectors.toSet());
    }

    // ── Generators ────────────────────────────────────────────────────────────

    public List<Responses.GeneratorResponse> getAllGenerators() {
        AlertRule rule = getActiveRule();
        return generatorRepo.findByUserId(CurrentUser.id()).stream()
                .map(g -> buildGeneratorResponse(g, rule))
                .collect(Collectors.toList());
    }

    public Responses.GeneratorResponse getGenerator(String id) {
        Generator g = requireOwnedGen(id);
        return buildGeneratorResponse(g, getActiveRule());
    }

    @Transactional
    public Responses.GeneratorResponse createGenerator(Requests.GeneratorRequest req) {
        String upperId = req.getId().toUpperCase().trim();
        if (generatorRepo.existsByIdAndUserId(upperId, CurrentUser.id())) {
            throw new IllegalArgumentException("You already have a generator with ID: " + req.getId());
        }
        Generator g = new Generator();
        g.setId(upperId);
        g.setLocation(req.getLocation().trim());
        g.setCapacityL(req.getCapacityL());
        g.setUserId(CurrentUser.id());
        generatorRepo.save(g);
        return buildGeneratorResponse(g, getActiveRule());
    }

    @Transactional
    public void deleteGenerator(String id) {
        Generator g = requireOwnedGen(id);

        // Delete all readings
        List<LevelReading> readings = readingRepo.findByGenIdAndTsAfterOrderByTsAsc(id,
                LocalDateTime.now().minusYears(10));
        readingRepo.deleteAll(readings);

        // Delete all alerts
        alertRepo.deleteAll(alertRepo.findByTsAfterOrderByTsDesc(
                        LocalDateTime.now().minusYears(10))
                .stream()
                .filter(a -> a.getGenId().equals(id))
                .collect(Collectors.toList()));

        generatorRepo.delete(g);
        log.info("Deleted generator {} for user {}", id, CurrentUser.id());
    }

    // ── Readings ──────────────────────────────────────────────────────────────

    public List<Responses.ReadingResponse> getReadings(String genId, LocalDateTime from, LocalDateTime to) {
        requireOwnedGen(genId);
        LocalDateTime start = from != null ? from : LocalDateTime.now().minusYears(1);
        LocalDateTime end   = to   != null ? to   : LocalDateTime.now().plusDays(1);
        return readingRepo.findByGenIdAndTsBetweenOrderByTsAsc(genId, start, end)
                .stream().map(this::toReadingResponse).collect(Collectors.toList());
    }

    @Transactional
    public Responses.ReadingResponse logReading(String genId, Requests.ReadingRequest req) {
        requireOwnedGen(genId);
        LevelReading reading = new LevelReading();
        reading.setGenId(genId);
        reading.setLevelPct(req.getLevelPct());
        reading.setManual(req.isManual());
        reading.setNote(req.getNote());
        reading.setTs(req.getTs() != null ? req.getTs() : LocalDateTime.now());
        readingRepo.save(reading);
        detectLatestReading(genId);
        return toReadingResponse(reading);
    }

    // ── Alert detection on new reading ────────────────────────────────────────

    @Transactional
    public void detectLatestReading(String genId) {
        AlertRule rule = getActiveRule();
        List<LevelReading> latest = readingRepo.findTop2ByGenIdOrderByTsDesc(genId);
        if (latest.isEmpty()) return;

        LevelReading curr = latest.get(0);

        // Sudden drop check
        if (latest.size() >= 2) {
            LevelReading prev = latest.get(1);
            double drop = prev.getLevelPct().subtract(curr.getLevelPct()).doubleValue();
            if (drop > rule.getDropRate().doubleValue()) {
                Alert alert = new Alert();
                alert.setGenId(genId);
                alert.setType(Alert.AlertType.SUDDEN_DROP);
                alert.setValue(BigDecimal.valueOf(drop).setScale(2, RoundingMode.HALF_UP));
                alert.setTs(curr.getTs());
                alert.setResolved(false);
                alertRepo.save(alert);
                log.warn("ALERT [SUDDEN_DROP] {} dropped {}%/hr", genId, drop);
            }
        }

        // Low level check
        if (curr.getLevelPct().compareTo(rule.getMinLevel()) < 0) {
            Alert alert = new Alert();
            alert.setGenId(genId);
            alert.setType(Alert.AlertType.LOW_LEVEL);
            alert.setValue(curr.getLevelPct());
            alert.setTs(curr.getTs());
            alert.setResolved(false);
            alertRepo.save(alert);
            log.warn("ALERT [LOW_LEVEL] {} at {}%", genId, curr.getLevelPct());
        }
    }

    // ── Bulk detection (scheduler) ────────────────────────────────────────────

    @Transactional
    public List<Responses.AlertResponse> detectDrops(String genId) {
        AlertRule rule = getActiveRule();
        LocalDateTime windowStart = LocalDateTime.now().minusDays(7);
        List<LevelReading> readings = readingRepo.findByGenIdAndTsAfterOrderByTsAsc(genId, windowStart);
        List<Alert> triggered = new ArrayList<>();

        for (int i = 1; i < readings.size(); i++) {
            LevelReading prev = readings.get(i - 1);
            LevelReading curr = readings.get(i);
            double drop = prev.getLevelPct().subtract(curr.getLevelPct()).doubleValue();

            if (drop > rule.getDropRate().doubleValue()) {
                LocalDateTime cooldownCutoff = curr.getTs().minusHours(rule.getCooldownHrs());
                boolean alreadyFired = alertRepo.existsByGenIdAndTypeAndTsAfter(
                        genId, Alert.AlertType.SUDDEN_DROP, cooldownCutoff);
                if (!alreadyFired) {
                    Alert alert = new Alert();
                    alert.setGenId(genId);
                    alert.setType(Alert.AlertType.SUDDEN_DROP);
                    alert.setValue(BigDecimal.valueOf(drop).setScale(2, RoundingMode.HALF_UP));
                    alert.setTs(curr.getTs());
                    alert.setResolved(false);
                    triggered.add(alertRepo.save(alert));
                }
            }

            if (curr.getLevelPct().compareTo(rule.getMinLevel()) < 0) {
                LocalDateTime cooldownCutoff = curr.getTs().minusHours(rule.getCooldownHrs());
                boolean alreadyFired = alertRepo.existsByGenIdAndTypeAndTsAfter(
                        genId, Alert.AlertType.LOW_LEVEL, cooldownCutoff);
                if (!alreadyFired) {
                    Alert alert = new Alert();
                    alert.setGenId(genId);
                    alert.setType(Alert.AlertType.LOW_LEVEL);
                    alert.setValue(curr.getLevelPct());
                    alert.setTs(curr.getTs());
                    alert.setResolved(false);
                    triggered.add(alertRepo.save(alert));
                }
            }
        }
        return triggered.stream().map(this::toAlertResponse).collect(Collectors.toList());
    }

    @Transactional
    public void detectDropsAllGenerators() {
        List<Generator> gens = generatorRepo.findAll();
        log.info("Scheduled alert scan — checking {} generators", gens.size());
        gens.forEach(g -> detectDrops(g.getId()));
    }

    // ── Rule change rescan (current user only) ────────────────────────────────

    @Transactional
    public void evaluateCurrentLevels(AlertRule rule) {
        log.info("Rule changed — evaluating current levels for user {}", CurrentUser.id());
        for (Generator g : generatorRepo.findByUserId(CurrentUser.id())) {
            Optional<LevelReading> latestOpt = readingRepo.findTopByGenIdOrderByTsDesc(g.getId());
            if (latestOpt.isEmpty()) continue;

            BigDecimal level = latestOpt.get().getLevelPct();
            if (level.compareTo(rule.getMinLevel()) < 0) {
                boolean unresolvedExists = alertRepo
                    .findByGenIdAndResolvedFalseOrderByTsDesc(g.getId())
                    .stream()
                    .anyMatch(a -> a.getType() == Alert.AlertType.LOW_LEVEL);
                if (!unresolvedExists) {
                    Alert alert = new Alert();
                    alert.setGenId(g.getId());
                    alert.setType(Alert.AlertType.LOW_LEVEL);
                    alert.setValue(level);
                    alert.setTs(LocalDateTime.now());
                    alert.setResolved(false);
                    alertRepo.save(alert);
                    log.warn("RULE CHANGE: {} at {}% violates new min {}%", g.getId(), level, rule.getMinLevel());
                }
            } else {
                alertRepo.findByGenIdAndResolvedFalseOrderByTsDesc(g.getId())
                    .stream()
                    .filter(a -> a.getType() == Alert.AlertType.LOW_LEVEL)
                    .forEach(a -> alertRepo.deleteById(a.getId()));
            }
        }
    }

    // ── Refuel detection ──────────────────────────────────────────────────────

    public List<Responses.RefuelEventResponse> getRefuelEvents(String genId, LocalDateTime from) {
        requireOwnedGen(genId);
        LocalDateTime since = from != null ? from : LocalDateTime.now().minusDays(30);
        List<LevelReading> pts = readingRepo.findForRefuelDetection(genId, since);
        List<Responses.RefuelEventResponse> events = new ArrayList<>();
        for (int i = 1; i < pts.size(); i++) {
            BigDecimal prev = pts.get(i - 1).getLevelPct();
            BigDecimal curr = pts.get(i).getLevelPct();
            BigDecimal rise = curr.subtract(prev);
            if (rise.compareTo(new BigDecimal("10")) > 0) {
                events.add(Responses.RefuelEventResponse.builder()
                        .genId(genId).fromLevel(prev).toLevel(curr)
                        .rise(rise.setScale(2, RoundingMode.HALF_UP))
                        .ts(pts.get(i).getTs()).build());
            }
        }
        Collections.reverse(events);
        return events;
    }

    // ── Alerts ────────────────────────────────────────────────────────────────

    public List<Responses.AlertResponse> getActiveAlerts() {
        Set<String> ownedIds = myGenIds();
        return alertRepo.findByResolvedFalseOrderByTsDesc().stream()
                .filter(a -> ownedIds.contains(a.getGenId()))
                .map(this::toAlertResponse).collect(Collectors.toList());
    }

    public List<Responses.AlertResponse> getAllAlerts(boolean all) {
        Set<String> ownedIds = myGenIds();
        if (all) {
            return alertRepo.findByTsAfterOrderByTsDesc(LocalDateTime.now().minusDays(30))
                    .stream()
                    .filter(a -> ownedIds.contains(a.getGenId()))
                    .map(this::toAlertResponse).collect(Collectors.toList());
        }
        return getActiveAlerts();
    }

    @Transactional
    public Responses.AlertResponse resolveAlert(Long alertId) {
        Alert alert = alertRepo.findById(alertId)
                .orElseThrow(() -> new NoSuchElementException("Alert not found"));
        if (!myGenIds().contains(alert.getGenId())) {
            throw new SecurityException("Not authorised");
        }
        alertRepo.deleteById(alertId);
        return toAlertResponse(alert);
    }

    // ── Alert Rules (shared, global) ──────────────────────────────────────────

    public Responses.AlertRuleResponse getRule() {
        return toRuleResponse(getActiveRule());
    }

    @Transactional
    public Responses.AlertRuleResponse updateRule(Requests.AlertRuleRequest req) {
        AlertRule rule = ruleRepo.findFirstByOrderByIdAsc().orElse(new AlertRule());
        rule.setMinLevel(req.getMinLevel());
        rule.setDropRate(req.getDropRate());
        rule.setCooldownHrs(req.getCooldownHrs());
        AlertRule saved = ruleRepo.save(rule);
        evaluateCurrentLevels(saved);
        return toRuleResponse(saved);
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private AlertRule getActiveRule() {
        return ruleRepo.findFirstByOrderByIdAsc().orElseGet(() -> {
            AlertRule defaultRule = new AlertRule();
            return ruleRepo.save(defaultRule);
        });
    }

    private Responses.GeneratorResponse buildGeneratorResponse(Generator g, AlertRule rule) {
        Optional<LevelReading> latest = readingRepo.findTopByGenIdOrderByTsDesc(g.getId());
        int activeAlerts = alertRepo.findByGenIdAndResolvedFalseOrderByTsDesc(g.getId()).size();
        BigDecimal level = latest.map(LevelReading::getLevelPct).orElse(null);
        String status = "NO_DATA";
        if (level != null) {
            if (level.compareTo(rule.getMinLevel()) < 0) status = "CRITICAL";
            else if (level.compareTo(rule.getMinLevel().add(new BigDecimal("10"))) < 0) status = "WARNING";
            else status = "OK";
        }
        return Responses.GeneratorResponse.builder()
                .id(g.getId()).location(g.getLocation()).capacityL(g.getCapacityL())
                .currentLevel(level).status(status)
                .lastReadingAt(latest.map(LevelReading::getTs).orElse(null))
                .activeAlerts(activeAlerts).build();
    }

    private Responses.ReadingResponse toReadingResponse(LevelReading r) {
        return Responses.ReadingResponse.builder()
                .id(r.getId()).genId(r.getGenId()).levelPct(r.getLevelPct())
                .manual(r.isManual()).note(r.getNote()).ts(r.getTs()).build();
    }

    private Responses.AlertResponse toAlertResponse(Alert a) {
        return Responses.AlertResponse.builder()
                .id(a.getId()).genId(a.getGenId()).type(a.getType().name())
                .value(a.getValue()).ts(a.getTs()).resolved(a.isResolved()).build();
    }

    private Responses.AlertRuleResponse toRuleResponse(AlertRule r) {
        return Responses.AlertRuleResponse.builder()
                .id(r.getId()).minLevel(r.getMinLevel())
                .dropRate(r.getDropRate()).cooldownHrs(r.getCooldownHrs()).build();
    }
}
