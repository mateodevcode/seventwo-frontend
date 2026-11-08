"use client";

// Área de cliente → detalle de proyecto → Contrato: leer el PDF (link firmado de
// pocos minutos) y aceptarlo escribiendo su nombre (docs/CLIENTES.md §7.5).
import { useState } from "react";
import { CheckCircle2, FileText } from "lucide-react";
import { api, abrirArchivo } from "@/lib/api";
import { ESTADOS_CONTRATO, erroresDe, fechaHoraLarga, tamano } from "@/lib/clientes";
import { useAuth } from "@/components/auth/AuthProvider";
import { Alerta, Boton, Campo } from "@/components/auth/ui";

export const PillContrato = ({ estado }) => <span className={`pill contrato-${estado}`}>{ESTADOS_CONTRATO[estado] ?? estado}</span>;

function Aceptar({ contrato, onAceptado }) {
  const { usuario } = useAuth();
  const [nombre, setNombre] = useState("");
  const [acepto, setAcepto] = useState(false);
  const [leido, setLeido] = useState(false);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const leer = async () => {
    setError("");
    try {
      await abrirArchivo(`/contratos/${contrato.id}/archivo`);
      setLeido(true);
    } catch (e) {
      setError(e.message);
    }
  };

  const enviar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    setErrores({});
    try {
      const r = await api(`/contratos/${contrato.id}/aceptar`, { method: "POST", auth: true, body: { nombre, acepto } });
      onAceptado(r.message);
    } catch (er) {
      setError(er.message);
      setErrores(erroresDe(er));
    } finally {
      setCargando(false);
    }
  };

  return (
    <form className="auth-embed auth-form contrato-aceptar" onSubmit={enviar} noValidate>
      <Alerta>{error}</Alerta>
      {contrato.nota && <p className="contrato-nota">{contrato.nota}</p>}
      <button type="button" className="button button-outline" onClick={leer}>
        <FileText aria-hidden="true" /> {leido ? "Volver a abrir el contrato" : "Leer el contrato (PDF)"}
      </button>
      <Campo
        id={`firma-${contrato.id}`}
        label="Escribe tu nombre completo para aceptarlo"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder={usuario?.name ?? ""}
        autoComplete="name"
        error={errores.nombre}
      />
      <label className="solicitud-check">
        <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />
        He leído el contrato «{contrato.titulo}» (versión {contrato.version}) y acepto sus condiciones.
      </label>
      <p className="heading-description" style={{ margin: 0, fontSize: 12 }}>
        Guardaremos la fecha, tu nombre y la huella del documento como registro de la aceptación.
      </p>
      <Boton type="submit" cargando={cargando} disabled={!acepto || nombre.trim().length < 5}>Aceptar contrato</Boton>
    </form>
  );
}

export default function ContratosCliente({ contratos = [], onCambio }) {
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");
  const vigente = contratos.find((c) => ["enviado", "aceptado", "firmado_fuera"].includes(c.estado));
  const anteriores = contratos.filter((c) => c !== vigente);

  const abrir = (id) => {
    setError("");
    abrirArchivo(`/contratos/${id}/archivo`).catch((e) => setError(e.message));
  };

  if (!contratos.length) return <p className="heading-description">Muy pronto podrás leer y aceptar el contrato desde aquí.</p>;

  return (
    <div className="contratos">
      <div className="auth-embed"><Alerta tipo="ok">{ok}</Alerta><Alerta>{error}</Alerta></div>
      {vigente && (
        <div className="contrato-card">
          <div className="contrato-cabecera">
            <div>
              <strong>{vigente.titulo}</strong>
              <small>Versión {vigente.version} · {vigente.archivo_nombre} · {tamano(vigente.archivo_bytes)}</small>
            </div>
            <PillContrato estado={vigente.estado} />
          </div>
          {vigente.estado === "enviado" && (
            <Aceptar contrato={vigente} onAceptado={(m) => { setOk(m); onCambio?.(); }} />
          )}
          {vigente.estado === "aceptado" && (
            <p className="contrato-ok">
              <CheckCircle2 aria-hidden="true" /> Aceptado el {fechaHoraLarga(vigente.aceptado_en)} como «{vigente.aceptado_nombre}».
            </p>
          )}
          {vigente.estado === "firmado_fuera" && (
            <p className="contrato-ok"><CheckCircle2 aria-hidden="true" /> Contrato firmado y archivado por el equipo.</p>
          )}
          {vigente.estado !== "enviado" && (
            <button type="button" className="text-button" onClick={() => abrir(vigente.id)}>
              <FileText aria-hidden="true" /> Ver contrato
            </button>
          )}
        </div>
      )}
      {anteriores.length > 0 && (
        <details className="contrato-historial">
          <summary>Versiones anteriores ({anteriores.length})</summary>
          {anteriores.map((c) => (
            <button key={c.id} type="button" className="text-button" onClick={() => abrir(c.id)}>
              v{c.version} · {c.titulo} · {ESTADOS_CONTRATO[c.estado]}
            </button>
          ))}
        </details>
      )}
    </div>
  );
}
