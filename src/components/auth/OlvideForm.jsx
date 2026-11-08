"use client";

// Restablecer contraseña en 3 pasos: email → código → nueva contraseña.
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, setSesion } from "@/lib/api";
import { errorPassword } from "./RegistroForm";
import { Alerta, AuthShell, Boton, BotonReenviar, Campo, CampoCodigo, Enlace } from "./ui";

export default function OlvideForm() {
  const params = useSearchParams();
  const [paso, setPaso] = useState(1);
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [codigo, setCodigo] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [enviando, setEnviando] = useState(false);

  const llamar = async (fn) => {
    setError("");
    setEnviando(true);
    try {
      await fn();
    } catch (err) {
      setError(err.status === 429 ? "Demasiados intentos. Espera unos minutos." : err.message);
    } finally {
      setEnviando(false);
    }
  };

  const solicitar = (e) => {
    e?.preventDefault();
    return llamar(async () => {
      const r = await api("/auth/password/solicitar", { method: "POST", body: { email } });
      setInfo(r.message);
      setPaso(2);
    });
  };

  const validar = (e) => {
    e.preventDefault();
    return llamar(async () => {
      try {
        const { data } = await api("/auth/password/validar", { method: "POST", body: { email, codigo } });
        setResetToken(data.resetToken);
        setInfo("");
        setPaso(3);
      } catch (err) {
        setCodigo("");
        throw err;
      }
    });
  };

  const errPass = password ? errorPassword(password) : "";
  const errConf = confirmar && confirmar !== password ? "Las contraseñas no coinciden." : "";

  const restablecer = (e) => {
    e.preventDefault();
    if (errorPassword(password) || password !== confirmar) return;
    return llamar(async () => {
      try {
        await api("/auth/password/restablecer", { method: "POST", body: { resetToken, password } });
        setSesion(null); // el backend revocó todas las sesiones, también la de esta pestaña
        setPaso(4);
      } catch (err) {
        if (err.status === 401) {
          // Token caducado o usado: hay que pedir otro código.
          setPaso(1);
          setCodigo("");
        }
        throw err;
      }
    });
  };

  const pasos = (
    <div className="auth-steps" aria-hidden="true">
      {[1, 2, 3].map((n) => <span key={n} className={paso >= n ? "on" : ""} />)}
    </div>
  );

  const pie = <Enlace href={`/login?email=${encodeURIComponent(email)}`}>Volver a iniciar sesión</Enlace>;

  if (paso === 4) {
    return (
      <AuthShell eyebrow="Listo" titulo={<>Contraseña <em>nueva</em></>} pie={pie}>
        <Alerta tipo="ok">Tu contraseña se restableció y cerramos tus otras sesiones por seguridad.</Alerta>
        <Enlace href={`/login?email=${encodeURIComponent(email)}`}>Iniciar sesión con tu nueva contraseña →</Enlace>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={`Paso ${paso} de 3`}
      titulo={<>Restablece tu <em>contraseña</em></>}
      subtitulo={
        paso === 1
          ? "Te enviaremos un código a tu correo."
          : paso === 2
            ? <>Introduce el código que enviamos a <strong>{email}</strong>.</>
            : "Elige una contraseña nueva."
      }
      pie={pie}
    >
      {pasos}
      <Alerta>{error}</Alerta>
      <Alerta tipo="ok">{info}</Alerta>

      {paso === 1 && (
        <form className="auth-form" onSubmit={solicitar} noValidate>
          <Campo id="email" label="Email" tipo="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
          <Boton type="submit" cargando={enviando} disabled={!email}>Enviar código</Boton>
        </form>
      )}

      {paso === 2 && (
        <>
          <form className="auth-form" onSubmit={validar}>
            <CampoCodigo valor={codigo} onCambio={setCodigo} disabled={enviando} />
            <Boton type="submit" cargando={enviando} disabled={codigo.length !== 6}>Continuar</Boton>
          </form>
          <div className="auth-row">
            <button type="button" className="auth-text-button" onClick={() => { setPaso(1); setInfo(""); }}>
              Cambiar email
            </button>
            <BotonReenviar
              onReenviar={async () => {
                await solicitar();
                return 60;
              }}
            />
          </div>
        </>
      )}

      {paso === 3 && (
        <form className="auth-form" onSubmit={restablecer} noValidate>
          <Campo
            id="password"
            label="Nueva contraseña"
            tipo="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errPass}
            ayuda="Mínimo 8 caracteres, con letras y números."
            autoFocus
          />
          <Campo id="confirmar" label="Repite la contraseña" tipo="password" autoComplete="new-password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} error={errConf} />
          <Boton type="submit" cargando={enviando} disabled={!password || !!errPass || password !== confirmar}>
            Guardar contraseña
          </Boton>
        </form>
      )}
    </AuthShell>
  );
}
