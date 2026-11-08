"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, sanearNext } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { Alerta, AuthShell, Boton, BotonGoogle, Campo, Enlace, ERRORES_GOOGLE, Separador } from "./ui";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = sanearNext(params.get("next"));
  const { estado, iniciarSesion } = useAuth();

  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(ERRORES_GOOGLE[params.get("error")] ?? "");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (estado === "autenticado") router.replace(next);
  }, [estado, next, router]);

  const qs = (extra = {}) => new URLSearchParams({ email: email.trim().toLowerCase(), next, ...extra }).toString();

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const { data } = await api("/auth/login", { method: "POST", body: { email, password } });
      if (data?.requiereVerificacion) return router.push(`/verificar-email?${qs()}`);
      if (data?.requiereOTP) return router.push(`/login/otp?${qs()}`);
      iniciarSesion(data);
      router.replace(next);
    } catch (err) {
      setError(err.status === 429 ? "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." : err.message);
      setEnviando(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Área de cliente"
      titulo={<>Inicia <em>sesión</em></>}
      subtitulo="Accede a tus proyectos, facturas y soporte."
      pie={<>¿No tienes cuenta? <Enlace href={`/registro?next=${encodeURIComponent(next)}`}>Crea una</Enlace></>}
    >
      {error && (
        <Alerta>
          {error}
          {/bloquead/i.test(error) && (
            <>
              {" "}
              <Enlace href={`/olvide-contrasena?${qs()}`}>Restablecer contraseña</Enlace>
            </>
          )}
        </Alerta>
      )}

      <BotonGoogle next={next} />
      <Separador texto="o con tu email" />

      <form className="auth-form" onSubmit={enviar} noValidate>
        <Campo
          id="email"
          label="Email"
          tipo="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Campo
          id="password"
          label="Contraseña"
          tipo="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="auth-row">
          <span />
          <Enlace href={`/olvide-contrasena?${qs()}`}>¿Olvidaste tu contraseña?</Enlace>
        </div>
        <Boton type="submit" cargando={enviando} disabled={!email || !password}>
          Entrar
        </Boton>
      </form>
    </AuthShell>
  );
}
