"use client";

// Guarda de rol del lado cliente (va dentro de RequiereSesion). La autorización
// real la hace el backend en cada endpoint; esto solo evita pintar el área.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function RequiereRol({ roles, redirigir = "/area-cliente", children }) {
  const { usuario } = useAuth();
  const router = useRouter();
  const permitido = roles.includes(usuario?.rol);

  useEffect(() => {
    if (usuario && !permitido) router.replace(redirigir);
  }, [usuario, permitido, redirigir, router]);

  return permitido ? children : null;
}
