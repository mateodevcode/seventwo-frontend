import { Bell, ChevronDown, Search } from "lucide-react";
import { clientUser } from "@/data/data.area-cliente";

export default function Topbar({ title }) {
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>Área de cliente</span>
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
          {clientUser.initials}
        </div>
        <ChevronDown className="chevron" aria-hidden="true" />
      </div>
    </header>
  );
}
