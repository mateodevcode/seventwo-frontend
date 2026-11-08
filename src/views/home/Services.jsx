"use client";

import { ArrowUpRight, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BudgetSelect from "./components/BudgetSelect";
import { useServiceList } from "@/components/gsap/useServicesList";
import { api } from "@/lib/api";
import { TIPOS_PROYECTO, erroresSolicitud } from "@/lib/solicitudes";

const VACIO = { nombre: "", email: "", telefono: "", descripcion: "", acepta: false, website: "" };

export default function Services() {
  const [selected, setSelected] = useState("Página web");
  const [budget, setBudget] = useState("");
  const [form, setForm] = useState(VACIO);
  const [tocado, setTocado] = useState(false);
  const [estado, setEstado] = useState({ enviando: false, error: "", ok: null });
  const montado = useRef(0);
  const ref = useServiceList();

  // Momento en que se mostró el formulario (anti-bots: tiempo mínimo de llenado).
  useEffect(() => {
    montado.current = Date.now();
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const datos = { ...form, tipo_proyecto: selected, presupuesto: budget };
  const errores = erroresSolicitud(datos);
  const err = (k) => (tocado ? errores[k] : "");

  async function enviar(e) {
    e.preventDefault();
    setTocado(true);
    if (Object.keys(errores).length) return;
    setEstado({ enviando: true, error: "", ok: null });
    try {
      const r = await api("/solicitudes", {
        method: "POST",
        body: {
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
          tipo_proyecto: selected,
          presupuesto: budget || undefined,
          descripcion: form.descripcion,
          acepta: form.acepta,
          website: form.website,
          ms: Date.now() - montado.current,
        },
      });
      setEstado({ enviando: false, error: "", ok: r.data });
      setForm(VACIO);
      setTocado(false);
    } catch (error) {
      setEstado({
        enviando: false,
        error: error.status === 429 ? "Has enviado varias solicitudes seguidas. Inténtalo más tarde." : error.message,
        ok: null,
      });
    }
  }

  const registro = estado.ok
    ? `/registro?email=${encodeURIComponent(estado.ok.email)}&next=${encodeURIComponent("/area-cliente?seccion=cotizar")}`
    : "";

  return (
    <section className="section-shell services" id="servicios">
      <div className="section-heading">
        <div>
          <span className="eyebrow">03 / ¿Qué necesitás?</span>
          <h2>
            Hagamos algo
            <br />
            <em>que importe.</em>
          </h2>
        </div>
        <p>
          Cuéntanos qué quieres construir. Te respondemos con una propuesta
          pensada para tu negocio, no con un plan genérico.
        </p>
      </div>
      <div className="services-layout">
        <div
          ref={ref}
          className="service-list"
          role="listbox"
          aria-label="Tipo de proyecto"
        >
          {TIPOS_PROYECTO.map((type, index) => (
            <button
              className={
                selected === type ? "service-option selected" : "service-option"
              }
              key={type}
              onClick={() => setSelected(type)}
              role="option"
              aria-selected={selected === type}
            >
              <div className="service-option-content">
                <span>0{index + 1}</span>
                <p>{type}</p>
              </div>
              <ArrowUpRight aria-hidden="true" />
            </button>
          ))}
        </div>

        {estado.ok ? (
          <div className="quote-ok" role="status">
            <CheckCircle2 aria-hidden="true" />
            <h3>Solicitud {estado.ok.codigo} recibida</h3>
            <p>
              Te escribimos a <strong>{estado.ok.email}</strong> en menos de 24 h hábiles. Revisa tu
              correo: te enviamos la confirmación.
            </p>
            <p>¿Quieres seguirla en línea y responder desde tu área de cliente?</p>
            <div className="quote-ok-acciones">
              <Link className="quote-ok-cta" href={registro}>
                Crear cuenta con este email <ArrowUpRight aria-hidden="true" />
              </Link>
              <button type="button" className="quote-ok-otra" onClick={() => setEstado({ enviando: false, error: "", ok: null })}>
                Enviar otra solicitud
              </button>
            </div>
          </div>
        ) : (
          <form className="quote-form" onSubmit={enviar} noValidate>
            <label>
              Tipo de proyecto
              <input value={selected} readOnly />
            </label>
            <label>
              Presupuesto aproximado
              <BudgetSelect value={budget} onChange={setBudget} />
            </label>
            <div className="quote-grid">
              <label>
                Tu nombre *
                <input value={form.nombre} onChange={set("nombre")} autoComplete="name" aria-invalid={!!err("nombre")} />
                {err("nombre") && <small className="quote-error">{err("nombre")}</small>}
              </label>
              <label>
                Tu email *
                <input type="email" value={form.email} onChange={set("email")} autoComplete="email" aria-invalid={!!err("email")} />
                {err("email") && <small className="quote-error">{err("email")}</small>}
              </label>
            </div>
            <label>
              Teléfono (opcional)
              <input type="tel" value={form.telefono} onChange={set("telefono")} autoComplete="tel" placeholder="+57 300 123 4567" aria-invalid={!!err("telefono")} />
              {err("telefono") && <small className="quote-error">{err("telefono")}</small>}
            </label>
            <label>
              Cuéntanos brevemente *
              <textarea
                placeholder="Qué quieres construir y para quién..."
                rows="3"
                value={form.descripcion}
                onChange={set("descripcion")}
                maxLength={3000}
                aria-invalid={!!err("descripcion")}
              />
              {err("descripcion") && <small className="quote-error">{err("descripcion")}</small>}
            </label>

            {/* Campo trampa: invisible para personas; los bots lo rellenan. */}
            <input
              className="quote-trampa"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              name="website"
              value={form.website}
              onChange={set("website")}
            />

            <label className="quote-check">
              <input type="checkbox" checked={form.acepta} onChange={set("acepta")} />
              <span>Acepto que Seventwo me contacte sobre esta solicitud.</span>
            </label>
            {err("acepta") && <small className="quote-error">{err("acepta")}</small>}
            {estado.error && <p className="quote-error" role="alert">{estado.error}</p>}

            <button
              type="submit"
              disabled={estado.enviando}
              className="group relative overflow-hidden bg-sexto cursor-pointer select-none px-4 py-3.5 text-segundo w-60 disabled:cursor-wait disabled:opacity-70"
            >
              <span className="absolute inset-0 bg-white [clip-path:polygon(0_0,0_0,0_0,0_0)] transition-[clip-path] duration-500 ease-out group-hover:[clip-path:polygon(0_0,100%_0,100%_100%,0_100%)]" />
              <span className="relative z-10 flex items-end justify-center gap-2 text-xl font-anton leading-none uppercase">
                {estado.enviando ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                <span>{estado.enviando ? "Enviando…" : "Cotiza tu proyecto"}</span>
                {!estado.enviando && <ArrowUpRight />}
              </span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
