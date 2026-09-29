import React, { useState, useEffect } from "react";
import GeneratorList from "../components/GeneratorList";
import LevelChart from "../components/LevelChart";
import AlertsPanel from "../components/AlertsPanel";

export default function Dashboard({ generators, alerts, rule, onAlertResolved }) {
  const [selectedId, setSelectedId] = useState(generators[0]?.id || null);

  useEffect(() => {
    if (!selectedId && generators[0]) setSelectedId(generators[0].id);
    if (selectedId && !generators.find((g) => g.id === selectedId)) {
      setSelectedId(generators[0]?.id || null);
    }
  }, [generators, selectedId]);

  const critical = generators.filter((g) => g.status === "CRITICAL").length;
  const warning  = generators.filter((g) => g.status === "WARNING").length;
  const ok       = generators.filter((g) => g.status === "OK").length;
  const selected = generators.find((g) => g.id === selectedId);

  return (
    <div className="fade-in">
      <div className="metrics-grid">
        <div className="metric">
          <div className="metric-icon brand">⛽</div>
          <div className="metric-label">Generators</div>
          <div className="metric-value">{generators.length}</div>
          <div className="metric-sub">{ok} healthy</div>
        </div>
        <div className={`metric ${critical > 0 ? "metric-danger" : ""}`}>
          <div className="metric-icon danger">▼</div>
          <div className="metric-label">Critical</div>
          <div className={`metric-value ${critical > 0 ? "text-danger" : ""}`}>{critical}</div>
          <div className="metric-sub">below minimum</div>
        </div>
        <div className={`metric ${warning > 0 ? "metric-warn" : ""}`}>
          <div className="metric-icon warn">⚠</div>
          <div className="metric-label">Warning</div>
          <div className={`metric-value ${warning > 0 ? "text-warn" : ""}`}>{warning}</div>
          <div className="metric-sub">near threshold</div>
        </div>
        <div className={`metric ${alerts.length > 0 ? "metric-danger" : "metric-success"}`}>
          <div className={`metric-icon ${alerts.length > 0 ? "danger" : "success"}`}>🔔</div>
          <div className="metric-label">Active alerts</div>
          <div className={`metric-value ${alerts.length > 0 ? "text-danger" : "text-success"}`}>{alerts.length}</div>
          <div className="metric-sub">{alerts.length === 0 ? "all clear ✓" : "need attention"}</div>
        </div>
      </div>

      {generators.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 16 }}>⛽</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
              No generators yet
            </div>
            <div>Head to <strong style={{ color: "var(--brand)" }}>Settings</strong> to add your first generator.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 18 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12, paddingLeft: 4 }}>
              Generators ({generators.length})
            </div>
            <GeneratorList generators={generators} selectedId={selectedId} onSelect={setSelectedId} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div className="card-title">{selected?.id} — Level History</div>
                  <div className="card-subtitle" style={{ marginBottom: 0 }}>📍 {selected?.location}</div>
                </div>
              </div>
              {selectedId
                ? <LevelChart genId={selectedId} rule={rule} />
                : <div className="empty-state">Select a generator</div>}
            </div>

            <div className="card">
              <AlertsPanel alerts={alerts} onResolved={onAlertResolved} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
