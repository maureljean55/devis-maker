"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import TopBar from "@/components/TopBar";
import FormPanel from "@/components/FormPanel";
import ChatPanel from "@/components/ChatPanel";
import PreviewWrapper from "@/components/PreviewWrapper";
import DevisDoc from "@/components/DevisDoc";
import { DevisData, DevisUpdate } from "@/lib/types";

function genId() {
  return Math.random().toString(36).slice(2);
}

const today = new Date().toISOString().split("T")[0];

const initialDevis: DevisData = {
  num_devis: "",
  date_devis: today,
  client_nom: "",
  client_contact: "",
  client_objet: "",
  titre_travaux: "",
  lignes: [{ id: genId(), type: "item" as const, designation: "", unitaire: "", qte: "", montant: "" }],
  main_oeuvre: "",
  montant_lettres: "",
  avance_pct: 80,
};

function applyUpdate(current: DevisData, update: DevisUpdate): DevisData {
  const next = { ...current };
  if (update.num_devis != null) next.num_devis = update.num_devis;
  if (update.date_devis != null) next.date_devis = update.date_devis;
  if (update.client_nom != null) next.client_nom = update.client_nom;
  if (update.client_contact != null) next.client_contact = update.client_contact;
  if (update.client_objet != null) next.client_objet = update.client_objet;
  if (update.titre_travaux != null) next.titre_travaux = update.titre_travaux;
  if (update.main_oeuvre != null) next.main_oeuvre = update.main_oeuvre;
  if (update.montant_lettres != null) next.montant_lettres = update.montant_lettres;
  if (update.avance_pct != null) next.avance_pct = update.avance_pct;
  if (update.lignes != null && update.lignes.length > 0) {
    next.lignes = update.lignes.map((l) => ({
      id: genId(),
      type: l.type ?? "item",
      designation: l.designation || "",
      unitaire: l.type === "section" ? "" : (l.unitaire || ""),
      qte: l.type === "section" ? "" : (l.qte || ""),
      montant: l.type === "section" ? "" : (l.unitaire && l.qte ? l.unitaire * l.qte : ""),
    }));
  }
  return next;
}

type SideTab = "chat" | "form";
type MobileTab = "chat" | "form" | "preview";

export default function Home() {
  const [devis, setDevis] = useState<DevisData>(initialDevis);
  const [sideTab, setSideTab] = useState<SideTab>("chat");
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleUpdate = (update: DevisUpdate) => {
    setDevis((current) => applyUpdate(current, update));
  };

  const mobileTabs: { key: MobileTab; label: string }[] = [
    { key: "chat", label: "✦ Chat IA" },
    { key: "form", label: "⊞ Formulaire" },
    { key: "preview", label: "◻ Aperçu" },
  ];

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden bg-app-bg">
        <TopBar onPrint={() => window.print()} />

        {/* ── MOBILE (< md) ───────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden md:hidden">
          {/* Tab bar */}
          <div className="flex border-b border-app-border bg-app-panel flex-shrink-0">
            {mobileTabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMobileTab(key)}
                className={`flex-1 py-3 text-[10px] font-bold tracking-[1px] uppercase transition-colors border-none cursor-pointer ${
                  mobileTab === key
                    ? "text-gold border-b-2 border-gold bg-app-bg"
                    : "text-app-muted bg-transparent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            {mobileTab === "chat" && <ChatPanel devis={devis} onUpdate={handleUpdate} />}
            {mobileTab === "form" && <FormPanel devis={devis} onChange={setDevis} />}
            {mobileTab === "preview" && <PreviewWrapper devis={devis} />}
          </div>
        </div>

        {/* ── DESKTOP (≥ md) ──────────────────── */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          {/* Panneau gauche */}
          <div className="w-[300px] lg:w-[380px] flex-shrink-0 bg-app-panel border-r border-app-border flex flex-col overflow-hidden">
            <div className="flex border-b border-app-border flex-shrink-0">
              {(["chat", "form"] as SideTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSideTab(tab)}
                  className={`flex-1 py-3 text-[11px] font-bold tracking-[1.5px] uppercase transition-colors border-none cursor-pointer ${
                    sideTab === tab
                      ? "text-gold border-b-2 border-gold bg-app-bg"
                      : "text-app-muted hover:text-app-text bg-transparent"
                  }`}
                >
                  {tab === "chat" ? "✦ Chat IA" : "⊞ Formulaire"}
                </button>
              ))}
            </div>
            {sideTab === "chat" ? (
              <ChatPanel devis={devis} onUpdate={handleUpdate} />
            ) : (
              <FormPanel devis={devis} onChange={setDevis} />
            )}
          </div>

          {/* Aperçu */}
          <div className="flex-1 overflow-hidden">
            <PreviewWrapper devis={devis} />
          </div>
        </div>
      </div>

      {/* Portail d'impression — rendu directement dans <body>, hors de tout layout */}
      {mounted && createPortal(
        <div id="print-wrapper">
          <DevisDoc devis={devis} docId="doc-print" />
        </div>,
        document.body
      )}
    </>
  );
}
