import {
  CircleHelp,
  FileText,
  Headphones,
  LayoutDashboard,
  Sparkles,
  UserRound,
  WalletCards,
} from "lucide-react";

export const navigation = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "datos", label: "Datos del cliente", icon: UserRound },
  { id: "facturas", label: "Facturas", icon: FileText, badge: "2" },
  { id: "pagos", label: "Pagos", icon: WalletCards },
  { id: "servicio", label: "Servicio contratado", icon: Sparkles },
  { id: "soporte", label: "Soporte", icon: Headphones, badge: "1" },
  { id: "ayuda", label: "Ayuda", icon: CircleHelp },
];

export const invoices = [
  {
    id: "FAC-2024-008",
    date: "28 Jun 2024",
    concept: "Mantenimiento web · Junio",
    amount: "480,00 €",
    status: "Pagada",
  },
  {
    id: "FAC-2024-007",
    date: "28 May 2024",
    concept: "Mantenimiento web · Mayo",
    amount: "480,00 €",
    status: "Pagada",
  },
  {
    id: "FAC-2024-006",
    date: "28 Abr 2024",
    concept: "Mantenimiento web · Abril",
    amount: "480,00 €",
    status: "Pendiente",
  },
];

export const clientUser = {
  initials: "MG",
  name: "María García",
  email: "maria@ejemplo.com",
};
