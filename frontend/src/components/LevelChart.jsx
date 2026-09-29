import { Chart as ChartJS } from "chart.js/auto";
import { Line } from "react-chartjs-2";
import { useState, useEffect, useMemo } from "react";
import { getReadings } from "../api/api";
import { format } from "date-fns";

const RANGES = [
  { label: "24h", days: 1 },
  { label: "7d",  days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
];

export default function LevelChart({ genId, rule }) {
  const [readings, setReadings] = useState([]);
  const [rangeDays, setRangeDays] = useState(7);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!genId) return;
    setLoading(true);
    getReadings(genId)
      .then(setReadings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [genId]);

  const minLvl = rule ? parseFloat(rule.minLevel) : 20;
  const warnLvl = minLvl + 10;

  const filtered = useMemo(() => {
    const cutoff = Date.now() - rangeDays * 86400000;
    return [...readings]
      .filter(r => new Date(r.ts).getTime() >= cutoff)
      .sort((a, b) => new Date(a.ts) - new Date(b.ts));
  }, [readings, rangeDays]);

  const fmtLabel = (ts) => {
    const d = new Date(ts);
    if (rangeDays <= 1)  return format(d, "HH:mm");
    if (rangeDays <= 7)  return format(d, "dd MMM HH:mm");
    return format(d, "dd MMM");
  };

  const labels = filtered.map(r => fmtLabel(r.ts));
  const data = filtered.map(r => parseFloat(r.levelPct));

  const chartData = {
    labels,
    datasets: [
      {
        label: "Fuel level",
        data,
        borderWidth: 2,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.08)",
        fill: true,
        pointRadius: filtered.map(r => r.manual ? 4 : 2),
        pointHoverRadius: 6,
        pointBackgroundColor: filtered.map(r => r.manual ? "#f59e0b" : "#2563eb"),
        pointBorderColor: "#fff",
        pointBorderWidth: 1.5,
        tension: 0.2,
        segment: {
          borderColor: (ctx) => {
            const v = ctx.p1.parsed.y;
            if (v < minLvl)  return "#b91c1c";
            if (v < warnLvl) return "#b45309";
            return "#2563eb";
          },
        },
      },
      {
        label: "Min threshold",
        data: data.map(() => minLvl),
        borderColor: "rgba(185, 28, 28, 0.6)",
        borderDash: [6, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      },
      {
        label: "Warning",
        data: data.map(() => warnLvl),
        borderColor: "rgba(180, 83, 9, 0.45)",
        borderDash: [3, 4],
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: "index", intersect: false },
    scales: {
      x: {
        ticks: { font: { size: 10 }, maxTicksLimit: 8, color: "#94a0ad" },
        grid: { display: false },
      },
      y: {
        min: 0, max: 100,
        ticks: { font: { size: 10 }, callback: v => v + "%", stepSize: 20, color: "#94a0ad" },
        grid: { color: "rgba(15, 23, 42, 0.05)" },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(26, 35, 50, 0.95)",
        padding: 10,
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        callbacks: {
          title: (items) => {
            const ts = filtered[items[0].dataIndex]?.ts;
            return ts ? format(new Date(ts), "dd MMM yyyy, HH:mm") : "";
          },
          label: (ctx) => {
            if (ctx.datasetIndex !== 0) return null;
            const r = filtered[ctx.dataIndex];
            const lines = [`Level: ${ctx.parsed.y.toFixed(1)}%`];
            if (r?.manual) lines.push(`Manual entry${r.note ? ` — ${r.note}` : ""}`);
            return lines;
          },
        },
      },
    },
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {RANGES.map((o) => (
          <button
            key={o.days}
            className={`btn-pill ${rangeDays === o.days ? "active" : ""}`}
            onClick={() => setRangeDays(o.days)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div style={{ height: 260, position: "relative" }}>
        {loading && <div className="empty-state">Loading…</div>}
        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            No readings in this range.<br />
            <span style={{ fontSize: 12 }}>Switch range or log a reading.</span>
          </div>
        )}
        {!loading && filtered.length > 0 && <Line data={chartData} options={options} />}
      </div>

      {filtered.length > 0 && (
        <div style={{ display: "flex", gap: 20, marginTop: 12, fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap" }}>
          <span><b style={{ color: "var(--text-secondary)" }}>{filtered.length}</b> readings</span>
          <span>Min <b style={{ color: "var(--text-secondary)" }}>{Math.min(...data).toFixed(1)}%</b></span>
          <span>Max <b style={{ color: "var(--text-secondary)" }}>{Math.max(...data).toFixed(1)}%</b></span>
          <span>Latest <b style={{ color: "var(--text-secondary)" }}>{data[data.length - 1].toFixed(1)}%</b></span>
        </div>
      )}
    </div>
  );
}
