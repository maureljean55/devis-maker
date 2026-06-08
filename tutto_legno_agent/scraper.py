"""
scraper.py — Scraping Google Search pour trouver des prospects à Abidjan.
Utilise Selenium + BeautifulSoup avec rotation de User-Agent.
Limite à 50 prospects par session. Délai 3-5s entre requêtes.
"""

import time
import random
import re
import logging
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from fake_useragent import UserAgent

from database import prospect_existe, inserer_prospect

logging.basicConfig(level=logging.INFO, format="[SCRAPER] %(message)s")
logger = logging.getLogger(__name__)

# Requêtes Google à lancer pour trouver des prospects
REQUETES = [
    ("promoteur immobilier Abidjan", "Promoteur immobilier"),
    ("architecte Abidjan Cocody", "Architecture"),
    ("décorateur intérieur Abidjan", "Décoration intérieure"),
    ("agence immobilière Abidjan", "Agence immobilière"),
    ("constructeur villa Abidjan", "Construction"),
    ("entrepreneur BTP Abidjan", "BTP"),
]

MAX_PROSPECTS_PAR_SESSION = 50


def creer_driver() -> webdriver.Chrome:
    """Initialise Chrome en mode headless avec un User-Agent aléatoire."""
    ua = UserAgent()
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    options.add_argument(f"user-agent={ua.random}")
    options.add_argument("--lang=fr-FR")
    options.add_argument("--window-size=1920,1080")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    return driver


def extraire_telephone(texte: str) -> str:
    """Extrait un numéro de téléphone ivoirien ou international du texte."""
    patterns = [
        r"\+225[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}",
        r"00225[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}",
        r"\b0[0-9][\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}\b",
        r"\b\d{2}[\s\-]\d{2}[\s\-]\d{2}[\s\-]\d{2}\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, texte)
        if match:
            return match.group(0).strip()
    return ""


def extraire_site_web(texte: str) -> str:
    """Extrait une URL depuis le texte si présente."""
    match = re.search(r"https?://[^\s]+", texte)
    return match.group(0).strip() if match else ""


def scraper_google(driver: webdriver.Chrome, requete: str, secteur: str) -> list:
    """
    Scrape une page de résultats Google pour une requête donnée.
    Retourne une liste de dicts prospect.
    """
    url = f"https://www.google.com/search?q={requete.replace(' ', '+')}&hl=fr&gl=ci&num=10"
    logger.info(f"Recherche : '{requete}'")

    try:
        driver.get(url)
        # Attendre que les résultats se chargent
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div#search"))
        )
        time.sleep(random.uniform(2, 3))
    except Exception as e:
        logger.error(f"Erreur chargement page Google : {e}")
        return []

    soup = BeautifulSoup(driver.page_source, "lxml")
    prospects = []

    # Cibler les blocs de résultats organiques Google
    blocs = soup.select("div.g, div[data-hveid], div.tF2Cxc")
    logger.info(f"Blocs trouvés : {len(blocs)}")

    for bloc in blocs:
        try:
            # Extraire le nom (titre du résultat)
            titre_tag = bloc.select_one("h3")
            if not titre_tag:
                continue
            nom = titre_tag.get_text(strip=True)

            # Filtrer les résultats non pertinents
            mots_exclus = ["wikipedia", "youtube", "facebook", "linkedin",
                           "instagram", "twitter", "google", "maps"]
            if any(mot in nom.lower() for mot in mots_exclus):
                continue

            # Extraire l'URL du résultat
            lien_tag = bloc.select_one("a[href]")
            site = lien_tag["href"] if lien_tag else ""
            if site.startswith("/url?q="):
                site = site.split("/url?q=")[1].split("&")[0]

            # Extraire l'extrait descriptif
            desc_tag = bloc.select_one("div.VwiC3b, span.st, div[data-sncf]")
            description = desc_tag.get_text(strip=True) if desc_tag else ""

            # Extraire adresse et téléphone depuis la description
            telephone = extraire_telephone(description)
            adresse_match = re.search(r"Abidjan[^,\.]*", description, re.IGNORECASE)
            adresse = adresse_match.group(0).strip() if adresse_match else "Abidjan"

            if nom and len(nom) > 3:
                prospects.append({
                    "nom_entreprise": nom,
                    "telephone": telephone,
                    "site_web": site,
                    "adresse": adresse,
                    "secteur": secteur,
                    "description": description,
                })

        except Exception as e:
            logger.warning(f"Erreur parsing bloc : {e}")
            continue

    return prospects


def scraper_pages_entreprises(driver: webdriver.Chrome, prospects: list) -> list:
    """
    Pour chaque prospect avec un site web, visite la page
    pour tenter d'extraire un numéro de téléphone plus précis.
    """
    enrichis = []
    for p in prospects:
        if p.get("site_web") and p.get("site_web").startswith("http") and not p.get("telephone"):
            try:
                logger.info(f"Visite site : {p['site_web']}")
                driver.get(p["site_web"])
                time.sleep(random.uniform(2, 3))
                texte_page = driver.find_element(By.TAG_NAME, "body").text
                tel = extraire_telephone(texte_page)
                if tel:
                    p["telephone"] = tel
                    logger.info(f"Téléphone trouvé sur site : {tel}")
            except Exception as e:
                logger.warning(f"Impossible de visiter {p['site_web']} : {e}")
        enrichis.append(p)
    return enrichis


def lancer_scraping() -> list:
    """
    Pipeline principal de scraping.
    Retourne la liste des ids des prospects nouvellement insérés.
    """
    logger.info("Démarrage du scraping...")
    driver = creer_driver()
    total_inseres = 0
    ids_inseres = []

    try:
        for requete, secteur in REQUETES:
            if total_inseres >= MAX_PROSPECTS_PAR_SESSION:
                logger.info(f"Limite de {MAX_PROSPECTS_PAR_SESSION} prospects atteinte.")
                break

            prospects_bruts = scraper_google(driver, requete, secteur)
            prospects_enrichis = scraper_pages_entreprises(driver, prospects_bruts)

            for p in prospects_enrichis:
                if total_inseres >= MAX_PROSPECTS_PAR_SESSION:
                    break

                if prospect_existe(p["nom_entreprise"]):
                    logger.info(f"Doublon ignoré : {p['nom_entreprise']}")
                    continue

                prospect_id = inserer_prospect(p)
                ids_inseres.append(prospect_id)
                total_inseres += 1

            # Pause entre chaque requête Google (3-5 secondes)
            pause = random.uniform(3, 5)
            logger.info(f"Pause {pause:.1f}s avant la prochaine requête...")
            time.sleep(pause)

    except Exception as e:
        logger.error(f"Erreur générale scraping : {e}")
    finally:
        driver.quit()
        logger.info(f"Scraping terminé — {total_inseres} nouveaux prospects trouvés.")

    return ids_inseres
