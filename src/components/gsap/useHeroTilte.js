"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export function useHeroTitle() {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // En Strict Mode el efecto se monta-desmonta-monta: si ya está
    // particionado, reutiliza los .line-inner en vez de repartir de nuevo.
    if (el.dataset.animated !== "true") {
      el.dataset.animated = "true";

      const nodos = Array.from(el.childNodes);
      const lineas = [[]];

      nodos.forEach((nodo) => {
        if (nodo.nodeName === "BR") {
          lineas.push([]);
        } else {
          lineas[lineas.length - 1].push(nodo);
        }
      });

      el.innerHTML = "";

      lineas.forEach((nodosDeLinea) => {
        const mask = document.createElement("span");
        mask.className = "line-mask";

        const inner = document.createElement("span");
        inner.className = "line-inner";

        nodosDeLinea.forEach((nodo) => inner.appendChild(nodo));
        mask.appendChild(inner);
        el.appendChild(mask);
      });
    }

    const inners = el.querySelectorAll(".line-inner");
    if (!inners.length) return;

    // Accesibilidad: sin bucle si el usuario prefiere movimiento reducido
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(inners, { y: "0%" });
      return;
    }

    gsap.set(inners, { y: "110%" });

    // Bucle: entra -> pausa lectura -> sale -> pausa -> repite
    // repeatDelay + duraciones = ~6s por ciclo para no saturar
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4, delay: 0.2 });
    tl.fromTo(
      inners,
      { y: "110%" },
      {
        y: "0%",
        duration: 1,
        ease: "power4.out",
        stagger: 0.15,
      },
    )
      // Tiempo de lectura antes de salir
      .to(inners, {
        y: "-110%",
        duration: 0.7,
        ease: "power3.in",
        stagger: 0.1,
      }, "+=3.6");

    return () => {
      tl.kill();
    };
  }, []);

  return ref;
}
