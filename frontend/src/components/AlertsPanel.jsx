import React from "react";
import { format } from "date-fns";
import { resolveAlert } from "../api/api";

const META = {
  LOW_LEVEL:   { label: "Below minimum", icon: "▼", iconClass: "danger" },
  SUDDEN_DROP: { label: "Sudden drop",   icon: "!", iconClass: "warn" },
};

export default function AlertsPanel({ alerts, onResolved }) {
  const handleResolve = async (id) => {
    try {
      await resolveAlert(id);
      onResolved(id);
      //onRefresh();
    } catch (e) {
      console.error("Resolve failed", e);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>Active Alerts</div>
        <span className={`badge ${alerts.length > 0 ? "badge-danger" : "badge-ok"}`}>
          {alerts.length > 0 ? `${alerts.length} active` : "All clear"}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="empty-state" style={{ padding: 12, fontSize: 12 }}>
          No active alerts. ✓
        </div>
      ) : alerts.map((a) => {
        const meta = META[a.type] || META.LOW_LEVEL;
        return (
          <div key={a.id} className="alert-row">
            <div className={`alert-icon ${meta.iconClass}`}>{meta.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{a.genId}</span>
                {" — "}
                {meta.label}: <span style={{ fontWeight: 600 }}>{parseFloat(a.value).toFixed(1)}%</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {format(new Date(a.ts), "dd MMM yyyy, HH:mm")}
              </div>
            </div>
            <button className="btn-pill" onClick={() => handleResolve(a.id)}>Resolve</button>
          </div>
        );
      })}
    </div>
  );
}
