import { MoreHorizontal, Settings, ShieldCheck } from "lucide-react";
import { clientUser, navigation } from "@/data/data.area-cliente";
import LogoModerno from "@/components/logo/LogoModerno";

export default function Sidebar({ active, onNavigate }) {
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
              onClick={() => onNavigate(item.id)}
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
            <strong>Tu cuenta está protegida</strong>
            <span>Datos cifrados y seguros</span>
          </div>
        </div>
        <button
          type="button"
          className="nav-item"
          onClick={() => onNavigate("datos")}
        >
          <Settings aria-hidden="true" />
          <span>Configuración</span>
        </button>
        <div className="user-mini">
          <div className="avatar" aria-hidden="true">
            {clientUser.initials}
          </div>
          <div>
            <strong>{clientUser.name}</strong>
            <span>{clientUser.email}</span>
          </div>
          <MoreHorizontal aria-hidden="true" />
        </div>
      </div>
    </aside>
  );
}
