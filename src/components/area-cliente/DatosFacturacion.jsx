"use client";

// Mi perfil → Datos de facturación: la ficha de cliente que el propio cliente
// completa y edita (docs/CLIENTES.md §3.3). No se muestra si la cuenta no tiene ficha.
import { useEffect, useState } from "react";
import { Building2, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { Alerta } from "@/components/auth/ui";
import FichaForm from "@/components/clientes/FichaForm";
import FichaVista from "@/components/clientes/FichaVista";
import "@/components/clientes/clientes.css";

export default function DatosFacturacion() {
  const [ficha, setFicha] = useState(undefined); // undefined = cargando; null = sin ficha
  const [editando, setEditando] = useState(false);
  const [ok, setOk] = useState("");

  useEffect(() => {
    let vigente = true;
    api("/clientes/yo", { auth: true }).then((r) => vigente && setFicha(r.data)).catch(() => vigente && setFicha(null));
    return () => { vigente = false; };
  }, []);

  if (!ficha) return null;

  const guardar = async (body) => {
    const r = await api("/clientes/yo", { method: "PATCH", auth: true, body });
    setFicha(r.data);
    setEditando(false);
    setOk(r.message);
  };

  const incompleta = !ficha.numero_documento || !ficha.direccion || !ficha.ciudad;

  return (
    <div className="data-panel" style={{ marginTop: 18 }}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Cliente desde {new Date(ficha.created_at).toLocaleDateString("es-CO", { month: "long", year: "numeric" })}</p>
          <h2>Datos de facturación</h2>
        </div>
        {!editando ? (
          <button type="button" className="button button-outline" onClick={() => { setOk(""); setEditando(true); }}>
            <Pencil aria-hidden="true" /> Editar
          </button>
        ) : (
          <Building2 aria-hidden="true" />
        )}
      </div>
      {editando ? (
        <FichaForm valores={ficha} onGuardar={guardar} onCancelar={() => setEditando(false)} />
      ) : (
        <>
          <div className="auth-embed" style={{ marginTop: 14 }}>
            <Alerta tipo="ok">{ok}</Alerta>
            {incompleta && !ok && (
              <Alerta>Completa tu documento y dirección: los usaremos en tus contratos y cuentas de cobro.</Alerta>
            )}
          </div>
          <FichaVista c={ficha} />
        </>
      )}
    </div>
  );
}
