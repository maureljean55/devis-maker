"use client";

import { useRef, useEffect, useState } from "react";
import DevisDoc from "./DevisDoc";
import { DevisData } from "@/lib/types";

const DOC_WIDTH = 740;

export default function PreviewWrapper({ devis }: { devis: DevisData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (!mobile && containerRef.current) {
        const available = containerRef.current.offsetWidth - 64;
        setZoom(Math.min(1, available / DOC_WIDTH));
      } else {
        setZoom(1);
      }
    };

    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto overflow-x-auto h-full"
      style={{ background: "#f0ede8", padding: isMobile ? "12px" : "32px" }}
    >
      <div
        style={{
          zoom,
          // Sur mobile : largeur fixe (doc scrollable horizontalement)
          // Sur desktop : zoom pour s'adapter au conteneur
          width: `${DOC_WIDTH}px`,
          margin: "0 auto",
        }}
      >
        <DevisDoc devis={devis} />
      </div>
    </div>
  );
}
