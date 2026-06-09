"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DevisImprime {
  id: string;
  client_nom: string;
  client_objet: string;
  titre_travaux: string;
  total: number;
  imprime_a: string;
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtMonth(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export default function DashboardPage() {
  const [devis, setDevis]     = useState<DevisImprime[]>([]);
  const [loading, setLoading] = useState(true);
  const router  = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetch("/api/devis-imprimes")
      .then((r) => r.json())
      .then((d) => { setDevis(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Stats
  const total     = devis.reduce((a, d) => a + (d.total || 0), 0);
  const moyenne   = devis.length ? total / devis.length : 0;
  const ceMois    = devis.filter((d) => {
    const now = new Date();
    const da  = new Date(d.imprime_a);
    return da.getMonth() === now.getMonth() && da.getFullYear() === now.getFullYear();
  });

  // Par mois (6 derniers)
  const parMois: Record<string, number> = {};
  devis.forEach((d) => {
    const key = fmtMonth(d.imprime_a);
    parMois[key] = (parMois[key] || 0) + d.total;
  });
  const moisKeys = Object.keys(parMois).slice(0, 6);
  const maxMois  = Math.max(...Object.values(parMois), 1);

  const card = "bg-app-panel border border-app-border p-4 sm:p-5";
  const label = "text-[10px] font-bold tracking-[2px] uppercase text-app-muted mb-1";
  const val   = "text-gold font-bold text-[20px] sm:text-[24px]";

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header */}
      <header className="bg-app-noir border-b border-gold px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="w-8 h-7 object-contain" />
          <span className="text-gold text-[12px] font-bold tracking-[2px] uppercase">Tutto Legno</span>
          <span className="hidden sm:inline text-app-muted text-[10px] ml-2">/ Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-3 py-2 text-[11px] font-bold tracking-[1px] uppercase border border-app-border text-app-muted hover:border-gold hover:text-gold transition-all no-underline"
          >
            ← Devis
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-2 text-[11px] font-bold tracking-[1px] uppercase border border-app-border text-app-muted hover:border-red-500 hover:text-red-400 transition-all bg-transparent cursor-pointer"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="px-4 sm:px-8 py-6 max-w-4xl mx-auto">
        <div className="text-[10px] font-bold tracking-[2px] uppercase text-gold mb-6 pb-3 border-b border-app-border">
          Tableau de bord — Devis imprimés
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex gap-1.5">
              {[0, 150, 300].map((d) => (
                <span key={d} className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className={card}>
                <div className={label}>Total devis</div>
                <div className={val}>{devis.length}</div>
              </div>
              <div className={card}>
                <div className={label}>CA Total</div>
                <div className="text-gold font-bold text-[16px] sm:text-[18px]">{fmt(total)}</div>
              </div>
              <div className={card}>
                <div className={label}>Moyenne / devis</div>
                <div className="text-gold font-bold text-[16px] sm:text-[18px]">{fmt(Math.round(moyenne))}</div>
              </div>
              <div className={card}>
                <div className={label}>Ce mois</div>
                <div className={val}>{ceMois.length}</div>
                <div className="text-app-muted text-[10px] mt-0.5">{fmt(ceMois.reduce((a, d) => a + d.total, 0))}</div>
              </div>
            </div>

            {/* Graphe par mois */}
            {moisKeys.length > 0 && (
              <div className={`${card} mb-6`}>
                <div className="text-[10px] font-bold tracking-[2px] uppercase text-gold mb-4">CA par mois</div>
                <div className="space-y-2">
                  {moisKeys.map((mois) => (
                    <div key={mois} className="flex items-center gap-3">
                      <div className="text-[10px] text-app-muted w-28 flex-shrink-0 capitalize">{mois}</div>
                      <div className="flex-1 bg-app-input h-6 relative">
                        <div
                          className="h-full bg-gold/70 transition-all"
                          style={{ width: `${(parMois[mois] / maxMois) * 100}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-app-text w-28 text-right flex-shrink-0">
                        {fmt(parMois[mois])}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liste des derniers devis */}
            <div className={card}>
              <div className="text-[10px] font-bold tracking-[2px] uppercase text-gold mb-4">
                Derniers devis imprimés
              </div>
              {devis.length === 0 ? (
                <div className="text-app-muted text-[12px] py-6 text-center">
                  Aucun devis imprimé pour l&apos;instant.<br />
                  <span className="text-[11px]">Les devis apparaissent ici quand vous téléchargez un PDF.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-app-border">
                        <th className="text-left text-app-muted text-[10px] tracking-[1px] uppercase pb-2 font-normal">Client</th>
                        <th className="text-left text-app-muted text-[10px] tracking-[1px] uppercase pb-2 font-normal hidden sm:table-cell">Objet</th>
                        <th className="text-right text-app-muted text-[10px] tracking-[1px] uppercase pb-2 font-normal">Total</th>
                        <th className="text-right text-app-muted text-[10px] tracking-[1px] uppercase pb-2 font-normal hidden sm:table-cell">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devis.map((d) => (
                        <tr key={d.id} className="border-b border-app-border/50 hover:bg-app-input/30 transition-colors">
                          <td className="py-2.5 text-app-text">{d.client_nom || "—"}</td>
                          <td className="py-2.5 text-app-muted hidden sm:table-cell">{d.client_objet || d.titre_travaux || "—"}</td>
                          <td className="py-2.5 text-gold text-right font-bold">{fmt(d.total)}</td>
                          <td className="py-2.5 text-app-muted text-right hidden sm:table-cell">{fmtDate(d.imprime_a)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
