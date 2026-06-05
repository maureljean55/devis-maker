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
    "lignes": [{"designation": "string", "unitaire": nombre, "qte": nombre}] ou null,
    "main_oeuvre": nombre ou null,
    "montant_lettres": "string ou en toutes lettres ou null",
    "avance_pct": nombre ou null
  }
}

Règles :
- Mets null pour les champs non mentionnés
- Si l'utilisateur ne décrit pas un devis (question générale), "update" vaut null
- Date du jour : ${today}
- titre_travaux : nature des travaux en majuscules (ex : "FABRICATION ET POSE DE CUISINE ÉQUIPÉE")
- Si le total est calculable depuis les lignes + main d'œuvre, génère automatiquement montant_lettres en toutes lettres en FCFA
- Les montants sont en Francs CFA (FCFA)
- Dans "message" : confirme ce que tu as rempli, sois concis et professionnel`;

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
