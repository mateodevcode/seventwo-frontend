"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Work from "./Work";

gsap.registerPlugin(ScrollTrigger);

export default function Proyectos() {
  const root = useRef(null);
  const stripRef = useRef(null);
  const outroRef = useRef(null);

  useLayoutEffect(() => {
    const distance = () =>
      stripRef.current.scrollWidth -
      window.innerWidth / 2 -
      outroRef.current.offsetWidth / 2;

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray(".work-panel");

      gsap.to(stripRef.current, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: ".work-track",
          pin: true,
          scrub: 1,
          end: () => `+=${distance()}`,
        },
      });

      panels.forEach((panel) => {
        gsap.from(panel.querySelector(".project-image"), {
          scale: 1.18,
          ease: "none",
          scrollTrigger: {
            trigger: panel,
            start: "left right",
            end: "right left",
            scrub: true,
          },
        });
      });
    }, root);

    // Espera a que TODAS las imágenes de la tira carguen antes de recalcular
    const imgs = stripRef.current.querySelectorAll("img");
    const pending = Array.from(imgs).filter((img) => !img.complete);

    if (pending.length === 0) {
      ScrollTrigger.refresh();
    } else {
      let loaded = 0;
      pending.forEach((img) => {
        const onDone = () => {
          loaded += 1;
          if (loaded === pending.length) {
            ScrollTrigger.refresh();
          }
        };
        img.addEventListener("load", onDone, { once: true });
        img.addEventListener("error", onDone, { once: true }); // por si alguna falla, no bloquear el refresh
      });
    }

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="work-section">
      <Work stripRef={stripRef} outroRef={outroRef} />
    </section>
  );
}
