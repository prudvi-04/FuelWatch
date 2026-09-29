import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8089/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fw_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      const path = err.config?.url || "";
      if (!path.includes("/auth/")) {
        localStorage.removeItem("fw_token");
        localStorage.removeItem("fw_username");
        window.location.reload();
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login    = (username, password) =>
  api.post("/auth/login",    { username, password }).then((r) => r.data);
export const register = (username, password, securityQuestion, securityAnswer) =>
  api.post("/auth/register", {
    username,
    password,
    securityQuestion,
    securityAnswer,
  }).then((r) => r.data);

// ── Generators ────────────────────────────────────────────────────────────────
export const getGenerators   = () => api.get("/generators").then((r) => r.data);
export const getGenerator    = (id) => api.get(`/generators/${id}`).then((r) => r.data);
export const createGenerator = (data) => api.post("/generators", data).then((r) => r.data);
export const deleteGenerator = (id) => api.delete(`/generators/${id}`);

// ── Readings ──────────────────────────────────────────────────────────────────
export const getReadings = (genId) =>
  api.get(`/generators/${genId}/readings`).then((r) => r.data);
export const logReading  = (genId, data) =>
  api.post(`/generators/${genId}/readings`, data).then((r) => r.data);

// ── Refuels ───────────────────────────────────────────────────────────────────
export const getRefuels = (genId, from) =>
  api.get(`/generators/${genId}/refuels`, {
    params: { from: from?.toISOString() },
  }).then((r) => r.data);

export const getAllRefuels = async (generatorIds, from) => {
  const results = await Promise.all(generatorIds.map((id) => getRefuels(id, from)));
  return results.flat().sort((a, b) => new Date(b.ts) - new Date(a.ts));
};

// ── Alerts ────────────────────────────────────────────────────────────────────
export const getAlerts     = (all = false) =>
  api.get("/alerts", { params: { all } }).then((r) => r.data);
export const resolveAlert  = (id) =>
  api.put(`/alerts/${id}/resolve`).then((r) => r.data);

// ── Rules ─────────────────────────────────────────────────────────────────────
export const getRule    = () => api.get("/rules").then((r) => r.data);
export const updateRule = (data) => api.put("/rules", data).then((r) => r.data);

export const getQuestionForReset = (username) =>
  api.post("/auth/forgot-password/question", { username }).then((r) => r.data);

export const resetPassword = (username, securityAnswer, newPassword) =>
  api.post("/auth/forgot-password/reset", {
    username,
    securityAnswer,
    newPassword,
  }).then((r) => r.data);

export default api;
