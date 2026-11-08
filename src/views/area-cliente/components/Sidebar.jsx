import Link from "next/link";
import { LayoutGrid, LogOut, Settings, ShieldCheck } from "lucide-react";
import LogoModerno from "@/components/logo/LogoModerno";
import { iniciales, useAuth } from "@/components/auth/AuthProvider";
import { ETIQUETA_ROL, esEquipo } from "@/lib/roles";

/**
 * Barra lateral compartida por el área de cliente y el área /admin.
 * @param items     secciones visibles (ya filtradas por rol)
 * @param tag       etiqueta bajo el logo
 * @param enlace    acceso a la otra área { href, label }; por defecto, admin/superadmin
 *                  ven "Administración" en el área de cliente
 */
export default function Sidebar({ items = [], active, onNavigate, tag = "Client area", enlace }) {
  const { usuario, cerrarSesion } = useAuth();

  // Al quedar sin sesión, RequiereSesion redirige a /login.
  const salir = () => cerrarSesion().catch(() => {});

  const acceso = enlace ?? (esEquipo(usuario?.rol) ? { href: "/admin", label: "Administración", icon: LayoutGrid } : null);
  const AccesoIcono = acceso?.icon ?? LayoutGrid;

  return (
    <aside
      className="portal-sidebar"
      aria-label="Navegación"
    >
      <div className="brand-lockup">
        <LogoModerno href="/" />
        <span className="client-tag">{tag}</span>
      </div>

      <div className="workspace-label">Espacio de trabajo</div>

      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={isActive ? "nav-item active" : "nav-item"}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onNavigate?.(item.id)}
            >
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
              {item.badge && <em>{item.badge}</em>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-help">
          <ShieldCheck aria-hidden="true" />
          <div>
            <strong>{usuario?.otp_activo ? "Verificación en dos pasos activa" : "Protege tu cuenta"}</strong>
            <span>{usuario?.otp_activo ? "Tu cuenta está protegida" : "Activa la verificación en dos pasos"}</span>
          </div>
        </div>
        {acceso ? (
          <Link className="nav-item" href={acceso.href}>
            <AccesoIcono aria-hidden="true" />
            <span>{acceso.label}</span>
          </Link>
        ) : (
          <button
            type="button"
            className="nav-item"
            onClick={() => onNavigate?.("seguridad")}
          >
            <Settings aria-hidden="true" />
            <span>Configuración</span>
          </button>
        )}
        <div className="user-mini">
          <div className="avatar" aria-hidden="true">
            {iniciales(usuario?.name)}
          </div>
          <div>
            <strong>{usuario?.name}</strong>
            <span>{ETIQUETA_ROL[usuario?.rol] ?? ""} · {usuario?.email}</span>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={salir}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
