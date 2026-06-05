"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import FormPanel from "@/components/FormPanel";
import ChatPanel from "@/components/ChatPanel";
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
  lignes: [{ id: genId(), designation: "", unitaire: "", qte: "", montant: "" }],
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
      designation: l.designation || "",
      unitaire: l.unitaire || "",
      qte: l.qte || "",
      montant: l.unitaire && l.qte ? l.unitaire * l.qte : "",
    }));
  }
  return next;
}

type Tab = "chat" | "form";

export default function Home() {
  const [devis, setDevis] = useState<DevisData>(initialDevis);
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  const handleUpdate = (update: DevisUpdate) => {
    setDevis((current) => applyUpdate(current, update));
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-app-bg">
      <TopBar onPrint={() => window.print()} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="no-print w-[380px] flex-shrink-0 bg-app-panel border-r border-app-border flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-app-border flex-shrink-0">
            {(["chat", "form"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-[11px] font-bold tracking-[1.5px] uppercase transition-colors border-none cursor-pointer ${
                  activeTab === tab
                    ? "text-gold border-b-2 border-gold bg-app-bg"
                    : "text-app-muted hover:text-app-text bg-transparent"
                }`}
              >
                {tab === "chat" ? "✦ Chat IA" : "⊞ Formulaire"}
              </button>
            ))}
          </div>

          {activeTab === "chat" ? (
            <ChatPanel devis={devis} onUpdate={handleUpdate} />
          ) : (
            <FormPanel devis={devis} onChange={setDevis} />
          )}
        </div>

        {/* Preview */}
        <div
          className="flex-1 overflow-y-auto flex justify-center p-8"
          style={{ background: "#f0ede8" }}
        >
          <div className="w-full max-w-[740px]">
            <DevisDoc devis={devis} />
          </div>
        </div>
      </div>
    </div>
  );
}
