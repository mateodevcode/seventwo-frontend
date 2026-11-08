import {
  CircleHelp,
  FilePlus2,
  FileText,
  Headphones,
  LayoutDashboard,
  LockKeyhole,
  Sparkles,
  UserRound,
  WalletCards,
} from "lucide-react";
import { tieneRol } from "@/lib/roles";

// `minimo`: rol mínimo para ver la sección (usuario < cliente < admin < superadmin).
//   usuario → solo perfil, solicitar presupuesto, seguridad y ayuda
//   cliente → además resumen, facturas, pagos, servicio y soporte
export const navigation = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard, minimo: "cliente" },
  { id: "datos", label: "Mi perfil", icon: UserRound, minimo: "usuario" },
  { id: "cotizar", label: "Solicitar presupuesto", icon: FilePlus2, minimo: "usuario" },
  { id: "facturas", label: "Facturas", icon: FileText, badge: "2", minimo: "cliente" },
  { id: "pagos", label: "Pagos", icon: WalletCards, minimo: "cliente" },
  { id: "servicio", label: "Servicio contratado", icon: Sparkles, minimo: "cliente" },
  { id: "soporte", label: "Soporte", icon: Headphones, badge: "1", minimo: "cliente" },
  { id: "seguridad", label: "Seguridad", icon: LockKeyhole, minimo: "usuario" },
  { id: "ayuda", label: "Ayuda", icon: CircleHelp, minimo: "usuario" },
];

/** Secciones visibles para un rol. */
export const navegacionPara = (rol) => navigation.filter((item) => tieneRol(rol, item.minimo));

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
