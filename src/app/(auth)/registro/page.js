import { Suspense } from "react";
import RegistroForm from "@/components/auth/RegistroForm";

export const metadata = { title: "Crear cuenta · Seventwo" };

export default function Page() {
  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  );
}
