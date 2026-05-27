import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "./api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [psicologa, setPsicologa] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("psicare_psicologa");
    if (stored) {
      try {
        setPsicologa(JSON.parse(stored));
      } catch (e) {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    setPsicologa(res.psicologa);
    localStorage.setItem("psicare_psicologa", JSON.stringify(res.psicologa));
    localStorage.setItem("psicare_token", res.token);
    return res.psicologa;
  };

  const logout = () => {
    setPsicologa(null);
    localStorage.removeItem("psicare_psicologa");
    localStorage.removeItem("psicare_token");
  };

  const updatePsicologa = (data) => {
    setPsicologa(data);
    localStorage.setItem("psicare_psicologa", JSON.stringify(data));
  };

  return (
    <AuthContext.Provider value={{ psicologa, loading, login, logout, updatePsicologa }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
