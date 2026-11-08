import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Iniciar sesión · Seventwo" };

export default function Page() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
