import { Bell, ChevronDown, Search } from "lucide-react";
import { iniciales, useAuth } from "@/components/auth/AuthProvider";

export default function Topbar({ title, seccion = "Área de cliente" }) {
  const { usuario } = useAuth();
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>{seccion}</span>
        <span>/</span>
        <strong>{title}</strong>
      </div>
      <div className="topbar-actions">
        <button className="icon-button" type="button" aria-label="Buscar">
          <Search aria-hidden="true" />
        </button>
        <button className="icon-button notification" type="button" aria-label="Notificaciones">
          <Bell aria-hidden="true" />
          <i aria-hidden="true" />
        </button>
        <div className="top-avatar" aria-hidden="true">
          {iniciales(usuario?.name)}
        </div>
        <ChevronDown className="chevron" aria-hidden="true" />
      </div>
    </header>
  );
}
