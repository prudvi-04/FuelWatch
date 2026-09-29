import React, { useState } from "react";
import { logReading } from "../api/api";

export default function LogReadingForm({ generators, onLogged }) {
  const [genId, setGenId] = useState(generators[0]?.id || "");
  const [litres, setLitres] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const selectedGen = generators.find((g) => g.id === genId);
  const capacityL = selectedGen?.capacityL || 0;
  const litresNum = parseFloat(litres);
  const pct = capacityL > 0 && !isNaN(litresNum) ? ((litresNum / capacityL) * 100).toFixed(1) : null;
  const isOverCapacity = !isNaN(litresNum) && litresNum > capacityL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isNaN(litresNum) || litresNum < 0) {
      setMsg({ type: "error", text: "Enter a valid amount in litres." });
      return;
    }
    if (isOverCapacity) {
      setMsg({ type: "error", text: `Cannot exceed tank capacity of ${capacityL}L.` });
      return;
    }
    if (capacityL === 0) {
      setMsg({ type: "error", text: "Generator has no capacity set." });
      return;
    }

    const levelPct = parseFloat(((litresNum / capacityL) * 100).toFixed(2));
    setSaving(true); setMsg(null);

    try {
      await logReading(genId, { levelPct, manual: true, note });
      setLitres(""); setNote("");
      setMsg({ type: "success", text: `Logged ${litresNum}L (${levelPct}%) for ${genId}.` });
      onLogged();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.error || "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  const pctColor = pct !== null
    ? parseFloat(pct) < 20 ? "var(--danger)"
    : parseFloat(pct) < 30 ? "var(--warn)"
    : "var(--success)"
    : "var(--text-muted)";

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="field">
          <label className="field-label">Generator</label>
          <select className="select" value={genId} onChange={(e) => setGenId(e.target.value)}>
            {generators.map((g) => (
              <option key={g.id} value={g.id}>
                {g.id} — {g.location} ({g.capacityL}L)
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field-label">
            Current fuel (litres){capacityL > 0 && <span style={{ color: "var(--text-muted)", marginLeft: 6, fontWeight: 400 }}>max {capacityL}L</span>}
          </label>
          <input
            className={`input ${isOverCapacity ? "error" : ""}`}
            type="number"
            min={0}
            max={capacityL || undefined}
            step={1}
            placeholder={`e.g. ${Math.round(capacityL * 0.6)}`}
            value={litres}
            onChange={(e) => setLitres(e.target.value)}
          />
          {pct !== null && !isOverCapacity && (
            <div className="field-help" style={{ color: pctColor, fontWeight: 500 }}>
              ≈ {pct}% of tank{parseFloat(pct) < 20 && " — below minimum threshold"}
            </div>
          )}
          {isOverCapacity && (
            <div className="field-help text-danger">
              Exceeds tank capacity of {capacityL}L
            </div>
          )}
        </div>
      </div>

      <div className="field">
        <label className="field-label">Note (optional)</label>
        <input
          className="input"
          type="text"
          placeholder="e.g. Post-refuel check, engine running fine"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="submit" className="btn btn-primary" disabled={saving || isOverCapacity}>
          {saving ? "Saving…" : "Save Reading"}
        </button>
        {msg && (
          <span style={{ fontSize: 12, color: msg.type === "success" ? "var(--success)" : "var(--danger)" }}>
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}
