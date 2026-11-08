// src/lib/solicitudes.js — constantes del flujo de presupuestos (iguales que en el backend).
export const TIPOS_PROYECTO = ["Página web", "Aplicación web", "App móvil", "Software a medida"];
export const RANGOS_PRESUPUESTO = ["Por definir", "Menos de $10M COP", "Más de $10M COP"];

export const ESTADOS = {
  nueva: "Nueva",
  en_revision: "En revisión",
  respondida: "Respondida",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  archivada: "Archivada",
};

export const fechaCorta = (iso) =>
  iso ? new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fechaHora = (iso) =>
  iso
    ? new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

/** "hace 3 min", "hace 2 h", "ayer"… */
export function haceCuanto(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "ahora";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  if (s < 172800) return "ayer";
  return fechaCorta(iso);
}

/** Validación en el cliente (el backend vuelve a validar todo). */
export function erroresSolicitud(f, { conSesion = false } = {}) {
  const e = {};
  if (!conSesion) {
    if ((f.nombre ?? "").trim().length < 2) e.nombre = "Escribe tu nombre.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((f.email ?? "").trim())) e.email = "Email no válido.";
  }
  if (f.telefono && !/^\+?[\d\s().-]{7,20}$/.test(f.telefono.trim())) e.telefono = "Teléfono no válido.";
  if (!TIPOS_PROYECTO.includes(f.tipo_proyecto)) e.tipo_proyecto = "Elige un tipo de proyecto.";
  if ((f.descripcion ?? "").trim().length < 20) e.descripcion = "Cuéntanos un poco más (mínimo 20 caracteres).";
  if (!f.acepta) e.acepta = "Necesitamos tu permiso para contactarte.";
  return e;
}
