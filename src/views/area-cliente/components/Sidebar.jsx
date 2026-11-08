import { LogOut, Settings, ShieldCheck } from "lucide-react";
import { navigation } from "@/data/data.area-cliente";
import LogoModerno from "@/components/logo/LogoModerno";
import { iniciales, useAuth } from "@/components/auth/AuthProvider";

export default function Sidebar({ active, onNavigate }) {
  const { usuario, cerrarSesion } = useAuth();

  // Al quedar sin sesión, RequiereSesion redirige a /login.
  const salir = () => cerrarSesion().catch(() => {});

  return (
    <aside
      className="portal-sidebar"
      aria-label="Navegación del área de cliente"
    >
      <div className="brand-lockup">
        <LogoModerno href="/" />
        <span className="client-tag">Client area</span>
      </div>

      <div className="workspace-label">Espacio de trabajo</div>

      <nav className="sidebar-nav">
        {navigation.map((item) => {
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
        <button
          type="button"
          className="nav-item"
          onClick={() => onNavigate?.("seguridad")}
        >
          <Settings aria-hidden="true" />
          <span>Configuración</span>
        </button>
        <div className="user-mini">
          <div className="avatar" aria-hidden="true">
            {iniciales(usuario?.name)}
          </div>
          <div>
            <strong>{usuario?.name}</strong>
            <span>{usuario?.email}</span>
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
