"use client";

// Área de cliente → Mi perfil (todos los roles): datos reales de la cuenta y
// edición de nombre y teléfono. El email no se edita (exigiría reverificar).
import { useState } from "react";
import { BadgeCheck, Pencil, UserRound } from "lucide-react";
import PageHeading from "@/views/area-cliente/components/PageHeading";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { Alerta, Boton, Campo } from "@/components/auth/ui";
import { ETIQUETA_ROL } from "@/lib/roles";
import DatosFacturacion from "./DatosFacturacion";

function Info({ label, value }) {
  return (
    <div className="info">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

const DESCRIPCION_ROL = {
  usuario: "Puedes solicitar presupuestos y gestionar tu perfil.",
  cliente: "Tienes acceso a tus proyectos, cuentas de cobro, pagos y soporte.",
  admin: "Formas parte del equipo de Seventwo.",
  superadmin: "Acceso completo, incluida la gestión de roles.",
};

export default function Perfil() {
  const { usuario, actualizarUsuario } = useAuth();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ name: "", telefono: "" });
  const [estado, setEstado] = useState({ cargando: false, error: "", ok: "" });

  const empezar = () => {
    setForm({ name: usuario.name ?? "", telefono: usuario.telefono ?? "" });
    setEstado({ cargando: false, error: "", ok: "" });
    setEditando(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setEstado({ cargando: true, error: "", ok: "" });
    try {
      const r = await api("/auth/me", {
        method: "PATCH",
        body: { name: form.name, telefono: form.telefono },
        auth: true,
      });
      actualizarUsuario(r.data);
      setEditando(false);
      setEstado({ cargando: false, error: "", ok: "Perfil actualizado." });
    } catch (err) {
      setEstado({ cargando: false, error: err.message, ok: "" });
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <section id="perfil" aria-label="Mi perfil">
      <PageHeading
        eyebrow="Mi cuenta"
        title={<>Mi <em>perfil</em></>}
        description="Tus datos de contacto y el tipo de cuenta que tienes en Seventwo."
        action={
          !editando && (
            <button type="button" className="button button-outline" onClick={empezar}>
              <Pencil aria-hidden="true" /> Editar datos
            </button>
          )
        }
      />
      <div className="data-grid">
        <div className="data-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Información personal</p>
              <h2>Datos de contacto</h2>
            </div>
            {usuario.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={usuario.image_url}
                alt=""
                width={44}
                height={44}
                referrerPolicy="no-referrer"
                style={{ borderRadius: 0, border: "1px solid var(--cliente-line)" }}
              />
            ) : (
              <UserRound aria-hidden="true" />
            )}
          </div>

          {editando ? (
            <form className="auth-embed auth-form" onSubmit={guardar} noValidate>
              <Alerta>{estado.error}</Alerta>
              <Campo id="perfil-nombre" label="Nombre completo" autoComplete="name" value={form.name} onChange={set("name")} autoFocus />
              <Campo
                id="perfil-telefono"
                label="Teléfono"
                tipo="tel"
                autoComplete="tel"
                value={form.telefono}
                onChange={set("telefono")}
                ayuda="Opcional. Con indicativo, p. ej. +57 300 123 4567."
              />
              <div className="auth-row">
                <Boton type="submit" cargando={estado.cargando} disabled={form.name.trim().length < 2}>
                  Guardar
                </Boton>
                <button type="button" className="auth-text-button" onClick={() => setEditando(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="info-fields">
              <div className="auth-embed" style={{ gridColumn: "1 / -1" }}>
                <Alerta tipo="ok">{estado.ok}</Alerta>
              </div>
              <Info label="Nombre completo" value={usuario.name} />
              <Info label="Correo electrónico" value={usuario.email} />
              <Info label="Teléfono" value={usuario.telefono} />
              <Info label="Acceso" value={usuario.provider === "google" ? "Google" : "Email y contraseña"} />
            </div>
          )}
        </div>

        <div className="data-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Cuenta</p>
              <h2>Tipo de cuenta</h2>
            </div>
            <BadgeCheck aria-hidden="true" />
          </div>
          <div className="info-fields">
            <Info label="Rol" value={ETIQUETA_ROL[usuario.rol]} />
            <Info label="Email verificado" value={usuario.email_verificado ? "Sí" : "No"} />
            <Info label="Verificación en dos pasos" value={usuario.otp_activo ? "Activa" : "Inactiva"} />
          </div>
          <p className="heading-description" style={{ margin: "18px 0 0" }}>
            {DESCRIPCION_ROL[usuario.rol]}
          </p>
        </div>
      </div>
      <DatosFacturacion />
    </section>
  );
}
