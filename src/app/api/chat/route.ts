import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import type { ChatMessage, DevisData } from "@/lib/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const today = new Date().toISOString().split("T")[0];

const SYSTEM_PROMPT = `Tu es un assistant expert pour Tutto Legno, menuiserie industrielle basée à Abidjan, Côte d'Ivoire. Tu aides à créer des devis en extrayant les informations depuis du langage naturel.

Réponds TOUJOURS avec un JSON valide ayant exactement cette structure :
{
  "message": "réponse naturelle et professionnelle en français",
  "update": {
    "num_devis": "string ou null",
    "date_devis": "YYYY-MM-DD ou null",
    "client_nom": "string ou null",
    "client_contact": "string ou null",
    "client_objet": "string ou null",
    "titre_travaux": "string ou null",
    "lignes": [...] ou null,
    "main_oeuvre": nombre ou null,
    "montant_lettres": "string en toutes lettres ou null",
    "avance_pct": nombre ou null
  }
}

STRUCTURE DES LIGNES — très important :
Le tableau du devis supporte deux types de lignes :
1. SECTION (type="section") : titre d'une catégorie de travaux, sans prix. Ex : "Fourniture et pose de plafond PVC". Elle reçoit un numéro A1, A2, A3... dans le document.
2. ARTICLE (type="item") : un article/matériau avec unitaire et quantité. Ex : "6 paquets de lambris PVC" à 48000f l'unité.

Exemple de structure lignes pour "Fourniture et pose de plafond PVC" avec ses articles :
[
  {"type": "section", "designation": "Fourniture et pose de plafond PVC"},
  {"type": "item", "designation": "Paquets de lambris PVC", "unitaire": 48000, "qte": 6},
  {"type": "item", "designation": "Languettes", "unitaire": 2500, "qte": 7},
  {"type": "item", "designation": "Paquet de vis 4/25", "unitaire": 5000, "qte": 1},
  {"type": "item", "designation": "Chevrons 6/4", "unitaire": 2500, "qte": 45},
  {"type": "item", "designation": "Paquets de pointe n°8", "unitaire": 1000, "qte": 12},
  {"type": "item", "designation": "Transport matériel", "unitaire": 20000, "qte": 1}
]

Règles :
- Mets null pour les champs non mentionnés
- Si pas de description de devis, "update" vaut null
- Date du jour : ${today}
- titre_travaux en majuscules (ex : "FOURNITURE ET POSE DE PLAFOND PVC")
- Identifie toujours les sections principales et regroupe les articles dedans
- Si total calculable (somme des montants items + main d'œuvre), génère montant_lettres en toutes lettres FCFA
- Les montants sont en Francs CFA (FCFA)
- Dans "message" : confirme ce que tu as extrait, sois concis et professionnel`;

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      currentDevis,
    }: { messages: ChatMessage[]; currentDevis: DevisData } = await req.json();

    const contextNote = `Contexte devis actuel : client="${currentDevis.client_nom || "non défini"}", ${currentDevis.lignes.length} ligne(s).`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: contextNote },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1024,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      message: parsed.message ?? "Devis mis à jour.",
      update: parsed.update ?? null,
    });
  } catch (err) {
    console.error("[chat/route]", err);
    return NextResponse.json(
      { message: "Erreur serveur. Vérifiez la clé API Groq.", update: null },
      { status: 500 }
    );
  }
}
