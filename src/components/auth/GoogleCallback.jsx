"use client";

// Vuelta desde Google: el backend ya puso la cookie refresh; aquí solo se
// obtiene el accessToken con /auth/refresh y se navega a `next`.
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { refrescarSesion, sanearNext } from "@/lib/api";
import { Alerta, AuthShell, Enlace } from "./ui";

export default function GoogleCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const next = sanearNext(params.get("next"));
  const [error, setError] = useState("");
  const hecho = useRef(false);

  useEffect(() => {
    if (hecho.current) return; // StrictMode monta dos veces en dev
    hecho.current = true;
    refrescarSesion()
      .then(() => router.replace(next))
      .catch(() => setError("No pudimos completar el ingreso con Google. Inténtalo de nuevo."));
  }, [next, router]);

  return (
    <AuthShell eyebrow="Google" titulo={<>Entrando<em>…</em></>}>
      {error ? (
        <>
          <Alerta>{error}</Alerta>
          <Enlace href={`/login?next=${encodeURIComponent(next)}`}>Volver a iniciar sesión</Enlace>
        </>
      ) : (
        <div className="auth-center">
          <Loader2 className="auth-spin" aria-hidden="true" />
          <span>Validando tu cuenta de Google…</span>
        </div>
      )}
    </AuthShell>
  );
}
