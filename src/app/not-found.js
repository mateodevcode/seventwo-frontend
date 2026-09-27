"use client";

import Link from "next/link";
import { BsArrowRight } from "react-icons/bs";

const notFound = () => {
  return (
    <main
      className="grid h-screen place-items-center bg-segundo px-6 py-24 sm:py-32 lg:px-8 font-poppins"
      style={{
        backgroundImage: "url('/not-found/not-found-05.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="text-center -mt-40">
        <p className="text-4xl font-extrabold text-purple-600">404</p>
        <h1 className="mt-4 text-5xl font-bold tracking-tight text-balance text-white sm:text-7xl">
          Pagina no encontrada
        </h1>
        <p className="mt-6 text-base font-medium text-pretty text-gray-300 sm:text-xl/8">
          Lo sentimos, no hemos podido encontrar la página que estás buscando.
          <br />
          Por favor, verifica la URL o vuelve a la página de inicio.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <button
            className="rounded-md bg-purple-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-purple-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 cursor-pointer select-none"
            onClick={() => window.history.back()}
          >
            Regresar
          </button>
          <Link
            href="#"
            className="text-sm font-semibold text-white flex items-center hover:text-zinc-200 cursor-pointer select-none"
          >
            Contactar soporte <BsArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
};

export default notFound;
