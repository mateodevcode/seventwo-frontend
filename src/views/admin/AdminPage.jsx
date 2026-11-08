"use client";

// Área /admin (admin y superadmin). Reutiliza el shell y estilos del área de cliente.
// La URL manda (enlaces de emails y notificaciones):
//   /admin?seccion=solicitudes&solicitud=12
//   /admin?seccion=clientes&cliente=3&proyecto=7
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Building2, Inbox, Layers, UserRound, Users } from "lucide-react";
import Sidebar from "@/views/area-cliente/components/Sidebar";
import Topbar from "@/views/area-cliente/components/Topbar";
import AdminUsuarios from "./AdminUsuarios";
import AdminSolicitudes from "./AdminSolicitudes";
import AdminClientes from "./AdminClientes";
import AdminCatalogo from "./AdminCatalogo";
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
  const clienteId = params.get("cliente");
  const proyectoId = params.get("proyecto");
  const active = params.get("seccion") ?? (clienteId || proyectoId ? "clientes" : "solicitudes");

  // ir("clientes", { cliente: 3, proyecto: 7 })
  const ir = useCallback(
    (seccion, extra = {}) => {
      const qs = new URLSearchParams({ seccion });
      for (const [k, v] of Object.entries(extra)) if (v) qs.set(k, String(v));
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
    { id: "clientes", label: "Clientes", icon: Building2 },
    { id: "catalogo", label: "Catálogo", icon: Layers },
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
                onCambiarId={(id) => ir("solicitudes", { solicitud: id })}
                onAbrirProyecto={(cliente, proyecto) => ir("clientes", { cliente, proyecto })}
              />
            )}
            {current.id === "clientes" && (
              <AdminClientes
                clienteId={clienteId}
                proyectoId={proyectoId}
                onIr={(extra) => ir("clientes", extra)}
                onAbrirSolicitud={(id) => ir("solicitudes", { solicitud: id })}
              />
            )}
            {current.id === "catalogo" && <AdminCatalogo />}
            {current.id === "usuarios" && <AdminUsuarios />}
          </div>
        </section>
      </div>
      <style>{scrollbarStyles.home}</style>
    </main>
  );
}
