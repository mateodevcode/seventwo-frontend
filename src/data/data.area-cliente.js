import {
  CircleHelp,
  FilePlus2,
  FileText,
  FolderKanban,
  Headphones,
  LayoutDashboard,
  LockKeyhole,
  UserRound,
  WalletCards,
} from "lucide-react";
import { tieneRol } from "@/lib/roles";

// `minimo`: rol mínimo para ver la sección (usuario < cliente < admin < superadmin).
//   usuario → solo perfil, solicitar presupuesto, seguridad y ayuda
//   cliente → además resumen, proyectos, cuentas de cobro, pagos y soporte
export const navigation = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard, minimo: "cliente" },
  { id: "proyectos", label: "Mis proyectos", icon: FolderKanban, minimo: "cliente" },
  { id: "datos", label: "Mi perfil", icon: UserRound, minimo: "usuario" },
  { id: "cotizar", label: "Solicitar presupuesto", icon: FilePlus2, minimo: "usuario" },
  { id: "facturas", label: "Cuentas de cobro", icon: FileText, minimo: "cliente" },
  { id: "pagos", label: "Pagos", icon: WalletCards, minimo: "cliente" },
  { id: "soporte", label: "Soporte", icon: Headphones, minimo: "cliente" },
  { id: "seguridad", label: "Seguridad", icon: LockKeyhole, minimo: "usuario" },
  { id: "ayuda", label: "Ayuda", icon: CircleHelp, minimo: "usuario" },
];

/** Secciones visibles para un rol. */
export const navegacionPara = (rol) => navigation.filter((item) => tieneRol(rol, item.minimo));
