export default function ProductArt({ type }) {
  const title =
    type === "inmobitwo-art"
      ? "Encuentra tu próximo lugar."
      : type === "bordex-art"
        ? "Control operativo"
        : type === "reservas-art"
          ? "Tu tiempo, mejor"
          : "Todo el sabor.";

  return (
    <div className={`product-art ${type}`} aria-hidden="true">
      <div className="art-window">
        <span />
        <span />
        <span />
        <div className="art-content">
          <b>{title}</b>
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}
