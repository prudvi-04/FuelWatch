import React from "react";

const STATUS_BAR_COLOR = {
  CRITICAL: "var(--danger)",
  WARNING:  "var(--warn)",
  OK:       "var(--success)",
  NO_DATA:  "var(--text-muted)",
};

const STATUS_BADGE = {
  CRITICAL: "badge-danger",
  WARNING:  "badge-warn",
  OK:       "badge-ok",
  NO_DATA:  "badge-neutral",
};

export default function GeneratorList({ generators, selectedId, onSelect }) {
  if (!generators.length) {
    return (
      <div className="empty-state" style={{ padding: 24 }}>
        No generators yet.<br />
        Add one in Settings.
      </div>
    );
  }
  return (
    <div>
      {generators.map((g) => {
        const lv = g.currentLevel != null ? parseFloat(g.currentLevel) : null;
        const barColor = STATUS_BAR_COLOR[g.status];
        return (
          <div
            key={g.id}
            className={`gen-card ${g.id === selectedId ? "selected" : ""}`}
            onClick={() => onSelect(g.id)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="gen-id">{g.id}</div>
                <div className="gen-loc">{g.location}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                {g.activeAlerts > 0 && (
                  <span className="badge badge-danger">{g.activeAlerts}</span>
                )}
                <span className={`badge ${STATUS_BADGE[g.status]}`}>{g.status}</span>
              </div>
            </div>

            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${lv ?? 0}%`, background: barColor }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ color: "var(--text-muted)" }}>{g.capacityL}L tank</span>
              <span style={{ fontWeight: 600, color: barColor }}>
                {lv != null ? lv.toFixed(1) + "%" : "—"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
