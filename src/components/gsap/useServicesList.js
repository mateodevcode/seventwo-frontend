"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useServiceList() {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const items = el.querySelectorAll(".service-option");
    if (items.length === 0) return;

    gsap.set(items, { opacity: 0, x: -60 });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      onEnter: () => {
        gsap.to(items, {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.15,
        });
      },
    });

    return () => trigger.kill();
  }, []);

  return ref;
}
