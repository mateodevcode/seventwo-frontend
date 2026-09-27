"use client";

import Image from "next/image";
import Link from "next/link";
import { icon_logo } from "@/data/logo";

const Logo = ({ color }) => {
  return (
    <Link href="/" className="flex items-center select-none gap-1">
      <Image
        src={icon_logo.src}
        alt={icon_logo.alt}
        width={400}
        height={400}
        className="w-8 md:w-10 h-auto"
      />
      <div className="flex flex-col items-center justify-center leading-2">
        <h2
          className={`font-extrabold font-poppins text-3xl
          ${color ? "text-segundo" : "text-primero"}`}
        >
          Seventwo
        </h2>
        <span
          className={`hidden text-primero/50 ml-2 md:ml-5 text-sm -mt-2 font-poppins
          ${color ? "text-segundo" : "text-primero"}`}
        >
          Technologies
        </span>
      </div>
    </Link>
  );
};

export default Logo;
