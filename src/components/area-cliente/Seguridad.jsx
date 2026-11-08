"use client";

// Área de cliente → Seguridad: verificación en dos pasos, contraseña y sesiones.
import { useState } from "react";
import { KeyRound, LogOut, ShieldCheck, ShieldOff } from "lucide-react";
import PageHeading from "@/views/area-cliente/components/PageHeading";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { errorPassword } from "@/components/auth/RegistroForm";
import { Alerta, Boton, Campo, CampoCodigo, Enlace } from "@/components/auth/ui";

function useAccion() {
  const [estado, setEstado] = useState({ cargando: false, error: "", ok: "" });
  const ejecutar = async (fn) => {
    setEstado({ cargando: true, error: "", ok: "" });
    try {
      const ok = await fn();
      setEstado({ cargando: false, error: "", ok: ok || "" });
      return true;
    } catch (err) {
      setEstado({ cargando: false, error: err.status === 429 ? "Demasiados intentos. Espera unos minutos." : err.message, ok: "" });
      return false;
    }
  };
  return [estado, ejecutar, setEstado];
}

function DosPasos() {
  const { usuario, actualizarUsuario } = useAuth();
  const [fase, setFase] = useState("inicio"); // inicio | codigo-activar | password-desactivar | codigo-desactivar
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [{ cargando, error, ok }, ejecutar] = useAccion();
  const activo = usuario.otp_activo;

  const terminar = (u, mensaje) => {
    actualizarUsuario(u);
    setFase("inicio");
    setCodigo("");
    setPassword("");
    return mensaje;
  };

  const empezarActivar = () =>
    ejecutar(async () => {
      await api("/auth/otp/activar", { method: "POST", auth: true });
      setFase("codigo-activar");
    });

  const confirmarActivar = (e) => {
    e.preventDefault();
    ejecutar(async () => {
      const r = await api("/auth/otp/activar/confirmar", { method: "POST", body: { codigo }, auth: true });
      return terminar(r.data, "Verificación en dos pasos activada.");
    });
  };

  const empezarDesactivar = () => {
    if (usuario.tiene_password) return setFase("password-desactivar");
    ejecutar(async () => {
      await api("/auth/otp/desactivar", { method: "POST", body: {}, auth: true });
      setFase("codigo-desactivar");
    });
  };

  const confirmarDesactivar = (e) => {
    e.preventDefault();
    ejecutar(async () => {
      const r =
        fase === "password-desactivar"
          ? await api("/auth/otp/desactivar", { method: "POST", body: { password }, auth: true })
          : await api("/auth/otp/desactivar/confirmar", { method: "POST", body: { codigo }, auth: true });
      return terminar(r.data, "Verificación en dos pasos desactivada.");
    });
  };

  const cancelar = () => {
    setFase("inicio");
    setCodigo("");
    setPassword("");
  };

  return (
    <div className="data-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Inicio de sesión</p>
          <h2>Verificación en dos pasos</h2>
        </div>
        {activo ? <ShieldCheck aria-hidden="true" color="#ffff00" /> : <ShieldOff aria-hidden="true" color="#aa9fb1" />}
      </div>
      <div className="auth-embed">
        <p className="heading-description" style={{ margin: 0 }}>
          {activo
            ? "Activa. Cada vez que inicies sesión te enviaremos un código a tu correo."
            : "Añade un código por email a cada inicio de sesión para proteger tu cuenta aunque alguien conozca tu contraseña."}
        </p>
        <Alerta>{error}</Alerta>
        <Alerta tipo="ok">{ok}</Alerta>

        {fase === "inicio" &&
          (activo ? (
            <Boton variante="peligro" cargando={cargando} onClick={empezarDesactivar}>Desactivar</Boton>
          ) : (
            <Boton cargando={cargando} onClick={empezarActivar} disabled={!usuario.email_verificado}>Activar</Boton>
          ))}

        {(fase === "codigo-activar" || fase === "codigo-desactivar") && (
          <form className="auth-form" onSubmit={fase === "codigo-activar" ? confirmarActivar : confirmarDesactivar}>
            <Alerta tipo="info">Te enviamos un código a {usuario.email}.</Alerta>
            <CampoCodigo valor={codigo} onCambio={setCodigo} disabled={cargando} />
            <div className="auth-row">
              <Boton type="submit" cargando={cargando} disabled={codigo.length !== 6}>Confirmar</Boton>
              <button type="button" className="auth-text-button" onClick={cancelar}>Cancelar</button>
            </div>
          </form>
        )}

        {fase === "password-desactivar" && (
          <form className="auth-form" onSubmit={confirmarDesactivar}>
            <Campo id="otp-password" label="Confirma con tu contraseña" tipo="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            <div className="auth-row">
              <Boton type="submit" variante="peligro" cargando={cargando} disabled={!password}>Desactivar</Boton>
              <button type="button" className="auth-text-button" onClick={cancelar}>Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function CambiarPassword() {
  const { usuario, iniciarSesion } = useAuth();
  const [form, setForm] = useState({ actual: "", nueva: "", confirmar: "" });
  const [{ cargando, error, ok }, ejecutar] = useAccion();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!usuario.tiene_password) {
    return (
      <div className="data-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Acceso</p>
            <h2>Contraseña</h2>
          </div>
          <KeyRound aria-hidden="true" />
        </div>
        <div className="auth-embed">
          <p className="heading-description" style={{ margin: 0 }}>
            Entras con Google y tu cuenta no tiene contraseña. Si quieres poder entrar también con email y contraseña, créala:
          </p>
          <Enlace href={`/olvide-contrasena?email=${encodeURIComponent(usuario.email)}`}>Crear contraseña →</Enlace>
        </div>
      </div>
    );
  }

  const errNueva = form.nueva ? errorPassword(form.nueva) : "";
  const errConf = form.confirmar && form.confirmar !== form.nueva ? "Las contraseñas no coinciden." : "";
  const valido = form.actual && form.nueva && !errNueva && form.nueva === form.confirmar;

  const enviar = (e) => {
    e.preventDefault();
    if (!valido) return;
    ejecutar(async () => {
      const r = await api("/auth/password", {
        method: "PATCH",
        body: { actual: form.actual, nueva: form.nueva },
        auth: true,
      });
      iniciarSesion(r.data); // el backend devuelve una sesión nueva
      setForm({ actual: "", nueva: "", confirmar: "" });
      return r.message;
    });
  };

  return (
    <div className="data-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Acceso</p>
          <h2>Cambiar contraseña</h2>
        </div>
        <KeyRound aria-hidden="true" />
      </div>
      <form className="auth-embed auth-form" onSubmit={enviar} noValidate>
        <Alerta>{error}</Alerta>
        <Alerta tipo="ok">{ok}</Alerta>
        <Campo id="actual" label="Contraseña actual" tipo="password" autoComplete="current-password" value={form.actual} onChange={set("actual")} />
        <Campo id="nueva" label="Nueva contraseña" tipo="password" autoComplete="new-password" value={form.nueva} onChange={set("nueva")} error={errNueva} ayuda="Mínimo 8 caracteres, con letras y números." />
        <Campo id="confirmar" label="Repite la nueva contraseña" tipo="password" autoComplete="new-password" value={form.confirmar} onChange={set("confirmar")} error={errConf} />
        <Boton type="submit" cargando={cargando} disabled={!valido}>Guardar contraseña</Boton>
      </form>
    </div>
  );
}

function Sesiones() {
  const { cerrarSesion } = useAuth();
  const [{ cargando, error }, ejecutar] = useAccion();

  // Al quedar sin sesión, RequiereSesion redirige a /login.
  const cerrarTodas = () => ejecutar(() => cerrarSesion({ todas: true }));

  return (
    <div className="data-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Dispositivos</p>
          <h2>Sesiones activas</h2>
        </div>
        <LogOut aria-hidden="true" />
      </div>
      <div className="auth-embed">
        <p className="heading-description" style={{ margin: 0 }}>
          ¿Perdiste un dispositivo o entraste desde un equipo ajeno? Cierra la sesión en todos los dispositivos, incluido este.
        </p>
        <Alerta>{error}</Alerta>
        <Boton variante="peligro" cargando={cargando} onClick={cerrarTodas}>Cerrar todas las sesiones</Boton>
      </div>
    </div>
  );
}

export default function Seguridad() {
  return (
    <section id="seguridad" aria-label="Seguridad de la cuenta">
      <PageHeading
        eyebrow="Mi cuenta"
        title={<>Seguridad de la <em>cuenta</em></>}
        description="Protege el acceso a tu área de cliente."
      />
      <div className="data-grid">
        <DosPasos />
        <CambiarPassword />
        <Sesiones />
      </div>
    </section>
  );
}
