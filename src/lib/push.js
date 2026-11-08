// src/lib/push.js — Web Push: registrar el service worker y suscribir este dispositivo.
import { api } from "@/lib/api";

export const pushSoportado = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

// La clave pública VAPID viene en base64url; PushManager la quiere en bytes.
function claveABytes(base64url) {
  const relleno = "=".repeat((4 - (base64url.length % 4)) % 4);
  const b64 = (base64url + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function registroSW() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

/** 'activo' | 'inactivo' | 'bloqueado' | 'no-soportado' */
export async function estadoPush() {
  if (!pushSoportado()) return "no-soportado";
  if (Notification.permission === "denied") return "bloqueado";
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "activo" : "inactivo";
}

/** Pide permiso, suscribe el dispositivo y lo registra en el backend. */
export async function activarPush(vapidPublicKey) {
  if (!pushSoportado()) throw new Error("Este navegador no admite notificaciones push.");
  const permiso = await Notification.requestPermission();
  if (permiso !== "granted") throw new Error("No diste permiso para mostrar notificaciones.");
  const reg = await registroSW();
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveABytes(vapidPublicKey) }));
  const { endpoint, keys } = sub.toJSON();
  await api("/notificaciones/push", { method: "POST", auth: true, body: { endpoint, keys } });
}

export async function desactivarPush() {
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await api("/notificaciones/push", { method: "DELETE", auth: true, body: { endpoint: sub.endpoint } }).catch(() => {});
  await sub.unsubscribe();
}
