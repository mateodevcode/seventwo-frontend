"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Overview from "./Overview";
import Invoices from "./Invoices";
import Payments from "./Payments";
import Service from "./Service";
import Support from "./Support";
import Help from "./Help";
import Quote from "./Quote";
import Seguridad from "@/components/area-cliente/Seguridad";
import Perfil from "@/components/area-cliente/Perfil";
import { useAuth } from "@/components/auth/AuthProvider";
import "./area-cliente.css";
import "@/components/logo/LogoModerno.css";
import { scrollbarStyles } from "@/data/data.styles.scrollbar";
import { navegacionPara } from "@/data/data.area-cliente";

export default function AreaClientePage() {
  const { usuario } = useAuth();
  // Secciones según el rol: un "usuario" solo ve perfil, presupuesto, seguridad y ayuda.
  const items = navegacionPara(usuario?.rol ?? "usuario");
  const permitido = (id) => items.some((item) => item.id === id);

  const [elegido, setActive] = useState(null);
  // Sección activa: la elegida si el rol la permite; si no, la primera disponible
  // (resumen para clientes, perfil para usuarios).
  const active = elegido && permitido(elegido) ? elegido : items[0]?.id;
  const contentRef = useRef(null);
  const current = items.find((item) => item.id === active) ?? { label: "" };

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [active]);

  return (
    <main className="cliente-root">
      <div className="portal-shell">
        <Sidebar items={items} active={active} onNavigate={setActive} />
        <section ref={contentRef} className="portal-content">
          <Topbar title={current.label} />
          <div className="content-inner">
            {active === "resumen" && <Overview onNavigate={setActive} />}
            {active === "datos" && <Perfil />}
            {active === "facturas" && <Invoices />}
            {active === "pagos" && <Payments onNavigate={setActive} />}
            {active === "servicio" && <Service />}
            {active === "soporte" && <Support />}
            {active === "seguridad" && <Seguridad />}
            {active === "ayuda" && <Help />}
            {active === "cotizar" && <Quote />}
          </div>
        </section>
      </div>

      <style>{scrollbarStyles.home}</style>
    </main>
  );
}
