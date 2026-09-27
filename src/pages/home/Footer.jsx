import BotonArriba from "@/components/boton/BotonArriba";
import LogoModerno from "@/components/logo/LogoModerno";
import { Mail } from "lucide-react";
import BolaAnimada from "./components/BolaAnimada";
import Link from "next/link";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaWhatsapp,
} from "react-icons/fa";
import { dataFooter } from "@/data/data.footer";

export default function Footer() {
  const classLink = "flex items-center gap-2";

  return (
    <footer className="footer section-shell relative overflow-hidden">
      <BolaAnimada size={700} />
      <BolaAnimada size={300} />

      <LogoModerno />
      <div className="footer-links">
        <div>
          <span className="font-semibold">Productos</span>
          {dataFooter.productos.map((item, id) => {
            return (
              <Link key={id} href={item.link} className={`${classLink}`}>
                {item.name}
              </Link>
            );
          })}
        </div>
        <div>
          <span className="font-semibold">Seventwo</span>
          <Link href="#servicios" className={`${classLink}`}>
            Servicios
          </Link>
          <Link href="#nosotros" className={`${classLink}`}>
            Nosotros
          </Link>
          <Link href="#recursos" className={`${classLink}`}>
            Recursos
          </Link>
          <Link href="#contacto" className={`${classLink}`}>
            Contacto
          </Link>
        </div>

        <div>
          <span className="font-semibold">Recursos</span>
          <Link href="#servicios" className={`${classLink}`}>
            Blog
          </Link>
          <Link href="#nosotros" className={`${classLink}`}>
            Periodico digital
          </Link>
          <Link href="#recursos" className={`${classLink}`}>
            Cursos gratis
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2024 Seventwo Technologies</span>

        <div>
          <div className="text-3xl flex items-center gap-8">
            <span className="text-xs">Síguenos</span>

            <div className="flex items-center gap-4 text-xl">
              <Link
                href="https://www.instagram.com/seventwotech/"
                target="_blank"
              >
                <FaInstagram />
              </Link>
              <Link
                href="https://www.facebook.com/seventwotech"
                target="_blank"
              >
                <FaFacebook />
              </Link>
              <Link
                href="https://www.linkedin.com/company/seventwo-technologies"
                target="_blank"
              >
                <FaLinkedin />
              </Link>
              <Link
                href={`https://wa.me/${dataFooter.contacto_whatsapp.numero[1]}`}
                target="_blank"
              >
                <FaWhatsapp />
              </Link>
            </div>

            <BotonArriba />
          </div>
        </div>
      </div>
    </footer>
  );
}
