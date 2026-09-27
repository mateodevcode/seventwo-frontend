import projects from "@/data/proyectos";
import WorkPanel from "./components/WorkPanel";
import BolaAnimada from "../components/BolaAnimada";

export default function Work({ stripRef, outroRef }) {
  return (
    <section
      id="work"
      className="work-track flex h-svh items-center overflow-hidden border-t border-(--home-line)"
    >
      <BolaAnimada />
      <div
        ref={stripRef}
        className="work-strip flex w-max items-center gap-29 px-[5vw] max-[700px]:gap-10 max-[700px]:px-4"
      >
        <div className="work-intro min-w-[52vw] shrink-0 pl-7 max-[700px]:min-w-[80vw] max-[700px]:pl-0">
          <span className="eyebrow">02 / Lo que estamos construyendo</span>
          <h2>
            IDEAS QUE SALEN
            <br />
            <em>AL MUNDO.</em> <span className="arrow">→</span>
          </h2>
        </div>
        {projects.map((project) => (
          <WorkPanel key={project.number} project={project} />
        ))}
        <div
          ref={outroRef}
          className="work-outro min-w-[52vw] shrink-0 pr-7 max-[700px]:min-w-[80vw] max-[700px]:pr-0"
        >
          <span className="eyebrow">Tu turno</span>
          <h2>
            TU PROYECTO ES
            <br />
            <em>EL SIGUIENTE...</em>
          </h2>
        </div>
      </div>
    </section>
  );
}
