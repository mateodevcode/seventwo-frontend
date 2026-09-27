"use client";

import { useRef, useState } from "react";
import Link from "next/link";

export default function EnlaceFlip({ texto, textoHover, className, href, i }) {
  const [hovered, setHovered] = useState(false);
  const currentRef = useRef(false);
  const pendingRef = useRef(null);
  const animatingRef = useRef(false);

  const go = (value) => {
    if (animatingRef.current) {
      pendingRef.current = value;
      return;
    }
    if (currentRef.current === value) return;

    currentRef.current = value;
    animatingRef.current = true;
    setHovered(value);
  };

  const handleTransitionEnd = () => {
    animatingRef.current = false;
    if (
      pendingRef.current !== null &&
      pendingRef.current !== currentRef.current
    ) {
      const next = pendingRef.current;
      pendingRef.current = null;
      go(next);
    } else {
      pendingRef.current = null;
    }
  };

  return (
    <Link
      href={href}
      key={i}
      className="relative inline-block overflow-hidden h-[1.5em] leading-none"
      onMouseEnter={() => go(true)}
      onMouseLeave={() => go(false)}
    >
      <div
        onTransitionEnd={handleTransitionEnd}
        className={`flex flex-col transition-transform duration-500 ease-out ${
          hovered ? "translate-y-0" : "-translate-y-1/2"
        } ${className}`}
      >
        <span className="block h-[1.5em] font-poppins text-base">
          {textoHover}
        </span>
        <span className="block h-[1.5em] font-poppins text-base">{texto}</span>
      </div>
    </Link>
  );
}
