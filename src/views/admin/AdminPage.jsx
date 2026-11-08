"use client";

// Área /admin (admin y superadmin). Reutiliza el shell y estilos del área de cliente.
import { useState } from "react";
import { UserRound, Users } from "lucide-react";
import Sidebar from "@/views/area-cliente/components/Sidebar";
import Topbar from "@/views/area-cliente/components/Topbar";
import AdminUsuarios from "./AdminUsuarios";
import { useAuth } from "@/components/auth/AuthProvider";
import { ETIQUETA_ROL } from "@/lib/roles";
import { scrollbarStyles } from "@/data/data.styles.scrollbar";
import "@/views/area-cliente/area-cliente.css";
import "@/components/logo/LogoModerno.css";
import "./admin.css";

const SECCIONES = [{ id: "usuarios", label: "Usuarios y roles", icon: Users }];

export default function AdminPage() {
  const { usuario } = useAuth();
  const [active, setActive] = useState("usuarios");
  const current = SECCIONES.find((s) => s.id === active);

  return (
    <main className="cliente-root">
      <div className="portal-shell">
        <Sidebar
          items={SECCIONES}
          active={active}
          onNavigate={setActive}
          tag={`Admin · ${ETIQUETA_ROL[usuario?.rol] ?? ""}`}
          enlace={{ href: "/area-cliente", label: "Área de cliente", icon: UserRound }}
        />
        <section className="portal-content">
          <Topbar title={current.label} seccion="Administración" />
          <div className="content-inner">{active === "usuarios" && <AdminUsuarios />}</div>
        </section>
      </div>
      <style>{scrollbarStyles.home}</style>
    </main>
  );
}
