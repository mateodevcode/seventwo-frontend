import { Suspense } from "react";
import AreaClientePage from "@/views/area-cliente/page";

export default function Page() {
  return (
    <Suspense>
      <AreaClientePage />
    </Suspense>
  );
}
