// src/lib/roles.js — mismos roles que el backend (src/lib/roles.js).
//   usuario < cliente < admin < superadmin
export const ROLES = ["usuario", "cliente", "admin", "superadmin"];

export const ETIQUETA_ROL = {
  usuario: "Usuario",
  cliente: "Cliente",
  admin: "Admin",
  superadmin: "Superadmin",
};

const nivel = (rol) => ROLES.indexOf(rol);

/** ¿El rol alcanza al menos `minimo`? (p. ej. tieneRol("admin", "cliente") → true) */
export const tieneRol = (rol, minimo) => nivel(rol) >= nivel(minimo);

export const esEquipo = (rol) => rol === "admin" || rol === "superadmin";
