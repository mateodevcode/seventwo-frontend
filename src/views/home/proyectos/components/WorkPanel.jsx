const EMPTY = {
  number: "",
  category: "",
  title: "",
  description: "",
  image: "",
  tags: [],
};

export default function WorkPanel({ project = EMPTY }) {
  return (
    <article className="work-panel relative h-[68vh] w-[min(68vw,980px)] shrink-0 overflow-hidden border border-transparent bg-(--home-card) transition-colors duration-500 ease-in-out hover:border-sexto max-[700px]:h-[64vh] max-[700px]:w-[84vw]">
      <div
        className="project-image absolute inset-[-4%] bg-cover bg-center grayscale-25"
        style={{ backgroundImage: `url(${project.image})` }}
      />
      <div className="project-overlay absolute inset-0 bg-black/[0.58]" />
      <span className="project-number absolute right-7.5 top-5.5 font-impact text-[clamp(100px,13vw,230px)] leading-[0.8] text-outline-lime-2 max-[700px]:right-4.5">
        {project.number}
      </span>
      <div className="project-content absolute inset-9.5 flex max-w-155 flex-col justify-end max-[700px]:inset-6">
        <p className="project-category text-[13px] tracking-[0.18em] text-(--home-lime) font-semibold">
          {project.category}
        </p>
        <h3 className="mb-7.5 mt-5 font-impact text-[clamp(48px,6vw,90px)] leading-[0.9] max-[700px]:text-[13vw]">
          {project.title.split("\n").map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
        </h3>
        <p className="project-description max-w-150 text-base leading-[1.55] text-primero/90 max-[700px]:text-xs">
          {project.description}
        </p>
        <div className="tags mt-5 flex flex-wrap gap-2.25">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-(--home-lime) px-3.25 py-2.25 text-[11px] text-segundo bg-sexto font-semibold"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
