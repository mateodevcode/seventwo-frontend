import { Suspense } from "react";
import CodigoForm from "@/components/auth/CodigoForm";

export const metadata = { title: "Verificación en dos pasos · Seventwo" };

export default function Page() {
  return (
    <Suspense>
      <CodigoForm modo="otp" />
    </Suspense>
  );
}
