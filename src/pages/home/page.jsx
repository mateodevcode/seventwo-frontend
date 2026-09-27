import SiteHeader from "./components/SiteHeader";
import Hero from "./Hero";
import Marquee from "./Marquee";
import ProductEcosystem from "./ProductEcosystem";
import Services from "./Services";
import Trust from "./Trust";
import Resources from "./Resources";
import Contact from "./Contact";
import Footer from "./Footer";
import "./home.css";
import Proyectos from "./proyectos/Proyectos";
import { scrollbarStyles } from "@/data/data.styles.scrollbar";

export default function HomePage() {
  return (
    <main className="home-root">
      <SiteHeader />
      <Hero />
      <Marquee />
      <Proyectos />
      {/* <ProductEcosystem /> */}
      <Services />
      <Trust />
      <Resources />
      <Contact />
      <Footer />

      <style>{scrollbarStyles.home}</style>
    </main>
  );
}
