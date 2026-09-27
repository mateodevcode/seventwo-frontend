"use client";

import Image from "next/image";
import Link from "next/link";
import { icon_logo } from "@/data/logo";

const LogoModerno = ({ color }) => {
  return (
    <Link
      className="brand flex items-center select-none gap-1"
      href="#inicio"
      aria-label="Seventwo Technologies, inicio"
    >
      <Image
        src={icon_logo.src}
        alt={icon_logo.alt}
        className="brand-logo"
        width={500}
        height={500}
      />
      <span className="text-2xl font-bangers">
        <span className="brand-text" data-text="SEVENTWO">
          SEVENTWO
        </span>
        <span className="brand-dot">.</span>
      </span>
    </Link>
  );
};

export default LogoModerno;
