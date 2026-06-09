"use client";

import { useRef, useEffect, useState } from "react";
import DevisDoc from "./DevisDoc";
import { DevisData } from "@/lib/types";

const DOC_WIDTH = 740;

export default function PreviewWrapper({ devis }: { devis: DevisData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const isMobile = window.innerWidth < 768;
      const padding = isMobile ? 16 : 64;
      const available = containerRef.current.offsetWidth - padding;
      setZoom(Math.min(1, available / DOC_WIDTH));
    };

    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto h-full"
      style={{ background: "#f0ede8", padding: "12px" }}
    >
      <div
        style={{
          zoom,
          width: `${DOC_WIDTH}px`,
          margin: "0 auto",
        }}
      >
        <DevisDoc devis={devis} />
      </div>
    </div>
  );
}
