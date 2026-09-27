"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export function useHeroTitle() {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Evita reprocesar si Strict Mode ya corrió este efecto antes
    if (el.dataset.animated === "true") return;
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

    gsap.fromTo(
      el.querySelectorAll(".line-inner"),
      { y: "100%" },
      {
        y: "0%",
        duration: 1,
        ease: "power4.out",
        stagger: 0.15,
        delay: 0.2,
      },
    );
  }, []);

  return ref;
}
