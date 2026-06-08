"""
message_generator.py — Génération de messages WhatsApp personnalisés via Groq API.
Utilise llama-3.3-70b-versatile. Max 5 lignes par message. Ton professionnel.
"""

import os
import logging
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="[MESSAGE] %(message)s")
logger = logging.getLogger(__name__)

# System prompt qui définit le rôle du commercial TUTTO LEGNO
SYSTEM_PROMPT = """Tu es le commercial de TUTTO LEGNO, une menuiserie bois massif haut de gamme basée à Cocody Abatta, Abidjan.
Tu rédiges des messages WhatsApp courts, professionnels et personnalisés pour prospecter des clients potentiels.
Ton ton est confiant, respectueux et direct.
Tu ne fais jamais plus de 5 lignes.
Tu mentionnes toujours un élément spécifique au secteur du prospect.
Tu écris en français ivoirien professionnel, sans emojis excessifs."""


def generer_message(nom_entreprise: str, secteur: str) -> str:
    """
    Génère un message WhatsApp personnalisé pour un prospect via Groq.
    Retourne le message texte brut.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key == "ta_cle_groq_ici":
        logger.error("GROQ_API_KEY non configurée dans le fichier .env")
        return generer_message_fallback(nom_entreprise, secteur)

    client = Groq(api_key=api_key)

    user_prompt = f"""Rédige un message WhatsApp de prospection pour {nom_entreprise}, une entreprise du secteur {secteur} basée à Abidjan.
Propose les services de TUTTO LEGNO : portes sur mesure, cuisines européennes, dressings et meubles TV en bois massif.
Termine par notre contact : 07 07 55 35 45 et notre site : www.tutto-legno.ci"""

    try:
        logger.info(f"Génération message pour : {nom_entreprise} ({secteur})")
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": user_prompt},
            ],
            max_tokens=300,
            temperature=0.7,
        )
        message = response.choices[0].message.content.strip()
        logger.info(f"Message généré ({len(message)} chars) pour {nom_entreprise}")
        return message

    except Exception as e:
        logger.error(f"Erreur Groq API pour {nom_entreprise} : {e}")
        return generer_message_fallback(nom_entreprise, secteur)


def generer_message_fallback(nom_entreprise: str, secteur: str) -> str:
    """
    Message de secours si l'API Groq est indisponible.
    Adapté au secteur pour rester pertinent.
    """
    accroches = {
        "Promoteur immobilier": "Pour vos projets résidentiels et vos livraisons clé en main",
        "Architecture":         "Pour sublimer vos réalisations architecturales",
        "Décoration intérieure":"Pour compléter vos projets de décoration haut de gamme",
        "Agence immobilière":   "Pour valoriser les biens que vous proposez à vos clients",
        "Construction":         "Pour les finitions intérieures de vos constructions",
        "BTP":                  "Pour les aménagements intérieurs de vos chantiers",
    }
    accroche = accroches.get(secteur, "Pour vos projets d'aménagement intérieur")

    return (
        f"Bonjour {nom_entreprise},\n\n"
        f"{accroche}, TUTTO LEGNO vous propose ses menuiseries bois massif haut de gamme : "
        f"portes sur mesure, cuisines européennes, dressings et meubles TV.\n\n"
        f"Parlons-en ensemble.\n"
        f"📞 07 07 55 35 45 | 🌐 www.tutto-legno.ci"
    )
