"use client";

// /admin → proyecto → Contrato: subir versiones (borrador o ya firmada fuera),
// revisar el PDF, enviarlo al cliente con una nota y ver la evidencia de aceptación.
import { useRef, useState } from "react";
import { FileText, Send, Trash2, Upload } from "lucide-react";
import { api, abrirArchivo } from "@/lib/api";
import { ESTADOS_CONTRATO, erroresDe, fechaHoraLarga, tamano } from "@/lib/clientes";
import { Alerta, Boton, Campo } from "@/components/auth/ui";
import { PillContrato } from "@/components/clientes/ContratosCliente";

const MAX = 10 * 1024 * 1024;

function Subir({ proyectoId, onSubido }) {
  const [titulo, setTitulo] = useState("Contrato de prestación de servicios");
  const [archivo, setArchivo] = useState(null);
  const [fuera, setFuera] = useState(false);
  const [error, setError] = useState("");
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const input = useRef(null);

  const elegir = (e) => {
    const f = e.target.files?.[0] ?? null;
    setError("");
    if (f && f.type !== "application/pdf") { setError("Elige un archivo PDF."); e.target.value = ""; return; }
    if (f && f.size > MAX) { setError("El PDF supera los 10 MB."); e.target.value = ""; return; }
    setArchivo(f);
  };

  const subir = async (e) => {
    e.preventDefault();
    if (!archivo) return;
    setCargando(true);
    setError("");
    setErrores({});
    try {
      const qs = new URLSearchParams({ titulo, nombre: archivo.name, ...(fuera ? { firmado_fuera: "1" } : {}) });
      const r = await api(`/admin/proyectos/${proyectoId}/contratos?${qs}`, { method: "POST", auth: true, archivo });
      setArchivo(null);
      setFuera(false);
      if (input.current) input.current.value = "";
      onSubido(r.message);
    } catch (er) {
      setError(er.message);
      setErrores(erroresDe(er));
    } finally {
      setCargando(false);
    }
  };

  return (
    <form className="auth-embed auth-form contrato-subir" onSubmit={subir} noValidate>
      <Alerta>{error}</Alerta>
      <div className="solicitud-grid">
        <Campo id="ct-titulo" label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} error={errores.titulo} />
        <div className="auth-field">
          <label htmlFor="ct-pdf">Archivo PDF (máx. 10 MB)</label>
          <input id="ct-pdf" ref={input} type="file" accept="application/pdf" onChange={elegir} className="contrato-file" />
          {archivo && <p className="auth-field-help">{archivo.name} · {tamano(archivo.size)}</p>}
        </div>
      </div>
      <label className="solicitud-check">
        <input type="checkbox" checked={fuera} onChange={(e) => setFuera(e.target.checked)} />
        Ya está firmado fuera de la app (papel, DocuSign…): archivarlo como vigente sin pedir aceptación.
      </label>
      <div className="auth-row">
        <Boton type="submit" cargando={cargando} disabled={!archivo || titulo.trim().length < 3}>
          <Upload aria-hidden="true" width={15} height={15} /> {fuera ? "Archivar contrato firmado" : "Subir borrador"}
        </Boton>
      </div>
    </form>
  );
}

function Enviar({ contrato, onHecho, onCancelar }) {
  const [nota, setNota] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const enviar = async () => {
    setCargando(true);
    setError("");
    try {
      const r = await api(`/admin/contratos/${contrato.id}/enviar`, { method: "POST", auth: true, body: { nota: nota || null } });
      onHecho(r.message);
    } catch (e) {
      setError(e.message);
      setCargando(false);
    }
  };
  return (
    <div className="auth-embed contrato-enviar">
      <Alerta>{error}</Alerta>
      <label htmlFor={`nota-${contrato.id}`} className="eyebrow">Nota para el cliente (opcional)</label>
      <textarea id={`nota-${contrato.id}`} className="solicitud-textarea" rows={3} maxLength={1000} value={nota} onChange={(e) => setNota(e.target.value)}
        placeholder="Ej.: Te dejamos el contrato con el alcance y los pagos acordados." />
      <div className="auth-row">
        <Boton type="button" cargando={cargando} onClick={enviar}><Send aria-hidden="true" width={15} height={15} /> Enviar al cliente</Boton>
        <button type="button" className="auth-text-button" onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  );
}

export default function ContratosAdmin({ proyectoId, contratos = [], almacen = true, onCambio }) {
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const hayBorrador = contratos.some((c) => c.estado === "borrador");

  const hecho = (m) => { setOk(m); setError(""); setEnviando(null); setSubiendo(false); onCambio(); };
  const abrir = (id) => { setError(""); abrirArchivo(`/admin/contratos/${id}/archivo`).catch((e) => setError(e.message)); };
  const borrar = async (c) => {
    if (!window.confirm(`¿Borrar el borrador v${c.version}? Se elimina el PDF.`)) return;
    try { hecho((await api(`/admin/contratos/${c.id}`, { method: "DELETE", auth: true })).message); } catch (e) { setError(e.message); }
  };

  return (
    <div className="contratos">
      <div className="auth-embed"><Alerta tipo="ok">{ok}</Alerta><Alerta>{error}</Alerta></div>
      {!almacen && <div className="auth-embed"><Alerta>El almacenamiento (S3) no está configurado en el servidor: no se pueden subir contratos.</Alerta></div>}

      {contratos.length === 0 && <p className="admin-vacio">Aún no hay contrato. Sube el PDF como borrador, revísalo y envíalo al cliente.</p>}
      {contratos.map((c) => (
        <div key={c.id} className={`contrato-card ${c.estado === "reemplazado" ? "apagado" : ""}`}>
          <div className="contrato-cabecera">
            <div>
              <strong>v{c.version} · {c.titulo}</strong>
              <small>
                {c.archivo_nombre} · {tamano(c.archivo_bytes)} · subido {fechaHoraLarga(c.created_at)}{c.creado_por_nombre ? ` por ${c.creado_por_nombre}` : ""}
                {c.enviado_en ? ` · enviado ${fechaHoraLarga(c.enviado_en)}${c.enviado_por_nombre ? ` por ${c.enviado_por_nombre}` : ""}` : ""}
              </small>
            </div>
            <PillContrato estado={c.estado} />
          </div>
          {c.estado === "aceptado" && (
            <dl className="contrato-evidencia">
              <dt>Aceptado</dt><dd>{fechaHoraLarga(c.aceptado_en)}</dd>
              <dt>Firmó como</dt><dd>{c.aceptado_nombre}</dd>
              <dt>IP</dt><dd>{c.aceptado_ip ?? "—"}</dd>
              <dt>Navegador</dt><dd title={c.aceptado_ua ?? ""}>{(c.aceptado_ua ?? "—").slice(0, 70)}</dd>
              <dt>Huella SHA-256</dt><dd className="mono">{c.sha256}</dd>
            </dl>
          )}
          {c.nota && c.estado !== "borrador" && <p className="contrato-nota">{c.nota}</p>}
          <div className="contrato-acciones">
            <button type="button" className="text-button" onClick={() => abrir(c.id)}><FileText aria-hidden="true" /> Ver PDF</button>
            {c.estado === "borrador" && enviando !== c.id && (
              <>
                <button type="button" className="text-button" onClick={() => { setOk(""); setEnviando(c.id); }}><Send aria-hidden="true" /> Enviar al cliente</button>
                <button type="button" className="text-button" onClick={() => borrar(c)}><Trash2 aria-hidden="true" /> Borrar</button>
              </>
            )}
          </div>
          {enviando === c.id && <Enviar contrato={c} onHecho={hecho} onCancelar={() => setEnviando(null)} />}
          {c.estado === "borrador" && contratos.some((x) => ["enviado", "aceptado", "firmado_fuera"].includes(x.estado)) && enviando !== c.id && (
            <p className="heading-description" style={{ margin: "6px 0 0", fontSize: 12 }}>
              Al enviarlo, la versión vigente pasará a «{ESTADOS_CONTRATO.reemplazado}» y el cliente tendrá que aceptar esta.
            </p>
          )}
        </div>
      ))}

      {almacen && (subiendo ? (
        <Subir proyectoId={proyectoId} onSubido={hecho} />
      ) : (
        <button type="button" className="button button-outline" style={{ marginTop: 12 }} onClick={() => { setOk(""); setSubiendo(true); }} disabled={hayBorrador}
          title={hayBorrador ? "Envía o borra el borrador actual antes de subir otro" : undefined}>
          <Upload aria-hidden="true" /> {contratos.length ? "Subir nueva versión" : "Subir contrato"}
        </button>
      ))}
    </div>
  );
}
