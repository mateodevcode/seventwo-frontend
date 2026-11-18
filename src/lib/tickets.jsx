// src/lib/tickets.js — constantes de soporte (iguales que en el backend).
export const CATEGORIAS = { incidencia: "Incidencia", cambio: "Solicitud de cambio", consulta: "Consulta", pagos: "Pagos" };
export const PRIORIDADES = { baja: "Baja", normal: "Normal", alta: "Alta", urgente: "Urgente" };
export const ESTADOS_TICKET = {
  abierto: "Abierto", en_progreso: "En progreso", esperando_cliente: "Esperando respuesta", resuelto: "Resuelto", cerrado: "Cerrado",
};
export const PillTicket = ({ estado, cliente = false }) => (
  <span className={`pill ticket-${estado}`}>{cliente && estado === "esperando_cliente" ? "Esperando tu respuesta" : ESTADOS_TICKET[estado]}</span>
);
