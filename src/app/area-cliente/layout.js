import { AuthProvider } from "@/components/auth/AuthProvider";
import RequiereSesion from "@/components/auth/RequiereSesion";

export const metadata = {
  title: "Área de cliente · Seventwo",
  robots: { index: false, follow: false },
};

export default function AreaClienteLayout({ children }) {
  return (
    <AuthProvider>
      <RequiereSesion>{children}</RequiereSesion>
    </AuthProvider>
  );
}
