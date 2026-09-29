import React from "react";
import LogReadingForm from "../components/LogReadingForm";

export default function LogPage({ generators, onLogged }) {
  if (!generators.length) {
    return (
      <div className="card">
        <div className="empty-state">
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
            No generators to log readings for
          </div>
          <div>Add a generator in Settings first.</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card">
        <div className="card-title">Log a Manual Reading</div>
        <div className="card-subtitle">
          Enter the current fuel level. Saved instantly and checked against alert rules.
        </div>
        <LogReadingForm generators={generators} onLogged={onLogged} />
      </div>

      <div className="card">
        <div className="card-title">How readings work</div>
        <div className="card-subtitle">
          The complete lifecycle of every reading you log.
        </div>
        {[
          { step: "1", title: "Operator checks tank",
            desc: "Once or twice a day, an operator physically checks the gauge." },
          { step: "2", title: "Entry logged here",
            desc: "Reading is saved to the database with a timestamp." },
          { step: "3", title: "Alert check runs",
            desc: "FuelService.detectLatestReading() runs — fires alert if threshold breached." },
          { step: "4", title: "Dashboard updates",
            desc: "Chart, badges, and alert panel refresh to reflect the new reading." },
        ].map((item, i, arr) => (
          <div key={item.step} style={{
            display: "flex", gap: 14, alignItems: "flex-start",
            padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid var(--border)",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "var(--brand-light)", color: "var(--brand)",
              display: "grid", placeItems: "center",
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {item.step}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
