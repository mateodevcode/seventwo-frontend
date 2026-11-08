"use client";

// Guarda del lado cliente: el proxy solo mira si existe la cookie; aquí se
// confirma que la sesión es válida (refresh OK) antes de mostrar el contenido.
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { scrollbarStyles } from "@/data/data.styles.scrollbar";
import "./auth.css";

export default function RequiereSesion({ children }) {
  const { estado } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (estado === "anonimo") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [estado, pathname, router]);

  if (estado !== "autenticado") {
    return (
      <main className="auth-root">
        <div className="auth-center" role="status">
          <Loader2 className="auth-spin" aria-hidden="true" />
          <span>Cargando tu área de cliente…</span>
        </div>
        <style>{scrollbarStyles.home}</style>
      </main>
    );
  }
  return children;
}
