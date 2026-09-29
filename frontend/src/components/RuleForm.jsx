import React, { useState, useEffect } from "react";
import { updateRule } from "../api/api";

export default function RuleForm({ rule, onSaved }) {
  const [minLevel, setMinLevel] = useState(rule?.minLevel ?? 20);
  const [dropRate, setDropRate] = useState(rule?.dropRate ?? 5);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (rule) {
      setMinLevel(rule.minLevel);
      setDropRate(rule.dropRate);
    }
  }, [rule]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const updated = await updateRule({
        minLevel: parseFloat(minLevel),
        dropRate: parseFloat(dropRate),
        cooldownHrs: 1, // sent but ignored by backend now
      });
      setMsg({ type: "success", text: "Rules saved successfully." });
      onSaved(updated);
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.error || "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="field">
          <label className="field-label">Min level (%)</label>
          <input className="input" type="number" min={0} max={100} step={1}
                 value={minLevel} onChange={(e) => setMinLevel(e.target.value)} />
          <div className="field-help">Alert fires when level falls below this.</div>
        </div>
        <div className="field">
          <label className="field-label">Max drop rate (%/hr)</label>
          <input className="input" type="number" min={0} max={100} step={0.5}
                 value={dropRate} onChange={(e) => setDropRate(e.target.value)} />
          <div className="field-help">Alert fires when hourly drop exceeds this.</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save Rules"}
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