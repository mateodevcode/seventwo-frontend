"use client";

// Contexto de sesión. Al montar recupera la sesión con la cookie refresh
// (salvo que ya esté en memoria por una navegación previa).
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getSesion, onSesion, refrescarSesion, setSesion } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sesion, setEstado] = useState(getSesion);
  const [cargando, setCargando] = useState(() => !getSesion());

  useEffect(() => {
    const quitar = onSesion(setEstado);
    if (!getSesion()) {
      refrescarSesion()
        .catch(() => {})
        .finally(() => setCargando(false));
    }
    return quitar;
  }, []);

  const iniciarSesion = useCallback((data) => setSesion(data), []);

  const actualizarUsuario = useCallback((usuario) => {
    const actual = getSesion();
    if (actual) setSesion({ ...actual, usuario });
  }, []);

  const cerrarSesion = useCallback(async ({ todas = false } = {}) => {
    try {
      await api(todas ? "/auth/logout-todo" : "/auth/logout", { method: "POST", auth: todas });
    } finally {
      setSesion(null);
    }
  }, []);

  const valor = {
    usuario: sesion?.usuario ?? null,
    estado: cargando ? "cargando" : sesion ? "autenticado" : "anonimo",
    iniciarSesion,
    actualizarUsuario,
    cerrarSesion,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

// Sin provider (un componente usado fuera de las rutas con <AuthProvider>)
// se comporta como visitante anónimo en vez de romper el render.
const SIN_PROVIDER = {
  usuario: null,
  estado: "anonimo",
  iniciarSesion: () => {},
  actualizarUsuario: () => {},
  cerrarSesion: async () => {},
};

export function useAuth() {
  return useContext(AuthContext) ?? SIN_PROVIDER;
}

export const iniciales = (nombre = "") =>
  nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";
