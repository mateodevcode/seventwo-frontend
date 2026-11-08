import { Suspense } from "react";
import AdminPage from "@/views/admin/AdminPage";

export default function Page() {
  return (
    <Suspense>
      <AdminPage />
    </Suspense>
  );
}
