"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

/* ── Types ───────────────────────────────────────────────────────────────── */
interface Prospect {
  id: number;
  nom_entreprise: string;
  telephone: string | null;
  email: string | null;
  site_web: string | null;
  adresse: string | null;
  secteur: string | null;
  message_genere: string | null;
  lien_whatsapp: string | null;
  statut: "nouveau" | "contacte" | "repondu";
  date_ajout: string;
  date_contact: string | null;
}

interface EmailModal {
  prospect: Prospect;
  to: string;
  subject: string;
  body: string;
}

const SECTEURS = [
  "Tous les secteurs",
  "Promoteur immobilier",
  "Architecture",
  "Décoration intérieure",
  "Agence immobilière",
  "Construction",
  "BTP",
];

function buildEmailSubject(p: Prospect) {
  return `Tutto Legno – Menuiserie haut de gamme pour ${p.nom_entreprise}`;
}

function buildEmailBody(message: string) {
  return `Bonjour,\n\n${message}\n\nCordialement,\nTutto Legno\nTél : 07 07 55 35 45\nwww.tutto-legno.ci\nCocody Abatta, Abidjan`;
}

/* ── Composant principal ─────────────────────────────────────────────────── */
export default function ProspectionPage() {
  const [prospects, setProspects]     = useState<Prospect[]>([]);
  const [loading, setLoading]         = useState(true);
  const [scraping, setScraping]       = useState(false);
  const [scrapeLog, setScrapeLog]     = useState("");
  const [generating, setGenerating]   = useState<number | null>(null);
  const [genAll, setGenAll]           = useState(false);
  const [filterSecteur, setFilterSecteur] = useState("Tous les secteurs");
  const [filterStatut, setFilterStatut]   = useState("Tous");
  const [search, setSearch]           = useState("");
  const [expanded, setExpanded]       = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLog, setShowLog]         = useState(false);
  const [emailModal, setEmailModal]   = useState<EmailModal | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  // Formulaire ajout manuel
  const [newProspect, setNewProspect] = useState({
    nom_entreprise: "",
    telephone: "",
    email: "",
    site_web: "",
    adresse: "",
    secteur: "Promoteur immobilier",
  });

  /* ── Chargement prospects ───────────────────────────────────────────────── */
  const fetchProspects = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/prospection/prospects");
    const data = await res.json();
    setProspects(data.prospects || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  /* ── Filtre ─────────────────────────────────────────────────────────────── */
  const filtered = prospects.filter((p) => {
    const s  = filterSecteur === "Tous les secteurs" || p.secteur === filterSecteur;
    const st = filterStatut === "Tous" || p.statut === filterStatut;
    const q  = search === "" || p.nom_entreprise.toLowerCase().includes(search.toLowerCase());
    return s && st && q;
  });

  /* ── Scraping ───────────────────────────────────────────────────────────── */
  const lancerScraping = async (mode: "demo" | "full") => {
    setScraping(true);
    setScrapeLog("");
    setShowLog(true);
    const res  = await fetch("/api/prospection/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    const data = await res.json();
    setScrapeLog(data.log || data.error || "Terminé.");
    setScraping(false);
    if (data.ok) fetchProspects();
  };

  /* ── Génération message ─────────────────────────────────────────────────── */
  const genererMessage = async (p: Prospect) => {
    setGenerating(p.id);
    const res  = await fetch("/api/prospection/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prospect_id:    p.id,
        nom_entreprise: p.nom_entreprise,
        secteur:        p.secteur,
        telephone:      p.telephone,
      }),
    });
    if (res.ok) {
      const { message, lien } = await res.json();
      setProspects((prev) =>
        prev.map((x) => x.id === p.id ? { ...x, message_genere: message, lien_whatsapp: lien } : x)
      );
    }
    setGenerating(null);
  };

  const genererTousMessages = async () => {
    setGenAll(true);
    const sans = prospects.filter((p) => !p.message_genere);
    for (const p of sans) {
      await genererMessage(p);
    }
    setGenAll(false);
  };

  /* ── Marquer contacté ───────────────────────────────────────────────────── */
  const marquerContacte = async (id: number) => {
    const now = new Date().toISOString();
    await fetch(`/api/prospection/prospects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "contacte", date_contact: now }),
    });
    setProspects((prev) =>
      prev.map((p) => p.id === id ? { ...p, statut: "contacte", date_contact: now } : p)
    );
  };

  /* ── Supprimer ──────────────────────────────────────────────────────────── */
  const supprimerProspect = async (id: number) => {
    if (!confirm("Supprimer ce prospect ?")) return;
    await fetch(`/api/prospection/prospects/${id}`, { method: "DELETE" });
    setProspects((prev) => prev.filter((p) => p.id !== id));
  };

  /* ── Ajout manuel ───────────────────────────────────────────────────────── */
  const ajouterProspect = async () => {
    if (!newProspect.nom_entreprise.trim()) return;
    const res = await fetch("/api/prospection/prospects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProspect),
    });
    if (res.ok) {
      setNewProspect({ nom_entreprise: "", telephone: "", email: "", site_web: "", adresse: "", secteur: "Promoteur immobilier" });
      setShowAddForm(false);
      fetchProspects();
    } else {
      const d = await res.json();
      alert(d.error || "Erreur");
    }
  };

  /* ── Ouvrir modale email ────────────────────────────────────────────────── */
  const ouvrirEmail = (p: Prospect) => {
    setEmailFeedback(null);
    setEmailModal({
      prospect: p,
      to:      p.email || "",
      subject: buildEmailSubject(p),
      body:    buildEmailBody(p.message_genere || ""),
    });
  };

  /* ── Envoyer email ──────────────────────────────────────────────────────── */
  const envoyerEmail = async () => {
    if (!emailModal) return;
    setSendingEmail(true);
    setEmailFeedback(null);
    const res = await fetch("/api/prospection/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prospect_id: emailModal.prospect.id,
        to:      emailModal.to,
        subject: emailModal.subject,
        body:    emailModal.body,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setEmailFeedback({ ok: true, msg: "Email envoyé avec succès !" });
      setProspects((prev) =>
        prev.map((p) =>
          p.id === emailModal.prospect.id
            ? { ...p, email: emailModal.to, statut: "contacte", date_contact: new Date().toISOString() }
            : p
        )
      );
      setTimeout(() => setEmailModal(null), 1800);
    } else {
      setEmailFeedback({ ok: false, msg: data.error || "Erreur lors de l'envoi" });
    }
    setSendingEmail(false);
  };

  /* ── Stats ──────────────────────────────────────────────────────────────── */
  const stats = {
    total:    prospects.length,
    nouveaux: prospects.filter((p) => p.statut === "nouveau").length,
    contactes:prospects.filter((p) => p.statut === "contacte").length,
    avecTel:  prospects.filter((p) => p.telephone).length,
    avecEmail:prospects.filter((p) => p.email).length,
    avecMsg:  prospects.filter((p) => p.message_genere).length,
  };

  /* ── Rendu ──────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e8e8e8] flex flex-col">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="bg-[#1a1200] border-b-2 border-[#B8892A] px-6 py-4 flex items-center justify-between gap-4 flex-wrap sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-[#B8892A] hover:text-[#d4a843] text-[11px] font-bold tracking-[1.5px] uppercase transition-colors flex items-center gap-1.5"
          >
            ← Devis
          </Link>
          <div className="w-px h-5 bg-[#2e2e2e]" />
          <div>
            <div className="text-[#B8892A] text-[13px] font-bold tracking-[2px] uppercase">
              Tutto Legno — Prospection
            </div>
            <div className="text-[#888] text-[10px] tracking-[1px]">
              Agent de prospection automatisé
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => lancerScraping("demo")}
            disabled={scraping}
            className="px-4 py-2 text-[11px] font-bold tracking-[1px] uppercase border border-[#B8892A] text-[#B8892A] hover:bg-[#B8892A] hover:text-black transition-all disabled:opacity-40 cursor-pointer"
          >
            {scraping ? "⏳ En cours..." : "▷ Démo (10 prospects)"}
          </button>
          <button
            onClick={() => lancerScraping("full")}
            disabled={scraping}
            className="px-4 py-2 text-[11px] font-bold tracking-[1px] uppercase bg-[#B8892A] text-black hover:opacity-85 transition-opacity disabled:opacity-40 cursor-pointer"
          >
            {scraping ? "⏳ Scraping..." : "⬢ Scraping Google"}
          </button>
          <div className="bg-[#B8892A] text-black px-4 py-2 font-bold text-[12px] rounded-full">
            {filtered.length} prospect{filtered.length > 1 ? "s" : ""}
          </div>
        </div>
      </header>

      {/* ── LOG SCRAPING ────────────────────────────────────────────────────── */}
      {showLog && scrapeLog && (
        <div className="bg-[#111] border-b border-[#2e2e2e] px-6 py-3 flex items-start gap-3">
          <button
            onClick={() => setShowLog(false)}
            className="text-[#888] hover:text-white text-[11px] mt-0.5 flex-shrink-0 cursor-pointer"
          >
            ✕
          </button>
          <pre className={`text-[10px] font-mono whitespace-pre-wrap max-h-32 overflow-y-auto flex-1 ${
            scrapeLog.includes("nécessite un environnement local") || scrapeLog.includes("command not found")
              ? "text-amber-400"
              : "text-[#4ade80]"
          }`}>
            {scrapeLog}
          </pre>
        </div>
      )}

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-6 px-6 py-3 border-b border-[#2e2e2e] flex-wrap text-[12px]">
        {[
          { label: "Total",       val: stats.total },
          { label: "Nouveaux",    val: stats.nouveaux,  green: true },
          { label: "Contactés",   val: stats.contactes },
          { label: "Avec numéro", val: stats.avecTel },
          { label: "Avec email",  val: stats.avecEmail },
          { label: "Avec message",val: stats.avecMsg },
        ].map(({ label, val, green }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="text-[#888]">{label} :</span>
            <span className={`font-bold ${green ? "text-[#4ade80]" : "text-[#B8892A]"}`}>{val}</span>
          </div>
        ))}
      </div>

      {/* ── BARRE D'OUTILS ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[#2e2e2e] flex-wrap">
        <select
          value={filterSecteur}
          onChange={(e) => setFilterSecteur(e.target.value)}
          className="bg-[#1a1a1a] border border-[#2e2e2e] text-[#e8e8e8] text-[12px] px-3 py-2 rounded outline-none focus:border-[#B8892A] cursor-pointer"
        >
          {SECTEURS.map((s) => <option key={s}>{s}</option>)}
        </select>

        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="bg-[#1a1a1a] border border-[#2e2e2e] text-[#e8e8e8] text-[12px] px-3 py-2 rounded outline-none focus:border-[#B8892A] cursor-pointer"
        >
          {["Tous", "nouveau", "contacte"].map((s) => (
            <option key={s} value={s}>{s === "Tous" ? "Tous les statuts" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="bg-[#1a1a1a] border border-[#2e2e2e] text-[#e8e8e8] text-[12px] px-3 py-2 rounded outline-none focus:border-[#B8892A] w-48"
        />

        <div className="flex-1" />

        {stats.avecMsg < stats.total && (
          <button
            onClick={genererTousMessages}
            disabled={genAll}
            className="px-4 py-2 text-[11px] font-bold tracking-[1px] uppercase border border-[#888] text-[#888] hover:border-[#B8892A] hover:text-[#B8892A] transition-colors disabled:opacity-40 cursor-pointer"
          >
            {genAll ? "⏳ Génération..." : `✦ Générer ${stats.total - stats.avecMsg} messages`}
          </button>
        )}

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 text-[11px] font-bold tracking-[1px] uppercase bg-[#232323] border border-[#2e2e2e] text-[#e8e8e8] hover:border-[#B8892A] transition-colors cursor-pointer"
        >
          + Ajouter
        </button>
      </div>

      {/* ── FORMULAIRE AJOUT MANUEL ──────────────────────────────────────────── */}
      {showAddForm && (
        <div className="px-6 py-4 bg-[#151515] border-b border-[#2e2e2e]">
          <div className="text-[11px] font-bold tracking-[1.5px] uppercase text-[#B8892A] mb-3">
            Ajouter un prospect manuellement
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { key: "nom_entreprise", placeholder: "Nom entreprise *" },
              { key: "telephone",      placeholder: "Téléphone" },
              { key: "email",          placeholder: "Email" },
              { key: "site_web",       placeholder: "Site web" },
              { key: "adresse",        placeholder: "Adresse / Quartier" },
            ].map(({ key, placeholder }) => (
              <input
                key={key}
                type={key === "email" ? "email" : "text"}
                placeholder={placeholder}
                value={newProspect[key as keyof typeof newProspect]}
                onChange={(e) => setNewProspect((p) => ({ ...p, [key]: e.target.value }))}
                className="bg-[#1a1a1a] border border-[#2e2e2e] text-[#e8e8e8] text-[12px] px-3 py-2 rounded outline-none focus:border-[#B8892A]"
              />
            ))}
            <select
              value={newProspect.secteur}
              onChange={(e) => setNewProspect((p) => ({ ...p, secteur: e.target.value }))}
              className="bg-[#1a1a1a] border border-[#2e2e2e] text-[#e8e8e8] text-[12px] px-3 py-2 rounded outline-none focus:border-[#B8892A] cursor-pointer"
            >
              {SECTEURS.slice(1).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3 mt-3">
            <button
              onClick={ajouterProspect}
              className="px-5 py-2 text-[11px] font-bold tracking-[1px] uppercase bg-[#B8892A] text-black hover:opacity-85 transition-opacity cursor-pointer"
            >
              Ajouter
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2 text-[11px] font-bold tracking-[1px] uppercase border border-[#2e2e2e] text-[#888] hover:text-white transition-colors cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── TABLEAU ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="text-center text-[#888] py-20 text-[13px]">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-[#888] text-[13px] mb-2">Aucun prospect trouvé.</div>
            <div className="text-[#555] text-[11px]">Lance le scraping ou ajoute un prospect manuellement.</div>
          </div>
        ) : (
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b-2 border-[#B8892A]">
                {["Entreprise", "Secteur", "Contact", "Statut", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[#B8892A] font-bold tracking-[1.2px] uppercase text-[10px] py-3 px-3 bg-[#1a1a1a]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <>
                  {/* ── Ligne principale ─────────────────────────────────── */}
                  <tr
                    key={p.id}
                    className={`border-b border-[#2e2e2e] hover:bg-[#1e1800] transition-colors ${
                      p.statut === "contacte" ? "opacity-50" : ""
                    }`}
                  >
                    {/* Entreprise */}
                    <td className="py-3 px-3 font-semibold text-white max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                          className="text-[#888] hover:text-[#B8892A] text-[10px] cursor-pointer"
                          title="Voir le message"
                        >
                          {expanded === p.id ? "▼" : "▶"}
                        </button>
                        <span className="truncate">{p.nom_entreprise}</span>
                      </div>
                      {p.site_web && (
                        <a
                          href={p.site_web}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#555] hover:text-[#B8892A] text-[10px] truncate block mt-0.5 ml-5"
                        >
                          {p.site_web.replace(/^https?:\/\//, "").slice(0, 30)}
                        </a>
                      )}
                    </td>

                    {/* Secteur */}
                    <td className="py-3 px-3">
                      <span className="bg-[#1e1800] border border-[#B8892A] text-[#B8892A] px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap">
                        {p.secteur || "—"}
                      </span>
                    </td>

                    {/* Contact (tel + email) */}
                    <td className="py-3 px-3">
                      {p.telephone ? (
                        <div className="text-[#d4a843] font-mono text-[11px]">{p.telephone}</div>
                      ) : (
                        <div className="text-[#444] text-[11px]">Pas de numéro</div>
                      )}
                      {p.email && (
                        <div className="text-[#888] text-[10px] mt-0.5 truncate max-w-[140px]">{p.email}</div>
                      )}
                    </td>

                    {/* Statut */}
                    <td className="py-3 px-3">
                      {p.statut === "contacte" ? (
                        <span className="text-[#888] text-[10px]">✓ Contacté</span>
                      ) : (
                        <span className="text-[#4ade80] text-[10px] font-bold">Nouveau</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Générer message */}
                        {!p.message_genere ? (
                          <button
                            onClick={() => genererMessage(p)}
                            disabled={generating === p.id || genAll}
                            className="px-2.5 py-1 text-[10px] font-bold border border-[#888] text-[#888] hover:border-[#B8892A] hover:text-[#B8892A] transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
                          >
                            {generating === p.id ? "⏳" : "✦ Générer"}
                          </button>
                        ) : (
                          <button
                            onClick={() => genererMessage(p)}
                            disabled={generating === p.id}
                            className="px-2.5 py-1 text-[10px] border border-[#2e2e2e] text-[#555] hover:border-[#888] hover:text-[#888] transition-colors disabled:opacity-40 cursor-pointer"
                            title="Régénérer le message"
                          >
                            ↺
                          </button>
                        )}

                        {/* WhatsApp */}
                        {p.lien_whatsapp ? (
                          <a
                            href={p.lien_whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => p.statut !== "contacte" && marquerContacte(p.id)}
                            className="px-3 py-1 text-[10px] font-bold bg-[#25D366] text-black hover:opacity-85 transition-opacity whitespace-nowrap"
                          >
                            📲 WA
                          </a>
                        ) : null}

                        {/* Email */}
                        {p.message_genere && (
                          <button
                            onClick={() => ouvrirEmail(p)}
                            className="px-3 py-1 text-[10px] font-bold bg-[#1a3a5c] border border-[#2a5a8c] text-[#7ab8f5] hover:bg-[#2a5a8c] transition-colors whitespace-nowrap cursor-pointer"
                          >
                            ✉ Email
                          </button>
                        )}

                        {/* Supprimer */}
                        <button
                          onClick={() => supprimerProspect(p.id)}
                          className="px-2 py-1 text-[10px] text-[#444] hover:text-red-400 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ── Ligne expandée : message généré ──────────────────── */}
                  {expanded === p.id && (
                    <tr key={`${p.id}-msg`} className="border-b border-[#2e2e2e] bg-[#151515]">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#B8892A] mb-2">
                          Message généré
                        </div>
                        {p.message_genere ? (
                          <pre className="whitespace-pre-wrap text-[12px] text-[#ccc] leading-relaxed font-sans">
                            {p.message_genere}
                          </pre>
                        ) : (
                          <div className="text-[#555] text-[12px] italic">
                            Aucun message généré. Clique sur "✦ Générer".
                          </div>
                        )}
                        {p.adresse && (
                          <div className="mt-2 text-[10px] text-[#555]">📍 {p.adresse}</div>
                        )}
                        {p.date_contact && (
                          <div className="mt-1 text-[10px] text-[#555]">
                            Contacté le {new Date(p.date_contact).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MODALE EMAIL ────────────────────────────────────────────────────── */}
      {emailModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#151515] border border-[#2e2e2e] w-full max-w-xl flex flex-col max-h-[90vh]">
            {/* Header modale */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2e2e2e]">
              <div>
                <div className="text-[#B8892A] text-[11px] font-bold tracking-[2px] uppercase">Envoyer un email</div>
                <div className="text-[#888] text-[10px] mt-0.5">{emailModal.prospect.nom_entreprise}</div>
              </div>
              <button
                onClick={() => setEmailModal(null)}
                className="text-[#888] hover:text-white text-[18px] cursor-pointer leading-none"
              >
                ✕
              </button>
            </div>

            {/* Corps modale */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Destinataire */}
              <div>
                <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#888] block mb-1">
                  À (email du destinataire)
                </label>
                <input
                  type="email"
                  value={emailModal.to}
                  onChange={(e) => setEmailModal((m) => m ? { ...m, to: e.target.value } : m)}
                  placeholder="contact@entreprise.ci"
                  className="w-full bg-[#1a1a1a] border border-[#2e2e2e] text-[#e8e8e8] text-[12px] px-3 py-2 outline-none focus:border-[#B8892A]"
                />
              </div>

              {/* Objet */}
              <div>
                <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#888] block mb-1">
                  Objet
                </label>
                <input
                  type="text"
                  value={emailModal.subject}
                  onChange={(e) => setEmailModal((m) => m ? { ...m, subject: e.target.value } : m)}
                  className="w-full bg-[#1a1a1a] border border-[#2e2e2e] text-[#e8e8e8] text-[12px] px-3 py-2 outline-none focus:border-[#B8892A]"
                />
              </div>

              {/* Corps */}
              <div>
                <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#888] block mb-1">
                  Message
                </label>
                <textarea
                  value={emailModal.body}
                  onChange={(e) => setEmailModal((m) => m ? { ...m, body: e.target.value } : m)}
                  rows={10}
                  className="w-full bg-[#1a1a1a] border border-[#2e2e2e] text-[#e8e8e8] text-[12px] px-3 py-2 outline-none focus:border-[#B8892A] resize-none font-sans leading-relaxed"
                />
              </div>

              {/* Feedback */}
              {emailFeedback && (
                <div className={`text-[12px] px-3 py-2 border ${
                  emailFeedback.ok
                    ? "text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/5"
                    : "text-red-400 border-red-500/30 bg-red-500/5"
                }`}>
                  {emailFeedback.msg}
                </div>
              )}
            </div>

            {/* Footer modale */}
            <div className="flex gap-3 px-5 py-4 border-t border-[#2e2e2e]">
              <button
                onClick={envoyerEmail}
                disabled={sendingEmail || !emailModal.to}
                className="flex-1 px-5 py-2.5 text-[11px] font-bold tracking-[1px] uppercase bg-[#B8892A] text-black hover:opacity-85 transition-opacity disabled:opacity-40 cursor-pointer"
              >
                {sendingEmail ? "⏳ Envoi en cours..." : "✉ Envoyer l'email"}
              </button>
              <button
                onClick={() => setEmailModal(null)}
                className="px-5 py-2.5 text-[11px] font-bold tracking-[1px] uppercase border border-[#2e2e2e] text-[#888] hover:text-white transition-colors cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="text-center py-4 text-[#444] text-[10px] border-t border-[#2e2e2e]">
        TUTTO LEGNO · Cocody Abatta, Abidjan · 07 07 55 35 45 · www.tutto-legno.ci
      </footer>
    </div>
  );
}
