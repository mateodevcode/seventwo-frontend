"use client";

import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import BudgetSelect from "./components/BudgetSelect";
import { useServiceList } from "@/components/gsap/useServicesList";

const serviceTypes = [
  "Página web",
  "Aplicación web",
  "App móvil",
  "Software a medida",
];

export default function Services() {
  const [selected, setSelected] = useState("Página web");
  const [budget, setBudget] = useState("");
  const ref = useServiceList();

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
          {serviceTypes.map((type, index) => (
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
        <form className="quote-form" onSubmit={(e) => e.preventDefault()}>
          <label>
            Tipo de proyecto
            <input value={selected} readOnly />
          </label>
          <label>
            Presupuesto aproximado
            <BudgetSelect value={budget} onChange={setBudget} />
          </label>
          <label>
            Cuéntanos brevemente
            <textarea
              placeholder="Qué quieres construir y para quién..."
              rows="3"
            />
          </label>
          <div className="group relative overflow-hidden bg-sexto cursor-pointer select-none px-4 py-3.5 text-segundo w-60">
            <div className="absolute inset-0 bg-white [clip-path:polygon(0_0,0_0,0_0,0_0)] transition-[clip-path] duration-500 ease-out group-hover:[clip-path:polygon(0_0,100%_0,100%_100%,0_100%)]" />
            <div className="relative z-10 flex items-end justify-center gap-2 text-xl font-anton leading-none uppercase">
              <span>Cotiza tu proyecto</span>
              <ArrowUpRight />
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
