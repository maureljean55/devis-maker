"""
demo.py — Mode démonstration avec prospects fictifs.
Permet de tester le pipeline complet (messages + HTML + CSV)
sans lancer le scraping Selenium.
Utile pour valider la clé Groq et le rendu HTML.
"""

import logging
from database import init_database, inserer_prospect, prospect_existe
from main import etape_messages_et_liens, etape_export_csv, etape_generation_html

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

PROSPECTS_DEMO = [
    {
        "nom_entreprise": "Groupe SICOGI Immobilier",
        "telephone":      "0707553545",
        "site_web":       "https://sicogi.ci",
        "adresse":        "Abidjan, Plateau",
        "secteur":        "Promoteur immobilier",
    },
    {
        "nom_entreprise": "Cabinet Architecture Tropic",
        "telephone":      "+2250102030405",
        "site_web":       "https://architectropic.ci",
        "adresse":        "Cocody, Abidjan",
        "secteur":        "Architecture",
    },
    {
        "nom_entreprise": "Déco & Prestige Abidjan",
        "telephone":      "0504050607",
        "site_web":       "",
        "adresse":        "Marcory, Abidjan",
        "secteur":        "Décoration intérieure",
    },
    {
        "nom_entreprise": "Immo Excellence CI",
        "telephone":      "",
        "site_web":       "https://immoexcellence.ci",
        "adresse":        "Riviera 3, Abidjan",
        "secteur":        "Agence immobilière",
    },
    {
        "nom_entreprise": "BATI CONSTRUCT CI",
        "telephone":      "07 11 22 33 44",
        "site_web":       "",
        "adresse":        "Yopougon, Abidjan",
        "secteur":        "Construction",
    },
    {
        "nom_entreprise": "BTP SOLUTIONS IVOIRE",
        "telephone":      "0056789012",
        "site_web":       "https://btpsolutions.ci",
        "adresse":        "Adjamé, Abidjan",
        "secteur":        "BTP",
    },
]


def charger_prospects_demo():
    """Insère les prospects de démo en évitant les doublons."""
    inseres = 0
    for p in PROSPECTS_DEMO:
        if not prospect_existe(p["nom_entreprise"]):
            inserer_prospect(p)
            inseres += 1
        else:
            logger.info(f"Déjà en base : {p['nom_entreprise']}")
    logger.info(f"→ {inseres} prospects de démo insérés.")


if __name__ == "__main__":
    logger.info("=== MODE DÉMONSTRATION TUTTO LEGNO ===")
    init_database()
    charger_prospects_demo()
    etape_messages_et_liens()
    etape_export_csv()
    etape_generation_html()
    logger.info("=== Demo terminée — ouvrez output/links.html ===")
