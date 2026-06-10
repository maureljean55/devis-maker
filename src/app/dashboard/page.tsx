"use client";

import { useEffect, useState, useMemo } from "react";
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

function moisOptionValue(d: string) {
  const da = new Date(d);
  return `${da.getFullYear()}-${String(da.getMonth() + 1).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [devis, setDevis]       = useState<DevisImprime[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterMois, setFilterMois] = useState("");
  const router   = useRouter();
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

  // Liste des mois disponibles pour le filtre
  const moisDisponibles = useMemo(() => {
    const seen = new Set<string>();
    const result: { value: string; label: string }[] = [];
    devis.forEach((d) => {
      const val = moisOptionValue(d.imprime_a);
      if (!seen.has(val)) {
        seen.add(val);
        result.push({ value: val, label: fmtMonth(d.imprime_a) });
      }
    });
    return result.sort((a, b) => b.value.localeCompare(a.value));
  }, [devis]);

  // Devis filtrés
  const devisFiltres = useMemo(() => {
    const q = search.toLowerCase().trim();
    return devis.filter((d) => {
      const matchSearch = !q || [d.client_nom, d.client_objet, d.titre_travaux]
        .some((v) => (v || "").toLowerCase().includes(q));
      const matchMois = !filterMois || moisOptionValue(d.imprime_a) === filterMois;
      return matchSearch && matchMois;
    });
  }, [devis, search, filterMois]);

  // Stats sur tous les devis (pas les filtrés)
  const total   = devis.reduce((a, d) => a + (d.total || 0), 0);
  const moyenne = devis.length ? total / devis.length : 0;
  const ceMois  = devis.filter((d) => {
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

  const filtreActif = search || filterMois;

  const card  = "bg-app-panel border border-app-border p-4 sm:p-5";
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

            {/* Recherche + filtres */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted text-[12px]">⌕</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un client, un objet…"
                  className="w-full bg-app-panel border border-app-border text-app-text text-[12px] pl-8 pr-3 py-2 outline-none focus:border-gold placeholder:text-app-muted/50 transition-colors"
                />
              </div>
              <select
                value={filterMois}
                onChange={(e) => setFilterMois(e.target.value)}
                className="bg-app-panel border border-app-border text-app-text text-[11px] px-3 py-2 outline-none focus:border-gold cursor-pointer capitalize sm:w-48"
              >
                <option value="">Tous les mois</option>
                {moisDisponibles.map((m) => (
                  <option key={m.value} value={m.value} className="capitalize">{m.label}</option>
                ))}
              </select>
              {filtreActif && (
                <button
                  onClick={() => { setSearch(""); setFilterMois(""); }}
                  className="px-3 py-2 text-[11px] font-bold tracking-[1px] uppercase border border-app-border text-app-muted hover:border-red-500 hover:text-red-400 transition-all bg-transparent cursor-pointer whitespace-nowrap"
                >
                  ✕ Réinitialiser
                </button>
              )}
            </div>

            {/* Liste des devis */}
            <div className={card}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold tracking-[2px] uppercase text-gold">
                  {filtreActif
                    ? `${devisFiltres.length} résultat${devisFiltres.length > 1 ? "s" : ""}`
                    : "Derniers devis imprimés"}
                </div>
                {filtreActif && (
                  <div className="text-[10px] text-app-muted">
                    CA : <span className="text-gold font-bold">{fmt(devisFiltres.reduce((a, d) => a + d.total, 0))}</span>
                  </div>
                )}
              </div>

              {devis.length === 0 ? (
                <div className="text-app-muted text-[12px] py-6 text-center">
                  Aucun devis imprimé pour l&apos;instant.<br />
                  <span className="text-[11px]">Les devis apparaissent ici quand vous téléchargez un PDF.</span>
                </div>
              ) : devisFiltres.length === 0 ? (
                <div className="text-app-muted text-[12px] py-8 text-center">
                  Aucun devis ne correspond à votre recherche.
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
                      {devisFiltres.map((d) => (
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
