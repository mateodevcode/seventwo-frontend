// "use client";

// import { motion } from "motion/react";
// import { useEffect, useState } from "react";

// // const size = 700; // px

// export default function BolaAnimada({ size = 700 }) {
//   const [position, setPosition] = useState({ x: 0, y: 0 });

//   useEffect(() => {
//     const mover = () => {
//       const maxX = Math.max(window.innerWidth - size, 0);
//       const maxY = Math.max(window.innerHeight - size, 0);
//       setPosition({
//         x: Math.random() * maxX,
//         y: Math.random() * maxY,
//       });
//     };

//     mover(); // posición inicial
//     const interval = setInterval(mover, 4000);
//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <motion.div
//       className="absolute top-0 left-0 rounded-full pointer-events-none"
//       style={{
//         width: size,
//         height: size,
//         background:
//           "radial-gradient(circle, rgba(109, 40, 217, 0.25) 0%, rgba(12, 10, 29, 0) 70%)",
//       }}
//       animate={{ x: position.x, y: position.y }}
//       transition={{ duration: 3, ease: "easeInOut" }}
//     />
//   );
// }

"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export default function BolaAnimada({ size = 700 }) {
  const containerRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const mover = () => {
      const parent = containerRef.current?.parentElement;
      if (!parent) return;

      const { width, height } = parent.getBoundingClientRect();
      const maxX = Math.max(width - size, 0);
      const maxY = Math.max(height - size, 0);

      setPosition({
        x: Math.random() * maxX,
        y: Math.random() * maxY,
      });
    };

    mover();
    const interval = setInterval(mover, 4000);
    return () => clearInterval(interval);
  }, [size]);

  return (
    <motion.div
      ref={containerRef}
      className="absolute top-0 left-0 rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle, rgba(109, 40, 217, 0.25) 0%, rgba(12, 10, 29, 0) 70%)",
      }}
      animate={{ x: position.x, y: position.y }}
      transition={{ duration: 3, ease: "easeInOut" }}
    />
  );
}
