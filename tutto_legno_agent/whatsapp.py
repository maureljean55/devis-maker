"""
whatsapp.py — Génération des liens WhatsApp pré-remplis pour chaque prospect.
Nettoie les numéros, ajoute l'indicatif +225 si absent, encode le message en URL.
"""

import re
import logging
from urllib.parse import quote

logging.basicConfig(level=logging.INFO, format="[WHATSAPP] %(message)s")
logger = logging.getLogger(__name__)

INDICATIF_CI = "225"


def nettoyer_numero(telephone: str) -> str:
    """
    Normalise un numéro de téléphone au format international Côte d'Ivoire.
    Supprime espaces, tirets, parenthèses. Ajoute 225 si nécessaire.
    Retourne une chaîne vide si le numéro est invalide.
    """
    if not telephone:
        return ""

    # Supprimer tout sauf les chiffres
    chiffres = re.sub(r"\D", "", telephone)

    # Supprimer les zéros initiaux redondants (00225 → 225...)
    if chiffres.startswith("00"):
        chiffres = chiffres[2:]

    # Supprimer le "+" s'il était là (déjà supprimé par re.sub mais sécurité)
    if chiffres.startswith("225"):
        # Format déjà correct — vérifier longueur (225 + 10 chiffres = 13)
        if len(chiffres) == 13:
            return chiffres
        else:
            logger.warning(f"Numéro suspect (longueur {len(chiffres)}) : {telephone}")
            return ""

    # Numéro local ivoirien (commence par 0X ou directement XX)
    if chiffres.startswith("0") and len(chiffres) == 10:
        # Supprimer le 0 initial puis ajouter 225
        return INDICATIF_CI + chiffres[1:]

    if len(chiffres) == 10:
        return INDICATIF_CI + chiffres

    if len(chiffres) == 8:
        # Format court ivoirien sans le 0
        return INDICATIF_CI + chiffres

    logger.warning(f"Numéro invalide ignoré : '{telephone}' → '{chiffres}'")
    return ""


def generer_lien_whatsapp(telephone: str, message: str) -> str:
    """
    Génère un lien wa.me avec le message encodé en URL.
    Retourne une chaîne vide si le numéro est invalide.
    """
    numero_propre = nettoyer_numero(telephone)
    if not numero_propre:
        logger.warning(f"Impossible de générer un lien : numéro invalide '{telephone}'")
        return ""

    message_encode = quote(message, safe="")
    lien = f"https://wa.me/{numero_propre}?text={message_encode}"
    logger.info(f"Lien généré → {lien[:80]}...")
    return lien


def generer_lien_sans_numero(message: str, numero_tuttolego: str = "2250707553545") -> str:
    """
    Pour les prospects sans numéro, génère un lien WhatsApp
    depuis le propre numéro TUTTO LEGNO pour partir d'une conversation.
    Utilisé uniquement en mode démo / test.
    """
    message_encode = quote(message, safe="")
    return f"https://wa.me/{numero_tuttolego}?text={message_encode}"
