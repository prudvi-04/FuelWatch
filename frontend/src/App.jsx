import React, { useState } from "react";
import { useFuelWatch } from "./hooks/useFuelWatch";
import { useAuth } from "./AuthContext";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import LogPage from "./pages/LogPage";
import RefuelLog from "./pages/RefuelLog";
import Settings from "./pages/Settings";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "log",       label: "Log Reading" },
  { key: "refuels",   label: "Refuel Log" },
  { key: "settings",  label: "Settings" },
];

export default function App() {
  const { auth, logout } = useAuth();
  const [tab, setTab] = useState("dashboard");

  if (!auth) return <LoginPage />;

  return <AuthedApp tab={tab} setTab={setTab} username={auth.username} onLogout={logout} />;
}

function AuthedApp({ tab, setTab, username, onLogout }) {
  const { generators, alerts, rule, loading, error, refresh, setRule, setAlerts } = useFuelWatch();

  const handleAlertResolved = (id) => setAlerts((prev) => prev.filter((a) => a.id !== id));
  const unresolved = alerts.filter((a) => !a.resolved);
  const initial = username[0]?.toUpperCase() || "U";

  return (
    <div className="app-shell">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-mark">FW</div>
          <div>FuelWatch</div>
        </div>

        <div className="topbar-right">
          {unresolved.length > 0 && (
            <span className="badge badge-danger badge-dot">
              {unresolved.length} unresolved
            </span>
          )}

          <div className="user-chip">
            <div className="user-avatar">{initial}</div>
            <span>{username}</span>
          </div>

          <button className="btn-ghost" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      <main className="main">
        {/* Loading */}
        {loading && (
          <div className="empty-state">
            <div style={{ fontSize: 14 }}>Loading your generators…</div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="card" style={{ borderColor: "var(--danger)" }}>
            <div className="card-title text-danger">Connection error</div>
            <div className="card-subtitle">{error}</div>
            <button className="btn btn-secondary" onClick={refresh}>Retry</button>
          </div>
        )}

        {/* Tabs + content */}
        {!loading && !error && (
          <>
            <nav className="tabs">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`tab ${tab === t.key ? "active" : ""}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            {tab === "dashboard" && (
              <Dashboard
                generators={generators}
                alerts={unresolved}
                rule={rule}
                onAlertResolved={handleAlertResolved}
              />
            )}
            {tab === "log" && <LogPage generators={generators} onLogged={refresh} />}
            {tab === "refuels" && <RefuelLog generators={generators} />}
            {tab === "settings" && (
              <Settings
                generators={generators}
                rule={rule}
                onRefresh={refresh}
                onRuleSaved={(updated) => { setRule(updated); refresh(); }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
