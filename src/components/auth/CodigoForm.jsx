"use client";

// Pantalla genérica "introduce el código que te enviamos": la usan el
// segundo factor (/login/otp) y la verificación de email (/verificar-email).
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, sanearNext } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { Alerta, AuthShell, Boton, BotonReenviar, CampoCodigo, Enlace } from "./ui";

const MODOS = {
  otp: {
    eyebrow: "Verificación en dos pasos",
    titulo: <>Revisa tu <em>correo</em></>,
    verificar: "/auth/otp/verificar",
    reenviar: "/auth/otp/reenviar",
    boton: "Verificar y entrar",
  },
  email: {
    eyebrow: "Verifica tu cuenta",
    titulo: <>Confirma tu <em>email</em></>,
    verificar: "/auth/verificar-email",
    reenviar: "/auth/verificar-email/reenviar",
    boton: "Verificar email",
  },
};

export default function CodigoForm({ modo }) {
  const cfg = MODOS[modo];
  const router = useRouter();
  const params = useSearchParams();
  const email = (params.get("email") ?? "").trim().toLowerCase();
  const next = sanearNext(params.get("next"));
  const { iniciarSesion } = useAuth();

  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!email) {
    return (
      <AuthShell eyebrow={cfg.eyebrow} titulo={cfg.titulo}>
        <Alerta>Falta el email. Vuelve a iniciar sesión.</Alerta>
        <Enlace href="/login">Ir a iniciar sesión</Enlace>
      </AuthShell>
    );
  }

  async function verificar(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setEnviando(true);
    try {
      const { data } = await api(cfg.verificar, { method: "POST", body: { email, codigo } });
      iniciarSesion(data);
      router.replace(next);
    } catch (err) {
      setError(err.status === 429 ? "Demasiados intentos. Espera unos minutos." : err.message);
      setCodigo("");
      setEnviando(false);
    }
  }

  async function reenviar() {
    setError("");
    try {
      const r = await api(cfg.reenviar, { method: "POST", body: { email } });
      setInfo(r.message);
      return 60;
    } catch (err) {
      setError(err.message);
      return err.data?.reintentarEn ?? 60;
    }
  }

  return (
    <AuthShell
      eyebrow={cfg.eyebrow}
      titulo={cfg.titulo}
      subtitulo={<>Enviamos un código de 6 dígitos a <strong>{email}</strong>.</>}
      pie={<Enlace href={`/login?next=${encodeURIComponent(next)}`}>Volver a iniciar sesión</Enlace>}
    >
      <Alerta>{error}</Alerta>
      <Alerta tipo="ok">{info}</Alerta>
      <form className="auth-form" onSubmit={verificar}>
        <CampoCodigo valor={codigo} onCambio={setCodigo} disabled={enviando} />
        <Boton type="submit" cargando={enviando} disabled={codigo.length !== 6}>
          {cfg.boton}
        </Boton>
      </form>
      <div className="auth-row">
        <span className="auth-field-help">¿No te llegó? Revisa la carpeta de spam.</span>
        <BotonReenviar onReenviar={reenviar} />
      </div>
    </AuthShell>
  );
}
