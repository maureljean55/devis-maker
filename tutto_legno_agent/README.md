# TUTTO LEGNO — Agent de Prospection WhatsApp

Agent automatisé de prospection pour TUTTO LEGNO (menuiserie bois massif, Abidjan).

## Fonctionnement

```
Scraping Google → SQLite → Groq API (messages) → Liens WhatsApp → HTML + CSV
```

## Installation

```bash
cd tutto_legno_agent
pip install -r requirements.txt
```

## Configuration

Éditer `.env` :
```
GROQ_API_KEY=votre_clé_groq
WHATSAPP_NUMBER=2250713721575
```

## Utilisation

### Mode démonstration (sans scraping)
```bash
python demo.py
```
Charge 6 prospects fictifs, génère les messages et le HTML. Idéal pour tester sans Chrome.

### Mode complet (avec scraping Google)
```bash
python main.py
```
Lance le scraping, génère les messages, exporte CSV et HTML.

## Fichiers générés

| Fichier | Description |
|---|---|
| `output/prospects.db` | Base SQLite de tous les prospects |
| `output/prospects.csv` | Export tableur |
| `output/links.html` | Page HTML avec boutons WhatsApp |

## Structure

```
tutto_legno_agent/
├── .env                  # Clés API
├── requirements.txt
├── main.py               # Pipeline complet
├── demo.py               # Mode test sans scraping
├── scraper.py            # Selenium + BeautifulSoup
├── message_generator.py  # Groq API (llama-3.3-70b)
├── database.py           # SQLite
├── whatsapp.py           # Génération liens wa.me
└── output/
    ├── prospects.db
    ├── prospects.csv
    └── links.html
```

## Limites

- 50 prospects max par session (anti-blocage Google)
- Délai 3–5s entre requêtes Google
- User-Agent aléatoire à chaque session
- Doublons filtrés automatiquement en base
