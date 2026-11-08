// src/lib/api.js — cliente HTTP del backend (seventwo-backend).
// - El accessToken vive SOLO en memoria (nunca en localStorage).
// - El refresh token es una cookie httpOnly que el navegador envía solo
//   (credentials: "include").
// - Ante un 401 en una llamada autenticada, renueva una vez y reintenta.

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// ── Estado de sesión en memoria (compartido entre layouts) ──────
let sesion = null; // { usuario, accessToken }
const oyentes = new Set();

export const getSesion = () => sesion;
export function setSesion(nueva) {
  sesion = nueva;
  oyentes.forEach((fn) => fn(sesion));
}
export function onSesion(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

async function peticion(ruta, { method = "GET", body, token } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${ruta}`, {
      method,
      credentials: "include",
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "No pudimos conectar con el servidor. Revisa tu conexión.");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new ApiError(res.status, json.error || "Ocurrió un error inesperado.", json.data);
  }
  return json;
}

// Un solo refresh en vuelo aunque lo pidan varios componentes a la vez.
let refreshEnCurso = null;
export function refrescarSesion() {
  refreshEnCurso ??= peticion("/auth/refresh", { method: "POST" })
    .then((r) => {
      setSesion(r.data);
      return r.data;
    })
    .catch((e) => {
      if (e.status === 401 || e.status === 403) setSesion(null);
      throw e;
    })
    .finally(() => {
      refreshEnCurso = null;
    });
  return refreshEnCurso;
}

/**
 * Llamada al backend. Con `auth: true` envía el accessToken y, si caducó,
 * renueva la sesión y reintenta una vez.
 * @returns {Promise<{ success: boolean, message?: string, data?: any }>}
 */
export async function api(ruta, { method, body, auth = false } = {}) {
  if (!auth) return peticion(ruta, { method, body });

  if (!sesion?.accessToken) await refrescarSesion();
  try {
    return await peticion(ruta, { method, body, token: sesion?.accessToken });
  } catch (error) {
    if (error.status !== 401) throw error;
    await refrescarSesion();
    return peticion(ruta, { method, body, token: sesion?.accessToken });
  }
}

// Solo rutas internas ("/algo"), nunca "//dominio" ni URLs absolutas.
export const sanearNext = (next, porDefecto = "/area-cliente") =>
  typeof next === "string" && /^\/(?![/\\])/.test(next) ? next : porDefecto;

export const urlGoogle = (next) => `${API_URL}/auth/google?next=${encodeURIComponent(sanearNext(next))}`;
