import React, { useState, useEffect } from "react";
import { getAllRefuels } from "../api/api";
import { format, subDays } from "date-fns";

export default function RefuelLog({ generators }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!generators.length) { setLoading(false); return; }
    setLoading(true);
    getAllRefuels(generators.map(g => g.id), subDays(new Date(), days))
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [generators, days]);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div className="card-title">Refuel Log</div>
          <div className="card-subtitle">
            Detected automatically when level rises by more than 10% between readings.
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[7, 14, 30].map((d) => (
            <button key={d} className={`btn-pill ${days === d ? "active" : ""}`} onClick={() => setDays(d)}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="empty-state">Loading…</div>}
      {!loading && events.length === 0 && (
        <div className="empty-state">
          No refuel events in the last {days} days.
        </div>
      )}
      {!loading && events.map((e, i) => (
        <div key={i} style={{
          display: "flex", gap: 12, alignItems: "center",
          padding: "12px 0",
          borderTop: i === 0 ? "none" : "1px solid var(--border)",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "var(--success-bg)", color: "var(--success)",
            display: "grid", placeItems: "center", fontSize: 14, fontWeight: 700,
            flexShrink: 0,
          }}>↑</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>{e.genId}</span>
              <span style={{ color: "var(--text-secondary)" }}>
                {" "}refuelled from{" "}
                <b style={{ color: "var(--danger)" }}>{parseFloat(e.fromLevel).toFixed(1)}%</b>
                {" "}to{" "}
                <b style={{ color: "var(--success)" }}>{parseFloat(e.toLevel).toFixed(1)}%</b>
                <span style={{ color: "var(--text-muted)" }}> (+{parseFloat(e.rise).toFixed(1)}%)</span>
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {format(new Date(e.ts), "dd MMM yyyy, HH:mm")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
