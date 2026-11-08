"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Overview from "./Overview";
import Proyectos from "./Proyectos";
import EnPreparacion from "./EnPreparacion";
import Help from "./Help";
import Seguridad from "@/components/area-cliente/Seguridad";
import Perfil from "@/components/area-cliente/Perfil";
import Solicitudes from "@/components/area-cliente/Solicitudes";
import { useAuth } from "@/components/auth/AuthProvider";
import { refrescarSesion } from "@/lib/api";
import "./area-cliente.css";
import "@/components/logo/LogoModerno.css";
import { scrollbarStyles } from "@/data/data.styles.scrollbar";
import { navegacionPara } from "@/data/data.area-cliente";

export default function AreaClientePage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // Secciones según el rol: un "usuario" solo ve perfil, presupuesto, seguridad y ayuda.
  const items = navegacionPara(usuario?.rol ?? "usuario");
  const permitido = (id) => items.some((item) => item.id === id);

  // La URL manda (?seccion=cotizar&solicitud=S-0012): así los enlaces de emails y
  // notificaciones abren la sección correcta y "atrás" del navegador funciona.
  const elegido = params.get("seccion");
  const solicitud = params.get("solicitud");
  const proyecto = params.get("proyecto");
  // Enlaces antiguos a "Servicio contratado" → Mis proyectos.
  const pedido = elegido === "servicio" ? "proyectos" : elegido;
  const active = pedido && permitido(pedido) ? pedido : items[0]?.id;
  const setActive = useCallback(
    (id) => router.push(`${pathname}?seccion=${encodeURIComponent(id)}`, { scroll: false }),
    [router, pathname],
  );
  const abrirProyecto = useCallback(
    (codigo) =>
      router.push(
        `${pathname}?seccion=proyectos${codigo ? `&proyecto=${encodeURIComponent(codigo)}` : ""}`,
        { scroll: false },
      ),
    [router, pathname],
  );
  const contentRef = useRef(null);
  const current = items.find((item) => item.id === active) ?? { label: "" };

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [active]);

  // Si el equipo crea su proyecto mientras está conectado, la cuenta acaba de
  // pasar a "cliente": se renueva la sesión para mostrar las secciones nuevas.
  useEffect(() => {
    const fn = (ev) => ev.detail?.tipo === "proyecto_creado" && refrescarSesion().catch(() => {});
    window.addEventListener("seventwo:notificacion", fn);
    return () => window.removeEventListener("seventwo:notificacion", fn);
  }, []);

  return (
    <main className="cliente-root">
      <div className="portal-shell">
        <Sidebar items={items} active={active} onNavigate={setActive} />
        <section ref={contentRef} className="portal-content">
          <Topbar title={current.label} />
          <div className="content-inner">
            {active === "resumen" && <Overview onNavigate={setActive} onAbrirProyecto={abrirProyecto} />}
            {active === "proyectos" && (
              <Proyectos key={proyecto ?? "lista"} codigoInicial={proyecto} onAbrir={abrirProyecto} onNavigate={setActive} />
            )}
            {active === "datos" && <Perfil />}
            {["facturas", "pagos", "soporte"].includes(active) && <EnPreparacion seccion={active} onNavigate={setActive} />}
            {active === "seguridad" && <Seguridad />}
            {active === "ayuda" && <Help />}
            {active === "cotizar" && <Solicitudes key={solicitud ?? "lista"} codigoInicial={solicitud} />}
          </div>
        </section>
      </div>

      <style>{scrollbarStyles.home}</style>
    </main>
  );
}
