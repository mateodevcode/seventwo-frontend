// src/proxy.js — chequeo optimista (Next 16: antes "middleware").
// Si no hay cookie de sesión, redirige al login sin pintar el área de cliente.
// No valida el token: eso lo hacen RequiereSesion (refresh) y el backend.
import { NextResponse } from "next/server";

export function proxy(request) {
  if (request.cookies.has("refresh_token")) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/area-cliente", "/area-cliente/:path*"],
};
