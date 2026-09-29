import React, { useState } from "react";
import { login, register, getQuestionForReset, resetPassword } from "../api/api";
import { useAuth } from "../AuthContext";

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What's your mother's maiden name?",
  "What was the name of your first school?",
  "What's your favourite book?",
];

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [err, setErr] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Forgot password flow state
  const [forgotStep, setForgotStep] = useState(1);
  const [fetchedQuestion, setFetchedQuestion] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const { login: doLogin } = useAuth();

  const validatePassword = (pwd) => {
    if (pwd.length < 6) return "Password must be at least 6 characters";
    if (!/[A-Za-z]/.test(pwd)) return "Password must contain a letter";
    if (!/\d/.test(pwd)) return "Password must contain a number";
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pwd)) return "Password must contain a symbol";
    return null;
  };

  const reset = () => {
    setErr(null); setInfo(null); setLoading(false);
    setUsername(""); setPassword(""); setSecurityAnswer(""); setNewPassword("");
    setForgotStep(1); setFetchedQuestion("");
  };

  const switchMode = (m) => { reset(); setMode(m); };

  // ── Login ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setErr(null);
    if (username.trim().length < 3) { setErr("Enter your username"); return; }
    if (!password) { setErr("Enter your password"); return; }
    setLoading(true);
    try {
      const data = await login(username.trim(), password);
      doLogin(data.token, data.username);
    } catch (e) {
      setErr(e.response?.data?.error || "Login failed");
    } finally { setLoading(false); }
  };

  // ── Register ──
  const handleRegister = async (e) => {
    e.preventDefault();
    setErr(null);
    if (username.trim().length < 3) { setErr("Username must be at least 3 characters"); return; }
    const pe = validatePassword(password);
    if (pe) { setErr(pe); return; }
    if (securityAnswer.trim().length < 2) { setErr("Security answer required"); return; }
    setLoading(true);
    try {
      const data = await register(
        username.trim(),
        password,
        securityQuestion,
        securityAnswer.trim()
      );
      doLogin(data.token, data.username);
    } catch (e) {
      setErr(e.response?.data?.error || "Registration failed");
    } finally { setLoading(false); }
  };

  // ── Forgot password Step 1 — fetch question ──
  const handleFetchQuestion = async (e) => {
    e.preventDefault();
    setErr(null);
    if (username.trim().length < 3) { setErr("Enter your username"); return; }
    setLoading(true);
    try {
      const data = await getQuestionForReset(username.trim());
      setFetchedQuestion(data.question);
      setForgotStep(2);
    } catch (e) {
      setErr(e.response?.data?.error || "Could not find that account");
    } finally { setLoading(false); }
  };

  // ── Forgot password Step 2 — verify and reset ──
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErr(null);
    if (securityAnswer.trim().length < 2) { setErr("Enter your answer"); return; }
    const pe = validatePassword(newPassword);
    if (pe) { setErr(pe); return; }
    setLoading(true);
    try {
      await resetPassword(username.trim(), securityAnswer.trim(), newPassword);
      setInfo("Password reset! Sign in with your new password.");
      setTimeout(() => switchMode("login"), 1500);
    } catch (e) {
      setErr(e.response?.data?.error || "Reset failed");
    } finally { setLoading(false); }
  };

  // ── Live password reqs (for register + reset) ──
  const showReqs = (mode === "register" && password.length > 0) ||
                   (mode === "forgot" && forgotStep === 2 && newPassword.length > 0);
  const pwd = mode === "register" ? password : newPassword;
  const reqs = showReqs ? [
    { label: "At least 6 characters",      ok: pwd.length >= 6 },
    { label: "Contains a letter (A–z)",    ok: /[A-Za-z]/.test(pwd) },
    { label: "Contains a number (0–9)",    ok: /\d/.test(pwd) },
    { label: "Contains a symbol (!@#…)",   ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pwd) },
  ] : [];

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-brand">
          <div className="auth-brand-mark">FW</div>
          <div>
            <div className="auth-title">FuelWatch</div>
            <div className="auth-sub">Generator tank monitor</div>
          </div>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.02em" }}>
          {mode === "login"    && "Welcome back 👋"}
          {mode === "register" && "Create your account"}
          {mode === "forgot"   && (forgotStep === 1 ? "Reset password" : "Answer your question")}
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 28 }}>
          {mode === "login"    && "Sign in to manage your generators."}
          {mode === "register" && "Pick a security question — you'll need it if you forget your password."}
          {mode === "forgot"   && (forgotStep === 1
              ? "Enter your username and we'll show your security question."
              : "Answer correctly and set a new password.")}
        </p>

        {/* ─── LOGIN FORM ─── */}
        {mode === "login" && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="field">
              <label className="field-label">Username</label>
              <input className="input" type="text" value={username}
                     onChange={(e) => setUsername(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <input className="input" type="password" value={password}
                     onChange={(e) => setPassword(e.target.value)} />
              <div style={{ textAlign: "right", marginTop: 4 }}>
                <span className="toggle-link" style={{ fontSize: 12 }}
                      onClick={() => switchMode("forgot")}>
                  Forgot password?
                </span>
              </div>
            </div>
            {err && <div className="alert-banner error">⚠ {err}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading}
                    style={{ marginTop: 6, padding: "12px 18px" }}>
              {loading ? "Please wait…" : "Sign in →"}
            </button>
          </form>
        )}

        {/* ─── REGISTER FORM ─── */}
        {mode === "register" && (
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="field">
              <label className="field-label">Username</label>
              <input className="input" type="text" value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     placeholder="At least 3 characters" autoFocus />
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <input className="input" type="password" value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="Letter, number & symbol required" />
              {reqs.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10, padding: "12px 14px", background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)" }}>
                  {reqs.map((req, i) => (
                    <div key={i} style={{
                      fontSize: 12,
                      color: req.ok ? "var(--success)" : "var(--text-muted)",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span style={{
                        width: 14, height: 14, borderRadius: "50%",
                        background: req.ok ? "var(--success-bg)" : "var(--bg-tertiary)",
                        color: req.ok ? "var(--success)" : "transparent",
                        display: "grid", placeItems: "center",
                        fontSize: 9, fontWeight: 700,
                      }}>{req.ok ? "✓" : ""}</span>
                      {req.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="field">
              <label className="field-label">Security question</label>
              <select className="select" value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}>
                {SECURITY_QUESTIONS.map((q) => <option key={q}>{q}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Your answer</label>
              <input className="input" type="text" value={securityAnswer}
                     onChange={(e) => setSecurityAnswer(e.target.value)}
                     placeholder="Remember this exactly — you'll need it to reset" />
              <div className="field-help">
                Answer is case-insensitive and stored securely.
              </div>
            </div>
            {err && <div className="alert-banner error">⚠ {err}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading}
                    style={{ marginTop: 6, padding: "12px 18px" }}>
              {loading ? "Please wait…" : "Create account →"}
            </button>
          </form>
        )}

        {/* ─── FORGOT — STEP 1 ─── */}
        {mode === "forgot" && forgotStep === 1 && (
          <form onSubmit={handleFetchQuestion} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="field">
              <label className="field-label">Username</label>
              <input className="input" type="text" value={username}
                     onChange={(e) => setUsername(e.target.value)} autoFocus />
            </div>
            {err && <div className="alert-banner error">⚠ {err}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading}
                    style={{ marginTop: 6, padding: "12px 18px" }}>
              {loading ? "Looking up…" : "Continue →"}
            </button>
          </form>
        )}

        {/* ─── FORGOT — STEP 2 ─── */}
        {mode === "forgot" && forgotStep === 2 && (
          <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ padding: "12px 14px", background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 4 }}>
                Your security question
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                {fetchedQuestion}
              </div>
            </div>
            <div className="field">
              <label className="field-label">Your answer</label>
              <input className="input" type="text" value={securityAnswer}
                     onChange={(e) => setSecurityAnswer(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label className="field-label">New password</label>
              <input className="input" type="password" value={newPassword}
                     onChange={(e) => setNewPassword(e.target.value)}
                     placeholder="Letter, number & symbol required" />
              {reqs.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10, padding: "12px 14px", background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)" }}>
                  {reqs.map((req, i) => (
                    <div key={i} style={{
                      fontSize: 12, color: req.ok ? "var(--success)" : "var(--text-muted)",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span style={{
                        width: 14, height: 14, borderRadius: "50%",
                        background: req.ok ? "var(--success-bg)" : "var(--bg-tertiary)",
                        color: req.ok ? "var(--success)" : "transparent",
                        display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700,
                      }}>{req.ok ? "✓" : ""}</span>
                      {req.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {err  && <div className="alert-banner error">⚠ {err}</div>}
            {info && <div className="alert-banner success">✓ {info}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading}
                    style={{ marginTop: 6, padding: "12px 18px" }}>
              {loading ? "Resetting…" : "Reset password"}
            </button>
          </form>
        )}

        {/* ─── BOTTOM LINK ─── */}
        <div style={{ textAlign: "center", marginTop: 22, fontSize: 13, color: "var(--text-secondary)" }}>
          {mode === "login" && (<>New to FuelWatch?{" "}
            <span className="toggle-link" onClick={() => switchMode("register")}>Create an account</span></>)}
          {mode === "register" && (<>Already have an account?{" "}
            <span className="toggle-link" onClick={() => switchMode("login")}>Sign in</span></>)}
          {mode === "forgot" && (<>Remembered your password?{" "}
            <span className="toggle-link" onClick={() => switchMode("login")}>Sign in</span></>)}
        </div>
      </div>
    </div>
  );
}