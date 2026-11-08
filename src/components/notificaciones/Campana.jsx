"use client";

// Campana de notificaciones (Topbar del área de cliente y de /admin):
//   - bandeja guardada en la BD (/notificaciones), con contador de no leídas
//   - tiempo real con socket-core (SDK + JWT de 10 min pedido al backend)
//   - toast al llegar un aviso + evento "seventwo:notificacion" para que las
//     vistas abiertas se recarguen
//   - activar Web Push en este dispositivo (la "app instalada")
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, X } from "lucide-react";
import { api } from "@/lib/api";
import { connect } from "@/lib/socket-core.mjs";
import { activarPush, desactivarPush, estadoPush } from "@/lib/push";
import { haceCuanto } from "@/lib/solicitudes";
import "./campana.css";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "wss://ws.seventwo.tech";

export default function Campana() {
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [datos, setDatos] = useState({ notificaciones: [], no_leidas: 0 });
  const [toasts, setToasts] = useState([]);
  const [config, setConfig] = useState(null);
  const [push, setPush] = useState("inactivo");
  const [pushError, setPushError] = useState("");
  const [enVivo, setEnVivo] = useState(false);
  const caja = useRef(null);

  const cargar = useCallback(
    () => api("/notificaciones", { auth: true }).then((r) => setDatos(r.data)).catch(() => {}),
    [],
  );

  // Carga inicial + configuración de canales en vivo.
  useEffect(() => {
    let vigente = true;
    Promise.all([api("/notificaciones", { auth: true }), api("/notificaciones/config", { auth: true })])
      .then(([n, c]) => {
        if (!vigente) return;
        setDatos(n.data);
        setConfig(c.data);
      })
      .catch(() => {});
    estadoPush().then((e) => vigente && setPush(e)).catch(() => {});
    return () => {
      vigente = false;
    };
  }, []);

  // Tiempo real con socket-core (solo si el backend lo tiene configurado).
  useEffect(() => {
    if (!config?.socket) return;
    const sc = connect({
      url: SOCKET_URL,
      channel: "seventwo:notificaciones",
      device: "web",
      tokenProvider: async () => {
        const r = await api("/notificaciones/socket-token", { method: "POST", auth: true });
        return { token: r.data.token, expires_in: r.data.expires_in, role: "subscribe" };
      },
    });
    sc.on("status", (s) => setEnVivo(s === "connected"));
    sc.on("message", (ev) => {
      const n = ev?.payload?.notificacion;
      if (ev?.payload?.tipo !== "notificacion" || !n) return;
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((t) => [...t.slice(-2), { id, ...n }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 7000);
      window.dispatchEvent(new CustomEvent("seventwo:notificacion", { detail: n }));
      cargar();
    });
    return () => sc.close();
  }, [config?.socket, cargar]);

  // Cerrar el desplegable al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!abierta) return;
    const fuera = (e) => !caja.current?.contains(e.target) && setAbierta(false);
    const esc = (e) => e.key === "Escape" && setAbierta(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierta]);

  async function abrirNotificacion(n) {
    setAbierta(false);
    if (!n.leida_en && n.id) {
      api("/notificaciones/leer", { method: "POST", auth: true, body: { ids: [n.id] } }).then(cargar).catch(() => {});
    }
    if (n.url) router.push(n.url);
  }

  async function marcarTodas() {
    await api("/notificaciones/leer", { method: "POST", auth: true, body: {} }).catch(() => {});
    cargar();
  }

  async function alternarPush() {
    setPushError("");
    try {
      if (push === "activo") {
        await desactivarPush();
        setPush("inactivo");
      } else {
        await activarPush(config.vapidPublicKey);
        setPush("activo");
      }
    } catch (e) {
      setPushError(e.message);
      setPush(await estadoPush().catch(() => "inactivo"));
    }
  }

  const n = datos.no_leidas;
  return (
    <div className="campana" ref={caja}>
      <button
        type="button"
        className="icon-button notification"
        aria-label={n ? `Notificaciones: ${n} sin leer` : "Notificaciones"}
        aria-expanded={abierta}
        onClick={() => setAbierta((a) => !a)}
      >
        {n ? <BellRing aria-hidden="true" /> : <Bell aria-hidden="true" />}
        {n > 0 && <span className="campana-contador">{n > 9 ? "9+" : n}</span>}
      </button>

      {abierta && (
        <div className="campana-panel" role="dialog" aria-label="Notificaciones">
          <div className="campana-cabecera">
            <strong>Notificaciones</strong>
            <span className={`campana-vivo${enVivo ? " on" : ""}`} title={enVivo ? "Conectado en tiempo real" : "Sin conexión en tiempo real"}>
              {enVivo ? "● en vivo" : "○"}
            </span>
            {n > 0 && (
              <button type="button" className="campana-link" onClick={marcarTodas}>
                Marcar leídas
              </button>
            )}
          </div>
          <div className="campana-lista">
            {datos.notificaciones.length === 0 && <p className="campana-vacio">No tienes notificaciones.</p>}
            {datos.notificaciones.map((x) => (
              <button key={x.id} type="button" className={`campana-item${x.leida_en ? "" : " no-leida"}`} onClick={() => abrirNotificacion(x)}>
                <strong>{x.titulo}</strong>
                {x.cuerpo && <span>{x.cuerpo}</span>}
                <small>{haceCuanto(x.created_at)}</small>
              </button>
            ))}
          </div>
          {config?.push && push !== "no-soportado" && (
            <div className="campana-pie">
              {push === "bloqueado" ? (
                <span>Las notificaciones están bloqueadas en este navegador. Actívalas desde la configuración del sitio.</span>
              ) : (
                <button type="button" className="campana-link" onClick={alternarPush}>
                  {push === "activo" ? "📱 Desactivar notificaciones en este dispositivo" : "📱 Activar notificaciones en este dispositivo"}
                </button>
              )}
              {pushError && <span className="campana-error">{pushError}</span>}
            </div>
          )}
        </div>
      )}

      <div className="campana-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="campana-toast">
            <button type="button" className="campana-toast-cuerpo" onClick={() => abrirNotificacion(t)}>
              <strong>{t.titulo}</strong>
              {t.cuerpo && <span>{t.cuerpo}</span>}
            </button>
            <button type="button" className="campana-toast-cerrar" aria-label="Cerrar" onClick={() => setToasts((a) => a.filter((x) => x.id !== t.id))}>
              <X aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
