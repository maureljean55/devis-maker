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
      const available = containerRef.current.offsetWidth - 64;
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
      style={{ background: "#f0ede8", padding: "32px" }}
    >
      <div style={{ zoom, maxWidth: `${DOC_WIDTH}px`, margin: "0 auto" }}>
        <DevisDoc devis={devis} />
      </div>
    </div>
  );
}
