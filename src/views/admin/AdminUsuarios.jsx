"use client";

// Admin → Usuarios y roles: resumen, búsqueda, filtro, cambio de rol y bloqueo.
// Qué puede hacer el actor con cada fila lo decide el backend (u.permisos).
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Lock, LockOpen, Search } from "lucide-react";
import PageHeading from "@/views/area-cliente/components/PageHeading";
import { api } from "@/lib/api";
import { ETIQUETA_ROL, ROLES } from "@/lib/roles";
import { Alerta } from "@/components/auth/ui";

const fecha = (iso) =>
  iso ? new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function Resumen({ datos }) {
  if (!datos) return null;
  const celdas = [
    ["Usuarios", datos.usuarios],
    ["Clientes", datos.clientes],
    ["Equipo", datos.equipo],
    ["Nuevos (7 días)", datos.nuevos_7d],
  ];
  return (
    <div className="invoice-summary admin-summary">
      {celdas.map(([k, v]) => (
        <div key={k}>
          <span>{k}</span>
          <strong>{v}</strong>
        </div>
      ))}
    </div>
  );
}

function FilaUsuario({ u, onCambio, ocupado }) {
  const { gestionar, rolesAsignables } = u.permisos;
  // El rol actual siempre aparece aunque el actor no pueda asignarlo.
  const opciones = Array.from(new Set([u.rol, ...rolesAsignables]));

  return (
    <div className={`table-row admin-row${u.bloqueado ? " is-bloqueado" : ""}`} role="row">
      <div className="admin-user" role="cell">
        <strong>{u.name}</strong>
        <span>{u.email}</span>
      </div>
      <span role="cell">
        {gestionar ? (
          <select
            className="admin-select"
            value={u.rol}
            disabled={ocupado}
            aria-label={`Rol de ${u.name}`}
            onChange={(e) => onCambio(u, "rol", e.target.value)}
          >
            {opciones.map((r) => (
              <option key={r} value={r}>
                {ETIQUETA_ROL[r]}
              </option>
            ))}
          </select>
        ) : (
          <span className={`pill ${u.rol === "superadmin" || u.rol === "admin" ? "success" : "warning"}`}>
            {ETIQUETA_ROL[u.rol]}
          </span>
        )}
      </span>
      <span role="cell">{u.provider === "google" ? "Google" : "Email"}</span>
      <span role="cell">
        {u.bloqueado ? (
          <span className="admin-estado bloqueado">Bloqueado</span>
        ) : u.email_verificado ? (
          <span className="admin-estado">Activo{u.otp_activo ? " · 2FA" : ""}</span>
        ) : (
          <span className="admin-estado pendiente">Sin verificar</span>
        )}
      </span>
      <span role="cell">{fecha(u.ultimo_login)}</span>
      <span role="cell" className="admin-acciones">
        {gestionar && (
          <button
            type="button"
            className="icon-button"
            disabled={ocupado}
            onClick={() => onCambio(u, "bloqueo", !u.bloqueado)}
            aria-label={u.bloqueado ? `Desbloquear a ${u.name}` : `Bloquear a ${u.name}`}
            title={u.bloqueado ? "Desbloquear" : "Bloquear"}
          >
            {u.bloqueado ? <LockOpen aria-hidden="true" /> : <Lock aria-hidden="true" />}
          </button>
        )}
      </span>
    </div>
  );
}

export default function AdminUsuarios() {
  const [resumen, setResumen] = useState(null);
  const [lista, setLista] = useState({ usuarios: [], total: 0, pagina: 1, paginas: 1 });
  const [buscar, setBuscar] = useState("");
  const [consulta, setConsulta] = useState("");
  const [rol, setRol] = useState("");
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(null);
  const [aviso, setAviso] = useState({ tipo: "ok", texto: "" });

  // Carga la lista y el resumen cuando cambian filtros o página. El estado solo
  // se toca al llegar la respuesta; `vigente` descarta respuestas de filtros viejos.
  useEffect(() => {
    let vigente = true;
    const qs = new URLSearchParams({ pagina: String(pagina) });
    if (consulta) qs.set("buscar", consulta);
    if (rol) qs.set("rol", rol);
    Promise.all([api(`/admin/usuarios?${qs}`, { auth: true }), api("/admin/resumen", { auth: true })])
      .then(([l, r]) => {
        if (!vigente) return;
        setLista(l.data);
        setResumen(r.data);
      })
      .catch((err) => vigente && setAviso({ tipo: "error", texto: err.message }))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [consulta, rol, pagina]);

  const filtrar = useCallback((cambio) => {
    setCargando(true);
    cambio();
  }, []);

  // Búsqueda con pequeño retardo mientras se escribe.
  useEffect(() => {
    const t = setTimeout(() => {
      const q = buscar.trim();
      if (q === consulta) return;
      filtrar(() => {
        setConsulta(q);
        setPagina(1);
      });
    }, 350);
    return () => clearTimeout(t);
  }, [buscar, consulta, filtrar]);

  async function onCambio(u, tipo, valor) {
    if (tipo === "rol" && valor === "admin" && !window.confirm(`¿Dar acceso de administrador a ${u.name}?`)) return;
    if (tipo === "bloqueo" && valor && !window.confirm(`¿Bloquear a ${u.name}? Se cerrarán todas sus sesiones.`)) return;
    setOcupado(u.id);
    setAviso({ tipo: "ok", texto: "" });
    try {
      const r =
        tipo === "rol"
          ? await api(`/admin/usuarios/${u.id}/rol`, { method: "PATCH", body: { rol: valor }, auth: true })
          : await api(`/admin/usuarios/${u.id}/bloqueo`, { method: "PATCH", body: { bloqueado: valor }, auth: true });
      setLista((l) => ({ ...l, usuarios: l.usuarios.map((x) => (x.id === u.id ? r.data : x)) }));
      setAviso({ tipo: "ok", texto: `${u.name}: ${r.message}` });
      api("/admin/resumen", { auth: true }).then((x) => setResumen(x.data)).catch(() => {});
    } catch (err) {
      setAviso({ tipo: "error", texto: err.message });
    } finally {
      setOcupado(null);
    }
  }

  return (
    <section aria-label="Usuarios y roles">
      <PageHeading
        eyebrow="Administración"
        title={<>Usuarios y <em>roles</em></>}
        description="Asciende usuarios a clientes, gestiona el equipo y bloquea cuentas."
      />

      <Resumen datos={resumen} />

      <div className="table-panel">
        <div className="table-toolbar admin-toolbar">
          <h2>
            {lista.total} {lista.total === 1 ? "cuenta" : "cuentas"}
          </h2>
          <div className="admin-filtros">
            <label className="admin-buscar">
              <Search aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar por nombre o email"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                aria-label="Buscar por nombre o email"
              />
            </label>
            <select
              className="admin-select"
              value={rol}
              onChange={(e) => {
                const valor = e.target.value;
                filtrar(() => {
                  setRol(valor);
                  setPagina(1);
                });
              }}
              aria-label="Filtrar por rol"
            >
              <option value="">Todos los roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ETIQUETA_ROL[r]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {aviso.texto && (
          <div className="auth-embed admin-aviso">
            <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>
          </div>
        )}

        <div className="invoice-table" role="table" aria-label="Usuarios" aria-busy={cargando}>
          <div className="table-row table-head admin-row" role="row">
            <span>Usuario</span>
            <span>Rol</span>
            <span>Acceso</span>
            <span>Estado</span>
            <span>Último acceso</span>
            <span />
          </div>
          {lista.usuarios.map((u) => (
            <FilaUsuario key={u.id} u={u} onCambio={onCambio} ocupado={ocupado === u.id} />
          ))}
          {!cargando && lista.usuarios.length === 0 && <p className="admin-vacio">No hay cuentas con esos filtros.</p>}
        </div>

        {lista.paginas > 1 && (
          <div className="admin-paginacion">
            <button type="button" className="icon-button" disabled={pagina <= 1} onClick={() => filtrar(() => setPagina((p) => p - 1))} aria-label="Página anterior">
              <ChevronLeft aria-hidden="true" />
            </button>
            <span>
              Página {lista.pagina} de {lista.paginas}
            </span>
            <button type="button" className="icon-button" disabled={pagina >= lista.paginas} onClick={() => filtrar(() => setPagina((p) => p + 1))} aria-label="Página siguiente">
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
