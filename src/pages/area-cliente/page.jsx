"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Overview from "./Overview";
import ClientData from "./ClientData";
import Invoices from "./Invoices";
import Payments from "./Payments";
import Service from "./Service";
import Support from "./Support";
import Help from "./Help";
import Quote from "./Quote";
import "./area-cliente.css";
import "@/components/logo/LogoModerno.css";
import { scrollbarStyles } from "@/data/data.styles.scrollbar";
import { navigation } from "@/data/data.area-cliente";

export default function AreaClientePage() {
  const [active, setActive] = useState("resumen");
  const contentRef = useRef(null);
  const current = navigation.find((item) => item.id === active) ?? {
    label: "Cotizar nuevo proyecto",
  };

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [active]);

  return (
    <main className="cliente-root">
      <div className="portal-shell">
        <Sidebar active={active} onNavigate={setActive} />
        <section ref={contentRef} className="portal-content">
          <Topbar title={current.label} />
          <div className="content-inner">
            {active === "resumen" && <Overview onNavigate={setActive} />}
            {active === "datos" && <ClientData />}
            {active === "facturas" && <Invoices />}
            {active === "pagos" && <Payments onNavigate={setActive} />}
            {active === "servicio" && <Service />}
            {active === "soporte" && <Support />}
            {active === "ayuda" && <Help />}
            {active === "cotizar" && <Quote />}
          </div>
        </section>
      </div>

      <style>{scrollbarStyles.home}</style>
    </main>
  );
}
