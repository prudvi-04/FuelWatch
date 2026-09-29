import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const t = localStorage.getItem("fw_token");
    const u = localStorage.getItem("fw_username");
    return t && u ? { token: t, username: u } : null;
  });

  const login = (token, username) => {
    localStorage.setItem("fw_token", token);
    localStorage.setItem("fw_username", username);
    setAuth({ token, username });
  };

  const logout = () => {
    localStorage.removeItem("fw_token");
    localStorage.removeItem("fw_username");
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
