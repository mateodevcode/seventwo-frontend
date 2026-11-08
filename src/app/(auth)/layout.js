import { AuthProvider } from "@/components/auth/AuthProvider";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
