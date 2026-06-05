"use client";

import { DevisData, LigneDevis } from "@/lib/types";

interface FormPanelProps {
  devis: DevisData;
  onChange: (devis: DevisData) => void;
}

function genId() {
  return Math.random().toString(36).slice(2);
}

export default function FormPanel({ devis, onChange }: FormPanelProps) {
  const update = (field: keyof DevisData, value: DevisData[keyof DevisData]) => {
    onChange({ ...devis, [field]: value });
  };

  const updateLigne = (i: number, field: keyof LigneDevis, value: string) => {
    const newLignes = [...devis.lignes];
    newLignes[i] = { ...newLignes[i], [field]: value };
    if (field === "unitaire" || field === "qte") {
      const u =
        field === "unitaire"
          ? parseFloat(value) || 0
          : parseFloat(String(newLignes[i].unitaire)) || 0;
      const q =
        field === "qte"
          ? parseFloat(value) || 0
          : parseFloat(String(newLignes[i].qte)) || 0;
      newLignes[i].montant = u * q || "";
    }
    onChange({ ...devis, lignes: newLignes });
  };

  const addSection = () => {
    onChange({
      ...devis,
      lignes: [
        ...devis.lignes,
        { id: genId(), type: "section", designation: "", unitaire: "", qte: "", montant: "" },
      ],
    });
  };

  const addItem = () => {
    onChange({
      ...devis,
      lignes: [
        ...devis.lignes,
        { id: genId(), type: "item", designation: "", unitaire: "", qte: "", montant: "" },
      ],
    });
  };

  const removeLigne = (i: number) => {
    if (devis.lignes.length === 1) return;
    onChange({ ...devis, lignes: devis.lignes.filter((_, idx) => idx !== i) });
  };

  const totalMat = devis.lignes.reduce(
    (acc, l) => acc + (parseFloat(String(l.montant)) || 0),
    0
  );
  const mo = parseFloat(String(devis.main_oeuvre)) || 0;
  const total = totalMat + mo;
  const fmtFull = (n: number) => n.toLocaleString("fr-FR") + " FCFA";

  const inp =
    "w-full bg-app-input border border-app-border text-app-text font-montserrat text-[12px] px-3 py-2 outline-none focus:border-gold transition-colors";
  const lbl = "block text-[11px] text-app-muted mb-1.5 tracking-[0.5px]";
  const sec =
    "text-[10px] font-bold tracking-[2px] text-gold uppercase mb-3.5 pb-2 border-b border-app-border";

  return (
    <div className="overflow-y-auto flex-1 px-6 py-7">
      {/* Référence */}
      <div className="mb-7">
        <div className={sec}>Référence du devis</div>
        <div className="mb-3">
          <label className={lbl}>Numéro de devis</label>
          <input type="text" className={inp} placeholder="ex: 536HG/SC"
            value={devis.num_devis} onChange={(e) => update("num_devis", e.target.value)} />
        </div>
        <div className="mb-3">
          <label className={lbl}>Date</label>
          <input type="date" className={inp}
            value={devis.date_devis} onChange={(e) => update("date_devis", e.target.value)} />
        </div>
      </div>

      {/* Client */}
      <div className="mb-7">
        <div className={sec}>Client</div>
        <div className="mb-3">
          <label className={lbl}>Raison sociale / Nom</label>
          <input type="text" className={inp} placeholder="ex: Mr N'GUESSAN"
            value={devis.client_nom} onChange={(e) => update("client_nom", e.target.value)} />
        </div>
        <div className="mb-3">
          <label className={lbl}>Contact</label>
          <input type="text" className={inp} placeholder="ex: 0505972493"
            value={devis.client_contact} onChange={(e) => update("client_contact", e.target.value)} />
        </div>
        <div className="mb-3">
          <label className={lbl}>Objet des travaux</label>
          <input type="text" className={inp} placeholder="ex: Aménagement villa Bingerville"
            value={devis.client_objet} onChange={(e) => update("client_objet", e.target.value)} />
        </div>
      </div>

      {/* Nature des travaux */}
      <div className="mb-7">
        <div className={sec}>Nature des travaux</div>
        <div className="mb-3">
          <label className={lbl}>Intitulé du tableau</label>
          <input type="text" className={inp} placeholder="ex: FABRICATION ET POSE DE MEUBLE..."
            value={devis.titre_travaux} onChange={(e) => update("titre_travaux", e.target.value)} />
        </div>
      </div>

      {/* Lignes */}
      <div className="mb-7">
        <div className={sec}>Lignes du devis</div>

        {(() => {
          let secCount = 0;
          return devis.lignes.map((l, i) => {
            if (l.type === "section") {
              secCount++;
              const label = `A${secCount}`;
              return (
                <div key={l.id} className="flex gap-1.5 mb-2 items-center">
                  <span className="text-[10px] font-bold text-gold w-6 flex-shrink-0 text-center">
                    {label}
                  </span>
                  <input
                    type="text"
                    placeholder="Titre de la section..."
                    className="flex-1 bg-app-bg border border-gold/40 text-gold font-montserrat text-[11px] font-bold italic px-2 py-1.5 outline-none focus:border-gold transition-colors"
                    value={l.designation}
                    onChange={(e) => updateLigne(i, "designation", e.target.value)}
                  />
                  <button
                    onClick={() => removeLigne(i)}
                    className="text-app-muted hover:text-red-500 text-lg leading-none transition-colors bg-transparent border-none cursor-pointer p-1 flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              );
            }

            // item
            return (
              <div
                key={l.id}
                className="grid grid-cols-[2fr_75px_55px_75px_24px] gap-1 mb-1 items-center pl-5"
              >
                <input type="text" placeholder="Désignation"
                  className="bg-app-input border border-app-border text-app-text font-montserrat text-[11px] px-2 py-1.5 outline-none focus:border-gold transition-colors w-full"
                  value={l.designation} onChange={(e) => updateLigne(i, "designation", e.target.value)} />
                <input type="number" placeholder="0"
                  className="bg-app-input border border-app-border text-app-text font-montserrat text-[11px] px-2 py-1.5 outline-none focus:border-gold transition-colors w-full"
                  value={l.unitaire} onChange={(e) => updateLigne(i, "unitaire", e.target.value)} />
                <input type="number" placeholder="1"
                  className="bg-app-input border border-app-border text-app-text font-montserrat text-[11px] px-2 py-1.5 outline-none focus:border-gold transition-colors w-full"
                  value={l.qte} onChange={(e) => updateLigne(i, "qte", e.target.value)} />
                <input type="number" placeholder="0"
                  className="bg-app-input border border-app-border text-app-text font-montserrat text-[11px] px-2 py-1.5 outline-none focus:border-gold transition-colors w-full"
                  value={l.montant} onChange={(e) => updateLigne(i, "montant", e.target.value)} />
                <button onClick={() => removeLigne(i)}
                  className="text-app-muted hover:text-red-500 text-lg leading-none transition-colors bg-transparent border-none cursor-pointer p-1">
                  ×
                </button>
              </div>
            );
          });
        })()}

        {/* Colonnes header pour items */}
        <div className="grid grid-cols-[2fr_75px_55px_75px_24px] gap-1 text-[9px] text-app-muted mt-1 mb-2 pl-5 tracking-[0.5px]">
          <span>Désignation</span><span>Unitaire</span><span>Qté</span><span>Montant</span><span />
        </div>

        {/* Boutons ajout */}
        <div className="flex gap-2 mt-2">
          <button onClick={addSection}
            className="flex-1 border border-dashed border-gold/50 text-gold font-montserrat text-[10px] font-bold py-2 cursor-pointer hover:border-gold transition-colors bg-transparent uppercase tracking-wider">
            + Section
          </button>
          <button onClick={addItem}
            className="flex-1 border border-dashed border-app-border text-app-muted font-montserrat text-[10px] py-2 cursor-pointer hover:border-gold hover:text-gold transition-colors bg-transparent">
            + Article
          </button>
        </div>

        {/* Totaux */}
        <div className="bg-app-input border border-app-border p-3 mt-3.5">
          <div className="flex justify-between text-[12px] py-1 text-app-muted">
            <span>Total matériels</span>
            <span>{fmtFull(totalMat)}</span>
          </div>
          <div className="grid grid-cols-[1fr_110px] gap-2 items-center mt-2.5">
            <label className="text-app-muted text-[11px]">Main d&apos;œuvre (FCFA)</label>
            <input type="number" placeholder="0"
              className="bg-app-bg border border-app-border text-app-text font-montserrat text-[11px] px-2 py-1.5 outline-none focus:border-gold transition-colors w-full"
              value={devis.main_oeuvre}
              onChange={(e) => update("main_oeuvre", e.target.value === "" ? "" : parseFloat(e.target.value))} />
          </div>
          <div className="flex justify-between text-gold font-bold text-[13px] border-t border-app-border mt-2 pt-2">
            <span>TOTAL</span>
            <span>{fmtFull(total)}</span>
          </div>
        </div>
      </div>

      {/* Montant en lettres */}
      <div className="mb-7">
        <div className={sec}>Montant en lettres</div>
        <div className="mb-3">
          <label className={lbl}>Arrêté à la somme de</label>
          <textarea className={`${inp} resize-y min-h-[60px]`}
            placeholder="ex: Six cent cinq mille Franc CFA"
            value={devis.montant_lettres}
            onChange={(e) => update("montant_lettres", e.target.value)} />
        </div>
      </div>

      {/* Conditions */}
      <div className="mb-7">
        <div className={sec}>Conditions</div>
        <div className="mb-3">
          <label className={lbl}>% avance de démarrage</label>
          <input type="number" className={inp}
            value={devis.avance_pct}
            onChange={(e) => update("avance_pct", parseFloat(e.target.value) || 80)} />
        </div>
      </div>
    </div>
  );
}
