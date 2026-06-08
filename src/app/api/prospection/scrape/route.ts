import { NextRequest, NextResponse } from "next/server";
import { insertProspect } from "@/lib/prospection-db";

// Prospects de démonstration — chargés directement en TS, sans Python
const DEMO_PROSPECTS = [
  {
    nom_entreprise: "Groupe SICOGI Immobilier",
    telephone:      "0707553545",
    site_web:       "https://sicogi.ci",
    adresse:        "Abidjan, Plateau",
    secteur:        "Promoteur immobilier",
  },
  {
    nom_entreprise: "Cabinet Architecture Tropic",
    telephone:      "0102030405",
    site_web:       "https://architectropic.ci",
    adresse:        "Cocody, Abidjan",
    secteur:        "Architecture",
  },
  {
    nom_entreprise: "Déco & Prestige Abidjan",
    telephone:      "0504050607",
    site_web:       "",
    adresse:        "Marcory, Abidjan",
    secteur:        "Décoration intérieure",
  },
  {
    nom_entreprise: "Immo Excellence CI",
    telephone:      "",
    site_web:       "https://immoexcellence.ci",
    adresse:        "Riviera 3, Abidjan",
    secteur:        "Agence immobilière",
  },
  {
    nom_entreprise: "BATI CONSTRUCT CI",
    telephone:      "0711223344",
    site_web:       "",
    adresse:        "Yopougon, Abidjan",
    secteur:        "Construction",
  },
  {
    nom_entreprise: "BTP SOLUTIONS IVOIRE",
    telephone:      "0056789012",
    site_web:       "https://btpsolutions.ci",
    adresse:        "Adjamé, Abidjan",
    secteur:        "BTP",
  },
  {
    nom_entreprise: "Résidences Prestige Cocody",
    telephone:      "0709182736",
    site_web:       "",
    adresse:        "Cocody Riviera, Abidjan",
    secteur:        "Promoteur immobilier",
  },
  {
    nom_entreprise: "Atelier d'Architecture KOFFI & Associés",
    telephone:      "0501234567",
    site_web:       "",
    adresse:        "Plateau, Abidjan",
    secteur:        "Architecture",
  },
  {
    nom_entreprise: "Maison & Harmonie Déco",
    telephone:      "0708192837",
    site_web:       "",
    adresse:        "Angré, Abidjan",
    secteur:        "Décoration intérieure",
  },
  {
    nom_entreprise: "SITACI Immobilier",
    telephone:      "0102938475",
    site_web:       "https://sitaci.ci",
    adresse:        "Marcory, Abidjan",
    secteur:        "Agence immobilière",
  },
];

export async function POST(req: NextRequest) {
  const { mode } = await req.json().catch(() => ({ mode: "demo" }));

  // Mode "full" = scraping Google avec Selenium → local uniquement
  if (mode === "full") {
    return NextResponse.json(
      {
        error:
          "Le scraping Google nécessite un environnement local avec Python et Chrome. " +
          "Utilise le mode Démo en ligne, ou lance `python3 tutto_legno_agent/main.py` en local.",
      },
      { status: 422 }
    );
  }

  // Mode "demo" → insertion directe en SQLite depuis TypeScript
  const log: string[] = [];
  let inseres = 0;

  for (const p of DEMO_PROSPECTS) {
    const id = insertProspect(p);
    if (id === -1) {
      log.push(`[SKIP] Doublon ignoré : ${p.nom_entreprise}`);
    } else {
      log.push(`[OK]   Prospect ajouté → id=${id} | ${p.nom_entreprise}`);
      inseres++;
    }
  }

  log.push(`\n→ ${inseres} nouveaux prospects insérés.`);

  return NextResponse.json({ ok: true, log: log.join("\n") });
}
