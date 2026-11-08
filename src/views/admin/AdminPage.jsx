"use client";

// Área /admin (admin y superadmin). Reutiliza el shell y estilos del área de cliente.
// La URL manda: /admin?seccion=solicitudes&solicitud=12 (enlaces de emails y notificaciones).
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Inbox, UserRound, Users } from "lucide-react";
import Sidebar from "@/views/area-cliente/components/Sidebar";
import Topbar from "@/views/area-cliente/components/Topbar";
import AdminUsuarios from "./AdminUsuarios";
import AdminSolicitudes from "./AdminSolicitudes";
import { useAuth } from "@/components/auth/AuthProvider";
import { api } from "@/lib/api";
import { ETIQUETA_ROL } from "@/lib/roles";
import { scrollbarStyles } from "@/data/data.styles.scrollbar";
import "@/views/area-cliente/area-cliente.css";
import "@/components/logo/LogoModerno.css";
import "./admin.css";

export default function AdminPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [nuevas, setNuevas] = useState(0);

  const solicitudId = params.get("solicitud");
  const active = params.get("seccion") ?? (solicitudId ? "solicitudes" : "solicitudes");

  const ir = useCallback(
    (seccion, solicitud) => {
      const qs = new URLSearchParams({ seccion });
      if (solicitud) qs.set("solicitud", String(solicitud));
      router.push(`${pathname}?${qs}`, { scroll: false });
    },
    [router, pathname],
  );

  // Contador de solicitudes nuevas en la barra lateral (se refresca con cada aviso).
  useEffect(() => {
    let vigente = true;
    const contar = () =>
      api("/admin/solicitudes?estado=nueva", { auth: true })
        .then((r) => vigente && setNuevas(r.data.conteos.nueva))
        .catch(() => {});
    contar();
    window.addEventListener("seventwo:notificacion", contar);
    return () => {
      vigente = false;
      window.removeEventListener("seventwo:notificacion", contar);
    };
  }, [solicitudId]);

  const secciones = [
    { id: "solicitudes", label: "Solicitudes", icon: Inbox, badge: nuevas ? String(nuevas) : null },
    { id: "usuarios", label: "Usuarios y roles", icon: Users },
  ];
  const current = secciones.find((s) => s.id === active) ?? secciones[0];

  return (
    <main className="cliente-root">
      <div className="portal-shell">
        <Sidebar
          items={secciones}
          active={current.id}
          onNavigate={(id) => ir(id)}
          tag={`Admin · ${ETIQUETA_ROL[usuario?.rol] ?? ""}`}
          enlace={{ href: "/area-cliente", label: "Área de cliente", icon: UserRound }}
        />
        <section className="portal-content">
          <Topbar title={current.label} seccion="Administración" />
          <div className="content-inner">
            {current.id === "solicitudes" && (
              <AdminSolicitudes
                key={solicitudId ?? "lista"}
                idInicial={solicitudId}
                onCambiarId={(id) => ir("solicitudes", id)}
              />
            )}
            {current.id === "usuarios" && <AdminUsuarios />}
          </div>
        </section>
      </div>
      <style>{scrollbarStyles.home}</style>
    </main>
  );
}
