import { useState, useEffect, useCallback } from "react";
import * as api from "../api/api";

export function useFuelWatch() {
  const [generators, setGenerators] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [rule, setRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [gens, alts, rl] = await Promise.all([
        api.getGenerators(),
        api.getAlerts(),
        api.getRule(),
      ]);
      setGenerators(gens);
      setAlerts(alts);
      setRule(rl);
    } catch (e) {
      // 401 is handled by interceptor — only set other errors
      if (e.response?.status !== 401 && e.response?.status !== 403) {
        setError(e.response?.data?.error || e.message || "Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  return { generators, alerts, rule, loading, error, refresh: load, setRule, setAlerts };
}
