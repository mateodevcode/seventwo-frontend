"use client";

// Piezas de UI compartidas por las pantallas de autenticación.
import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import LogoModerno from "@/components/logo/LogoModerno";
import { urlGoogle } from "@/lib/api";
import "./auth.css";

export function AuthShell({ eyebrow, titulo, subtitulo, children, pie }) {
  return (
    <main className="auth-root">
      <div className="auth-shell">
        <div className="auth-brand">
          <LogoModerno href="/" />
          <span className="auth-tag">Client area</span>
        </div>
        <section className="auth-card">
          {eyebrow && <p className="auth-eyebrow">{eyebrow}</p>}
          <h1 className="auth-title">{titulo}</h1>
          {subtitulo && <p className="auth-subtitle">{subtitulo}</p>}
          {children}
        </section>
        {pie && <div className="auth-foot">{pie}</div>}
      </div>
    </main>
  );
}

export function Campo({ label, id, error, ayuda, tipo = "text", ...props }) {
  const [ver, setVer] = useState(false);
  const esPassword = tipo === "password";
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        <input
          id={id}
          name={id}
          type={esPassword && ver ? "text" : tipo}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error || ayuda ? `${id}-desc` : undefined}
          {...props}
        />
        {esPassword && (
          <button
            type="button"
            className="auth-eye"
            onClick={() => setVer((v) => !v)}
            aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {ver ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        )}
      </div>
      {(error || ayuda) && (
        <p id={`${id}-desc`} className={error ? "auth-field-error" : "auth-field-help"}>
          {error || ayuda}
        </p>
      )}
    </div>
  );
}

// Input para códigos de 6 dígitos (autocompleta desde el SMS/email en móviles).
export function CampoCodigo({ id = "codigo", valor, onCambio, autoFocus = true, disabled }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>Código de 6 dígitos</label>
      <input
        id={id}
        name={id}
        className="auth-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        placeholder="••••••"
        value={valor}
        onChange={(e) => onCambio(e.target.value.replace(/\D/g, "").slice(0, 6))}
        autoFocus={autoFocus}
        disabled={disabled}
        required
      />
    </div>
  );
}

export function Alerta({ tipo = "error", children }) {
  if (!children) return null;
  const Icono = tipo === "ok" ? CheckCircle2 : AlertTriangle;
  return (
    <div className={`auth-alert auth-alert-${tipo}`} role={tipo === "error" ? "alert" : "status"}>
      <Icono aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function Boton({ cargando, children, variante = "primario", ...props }) {
  return (
    <button className={`auth-button auth-button-${variante}`} disabled={cargando || props.disabled} {...props}>
      {cargando && <Loader2 className="auth-spin" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}

export function BotonGoogle({ next, texto = "Continuar con Google" }) {
  return (
    <a className="auth-button auth-button-google" href={urlGoogle(next)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
        <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.07-1.1-.16-1.6H12z" />
      </svg>
      <span>{texto}</span>
    </a>
  );
}

export const Separador = ({ texto = "o" }) => (
  <div className="auth-sep" role="separator">
    <span>{texto}</span>
  </div>
);

export const Enlace = ({ href, children }) => (
  <Link className="auth-link" href={href}>
    {children}
  </Link>
);

// Cuenta regresiva en segundos (para "Reenviar código").
export function useCuentaAtras(inicial = 60) {
  const [seg, setSeg] = useState(inicial);
  useEffect(() => {
    if (seg <= 0) return;
    const t = setTimeout(() => setSeg((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seg]);
  return [seg, setSeg];
}

export function BotonReenviar({ onReenviar, inicial = 60 }) {
  const [seg, setSeg] = useCuentaAtras(inicial);
  const [enviando, setEnviando] = useState(false);
  const click = async () => {
    setEnviando(true);
    try {
      const espera = await onReenviar();
      setSeg(typeof espera === "number" ? espera : 60);
    } finally {
      setEnviando(false);
    }
  };
  return (
    <button type="button" className="auth-text-button" onClick={click} disabled={seg > 0 || enviando}>
      {seg > 0 ? `Reenviar código en ${seg}s` : enviando ? "Enviando…" : "Reenviar código"}
    </button>
  );
}

// Mensajes legibles para ?error= que devuelve el backend tras Google.
export const ERRORES_GOOGLE = {
  google_no_configurado: "El ingreso con Google no está disponible por ahora.",
  google_cancelado: "Cancelaste el ingreso con Google.",
  google_estado_invalido: "La sesión con Google expiró o no es válida. Inténtalo de nuevo.",
  google_sin_codigo: "Google no devolvió la autorización. Inténtalo de nuevo.",
  google_codigo_invalido: "No pudimos validar el ingreso con Google. Inténtalo de nuevo.",
  google_perfil_invalido: "No pudimos leer tu perfil de Google.",
  google_email_no_verificado: "Tu email de Google no está verificado.",
  google_cuenta_distinta: "Este email ya está vinculado a otra cuenta de Google.",
  cuenta_bloqueada: "Tu cuenta está bloqueada por seguridad. Restablece tu contraseña para desbloquearla.",
  email_no_enviado: "No pudimos enviarte el código de verificación. Inténtalo en unos minutos.",
  google_error: "Ocurrió un error con Google. Inténtalo de nuevo.",
};
