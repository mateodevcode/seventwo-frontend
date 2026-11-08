"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, sanearNext } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { Alerta, AuthShell, Boton, BotonGoogle, Campo, Enlace, Separador } from "./ui";

// Mismas reglas que el backend (validations/auth.validate.js).
export function errorPassword(p) {
  if (p.length < 8) return "Mínimo 8 caracteres.";
  if (new TextEncoder().encode(p).length > 72) return "Máximo 72 caracteres.";
  if (!/[A-Za-zÀ-ÿ]/.test(p) || !/\d/.test(p)) return "Incluye al menos una letra y un número.";
  return "";
}

export default function RegistroForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = sanearNext(params.get("next"));
  const { estado } = useAuth();

  // ?email= llega desde el email de una solicitud de presupuesto ("Crea tu cuenta").
  const [form, setForm] = useState({ name: "", email: params.get("email") ?? "", password: "", confirmar: "" });
  const [tocado, setTocado] = useState({});
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (estado === "autenticado") router.replace(next);
  }, [estado, next, router]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const blur = (k) => () => setTocado((t) => ({ ...t, [k]: true }));

  const errores = {
    name: form.name.trim().length < 2 ? "Escribe tu nombre." : "",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()) ? "" : "Email no válido.",
    password: errorPassword(form.password),
    confirmar: form.confirmar && form.confirmar !== form.password ? "Las contraseñas no coinciden." : "",
  };
  const valido = !Object.values(errores).some(Boolean) && form.confirmar === form.password;

  async function enviar(e) {
    e.preventDefault();
    setTocado({ name: true, email: true, password: true, confirmar: true });
    if (!valido) return;
    setError("");
    setEnviando(true);
    try {
      const { data } = await api("/auth/registro", {
        method: "POST",
        body: { name: form.name.trim(), email: form.email.trim(), password: form.password },
      });
      const qs = new URLSearchParams({ email: data.email, next });
      router.push(`/verificar-email?${qs}`);
    } catch (err) {
      setError(err.status === 429 ? "Demasiados intentos. Espera unos minutos." : err.message);
      setEnviando(false);
    }
  }

  const err = (k) => (tocado[k] ? errores[k] : "");

  return (
    <AuthShell
      eyebrow="Área de cliente"
      titulo={<>Crea tu <em>cuenta</em></>}
      subtitulo="Sigue tus proyectos y facturas en un solo lugar."
      pie={<>¿Ya tienes cuenta? <Enlace href={`/login?next=${encodeURIComponent(next)}`}>Inicia sesión</Enlace></>}
    >
      <Alerta>{error}</Alerta>
      <BotonGoogle next={next} texto="Registrarme con Google" />
      <Separador texto="o con tu email" />
      <form className="auth-form" onSubmit={enviar} noValidate>
        <Campo id="name" label="Nombre completo" autoComplete="name" value={form.name} onChange={set("name")} onBlur={blur("name")} error={err("name")} />
        <Campo id="email" label="Email" tipo="email" autoComplete="email" value={form.email} onChange={set("email")} onBlur={blur("email")} error={err("email")} />
        <Campo
          id="password"
          label="Contraseña"
          tipo="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set("password")}
          onBlur={blur("password")}
          error={err("password")}
          ayuda="Mínimo 8 caracteres, con letras y números."
        />
        <Campo id="confirmar" label="Repite la contraseña" tipo="password" autoComplete="new-password" value={form.confirmar} onChange={set("confirmar")} onBlur={blur("confirmar")} error={err("confirmar")} />
        <Boton type="submit" cargando={enviando}>
          Crear cuenta
        </Boton>
      </form>
    </AuthShell>
  );
}
