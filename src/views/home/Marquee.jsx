const ITEMS = ["SOFTWARE A MEDIDA", "CIBERSEGURIDAD", "APLICACIONES WEB", "APLICACIONES MÓVILES", "INTEGRACIONES IA"];

function MarqueeRow({ hidden }) {
  return (
    <div className="marquee-track" aria-hidden={hidden || undefined}>
      {[0, 1].map((copy) => (
        <span key={copy} style={{ display: "contents" }} aria-hidden={copy === 1 || undefined}>
          {ITEMS.map((item, i) => (
            <span key={`${copy}-${item}`} style={{ display: "contents" }}>
              <span className={i % 2 === 0 ? "marquee-impact" : "marquee-londrina"}>{item}</span>
              <span className="marquee-sep">/</span>
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}

export default function Marquee() {
  return (
    <div className="marquee" aria-label="Servicios: software a medida, ciberseguridad, aplicaciones web y móviles, integraciones IA">
      <MarqueeRow />
    </div>
  );
}
