import { ChevronDown } from "lucide-react";
import { iniciales, useAuth } from "@/components/auth/AuthProvider";
import Campana from "@/components/notificaciones/Campana";

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
        {usuario && <Campana />}
        <div className="top-avatar" aria-hidden="true">
          {iniciales(usuario?.name)}
        </div>
        <ChevronDown className="chevron" aria-hidden="true" />
      </div>
    </header>
  );
}
