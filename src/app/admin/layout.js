import { AuthProvider } from "@/components/auth/AuthProvider";
import RequiereSesion from "@/components/auth/RequiereSesion";
import RequiereRol from "@/components/auth/RequiereRol";

export const metadata = {
  title: "Administración · Seventwo",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return (
    <AuthProvider>
      <RequiereSesion>
        <RequiereRol roles={["admin", "superadmin"]}>{children}</RequiereRol>
      </RequiereSesion>
    </AuthProvider>
  );
}
