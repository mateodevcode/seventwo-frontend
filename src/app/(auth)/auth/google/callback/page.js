import { Suspense } from "react";
import GoogleCallback from "@/components/auth/GoogleCallback";

export const metadata = { title: "Entrando con Google · Seventwo" };

export default function Page() {
  return (
    <Suspense>
      <GoogleCallback />
    </Suspense>
  );
}
