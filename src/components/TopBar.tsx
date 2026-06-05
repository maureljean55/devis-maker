"use client";

interface TopBarProps {
  onPrint: () => void;
}

export default function TopBar({ onPrint }: TopBarProps) {
  return (
    <header className="no-print bg-app-noir border-b border-gold px-8 py-3.5 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Tutto Legno" className="w-[38px] h-[34px] object-contain" />
        <div>
          <div className="text-gold text-[13px] font-bold tracking-[2px] uppercase">
            Tutto Legno
          </div>
          <div className="text-app-muted text-[10px] tracking-[1px]">
            Générateur de Devis
          </div>
        </div>
      </div>
      <button
        onClick={onPrint}
        className="bg-gold text-white px-6 py-2.5 text-[12px] font-bold tracking-[1.5px] uppercase cursor-pointer hover:opacity-85 transition-opacity border-none"
      >
        ⬇ Télécharger PDF
      </button>
    </header>
  );
}
