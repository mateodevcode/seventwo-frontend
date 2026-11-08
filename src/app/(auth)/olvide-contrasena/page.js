import { Suspense } from "react";
import OlvideForm from "@/components/auth/OlvideForm";

export const metadata = { title: "Restablecer contraseña · Seventwo" };

export default function Page() {
  return (
    <Suspense>
      <OlvideForm />
    </Suspense>
  );
}
