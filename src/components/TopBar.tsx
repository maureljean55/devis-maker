"use client";

import Link from "next/link";

interface TopBarProps {
  onPrint: () => void;
}

export default function TopBar({ onPrint }: TopBarProps) {
  return (
    <header className="no-print bg-app-noir border-b border-gold px-4 md:px-8 py-3 md:py-3.5 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2.5 md:gap-3.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Tutto Legno"
          className="w-[30px] h-[27px] md:w-[38px] md:h-[34px] object-contain"
        />
        <div>
          <div className="text-gold text-[12px] md:text-[13px] font-bold tracking-[2px] uppercase">
            Tutto Legno
          </div>
          <div className="hidden sm:block text-app-muted text-[10px] tracking-[1px]">
            Générateur de Devis
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <Link
          href="/prospection"
          className="px-3 md:px-5 py-2 md:py-2.5 text-[11px] md:text-[12px] font-bold tracking-[1px] md:tracking-[1.5px] uppercase border border-gold text-gold hover:bg-gold hover:text-black transition-all no-underline"
        >
          <span className="hidden sm:inline">⬢ Prospection</span>
          <span className="sm:hidden">⬢</span>
        </Link>
        <button
          onClick={onPrint}
          className="hidden md:block bg-gold text-white px-3 md:px-6 py-2 md:py-2.5 text-[11px] md:text-[12px] font-bold tracking-[1px] md:tracking-[1.5px] uppercase cursor-pointer hover:opacity-85 transition-opacity border-none"
        >
          ⬇ Télécharger PDF
        </button>
      </div>
    </header>
  );
}
