import { Suspense } from "react";
import CodigoForm from "@/components/auth/CodigoForm";

export const metadata = { title: "Verifica tu email · Seventwo" };

export default function Page() {
  return (
    <Suspense>
      <CodigoForm modo="email" />
    </Suspense>
  );
}
