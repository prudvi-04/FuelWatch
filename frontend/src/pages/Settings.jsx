import React, { useState } from "react";
import RuleForm from "../components/RuleForm";
import { createGenerator, deleteGenerator } from "../api/api";

export default function Settings({ generators, rule, onRefresh, onRuleSaved }) {
  const [newId, setNewId] = useState("");
  const [newLoc, setNewLoc] = useState("");
  const [newCap, setNewCap] = useState("500");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleAddGen = async (e) => {
    e.preventDefault();
    if (!newId.trim() || !newLoc.trim()) {
      setMsg({ type: "error", text: "ID and location are required." }); return;
    }
    setSaving(true); setMsg(null);
    try {
      await createGenerator({
        id: newId.trim(),
        location: newLoc.trim(),
        capacityL: parseInt(newCap) || 500,
      });
      setNewId(""); setNewLoc(""); setNewCap("500");
      setMsg({ type: "success", text: "✓ Generator added successfully." });
      onRefresh();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.error || "Failed to add." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete ${id} and all its readings? This cannot be undone.`)) return;
    try {
      await deleteGenerator(id);
      onRefresh();
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card">
        <div className="card-title">⚙ Alert Rules</div>
        <div className="card-subtitle">
          Apply globally — control when and how alerts fire across all your generators.
        </div>
        <RuleForm rule={rule} onSaved={(updated) => { onRuleSaved(updated); }} />
      </div>

      <div className="card">
        <div className="card-title">⛽ My Generators</div>
        <div className="card-subtitle">
          {generators.length === 0
            ? "No generators yet. Add your first below."
            : `Managing ${generators.length} generator${generators.length > 1 ? "s" : ""}.`}
        </div>

        {generators.map((g, i) => (
          <div key={g.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 0",
            borderTop: i === 0 ? "none" : "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className="gen-avatar">
                {g.id.replace(/[^A-Z0-9]/gi, "").slice(-2).toUpperCase() || "G"}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{g.id}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  📍 {g.location} · {g.capacityL}L tank
                </div>
              </div>
            </div>
            <button className="btn btn-danger" onClick={() => handleDelete(g.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">+ Add Generator</div>
        <div className="card-subtitle">Add a new tank to monitor.</div>

        <form onSubmit={handleAddGen} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 14 }}>
            <div className="field">
              <label className="field-label">Generator ID</label>
              <input className="input" placeholder="GEN-05" value={newId} onChange={(e) => setNewId(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Location</label>
              <input className="input" placeholder="Block D — Canteen" value={newLoc} onChange={(e) => setNewLoc(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Capacity (L)</label>
              <input className="input" type="number" placeholder="500" value={newCap} onChange={(e) => setNewCap(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Adding…" : "Add Generator"}
            </button>
            {msg && (
              <span style={{ fontSize: 12, fontWeight: 500, color: msg.type === "success" ? "var(--success)" : "var(--danger)" }}>
                {msg.text}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
