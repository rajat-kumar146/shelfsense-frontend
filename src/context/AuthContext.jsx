/**
 * Authentication Context
 * Provides auth state across the entire app
 */

import { createContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("ss_token"));
  const [loading, setLoading] = useState(true);

  // Fetch profile on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const { data } = await api.get("/auth/profile");
          setUser(data);
        } catch {
          // Token invalid - clear it
          localStorage.removeItem("ss_token");
          setToken(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("ss_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(
    async (name, email, password, companyName) => {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
        companyName,
      });
      localStorage.setItem("ss_token", data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("ss_token");
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};