"""
main.py — Pipeline principal de l'agent de prospection TUTTO LEGNO.
Orchestre le scraping, la génération de messages, les liens WhatsApp,
l'export CSV et la génération de la page HTML.
"""

import os
import csv
import logging
from datetime import datetime
from dotenv import load_dotenv

from database import (
    init_database,
    get_nouveaux_prospects,
    get_tous_prospects,
    mettre_a_jour_message,
)
from scraper import lancer_scraping
from message_generator import generer_message
from whatsapp import generer_lien_whatsapp

load_dotenv()

OUTPUT_DIR  = os.path.join(os.path.dirname(__file__), "output")
CSV_PATH    = os.path.join(OUTPUT_DIR, "prospects.csv")
HTML_PATH   = os.path.join(OUTPUT_DIR, "links.html")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─── ÉTAPE 1 : Scraping ──────────────────────────────────────────────────────

def etape_scraping():
    logger.info("=" * 60)
    logger.info("ÉTAPE 1 — Scraping des prospects")
    logger.info("=" * 60)
    ids = lancer_scraping()
    logger.info(f"→ {len(ids)} nouveaux prospects ajoutés à la base.")
    return ids


# ─── ÉTAPE 2 : Génération messages + liens WhatsApp ──────────────────────────

def etape_messages_et_liens():
    logger.info("=" * 60)
    logger.info("ÉTAPE 2 — Génération messages Groq + liens WhatsApp")
    logger.info("=" * 60)

    nouveaux = get_nouveaux_prospects()
    logger.info(f"{len(nouveaux)} prospects à traiter...")

    traites = 0
    for p in nouveaux:
        prospect_id    = p["id"]
        nom_entreprise = p["nom_entreprise"]
        secteur        = p["secteur"] or "Immobilier"
        telephone      = p.get("telephone", "")

        # Générer le message personnalisé via Groq
        message = generer_message(nom_entreprise, secteur)

        # Générer le lien WhatsApp si un numéro est disponible
        lien = generer_lien_whatsapp(telephone, message) if telephone else ""

        # Sauvegarder en base
        mettre_a_jour_message(prospect_id, message, lien)
        traites += 1
        logger.info(f"[{traites}/{len(nouveaux)}] {nom_entreprise} → {'lien OK' if lien else 'pas de numéro'}")

    logger.info(f"→ {traites} prospects traités.")


# ─── ÉTAPE 3 : Export CSV ────────────────────────────────────────────────────

def etape_export_csv():
    logger.info("=" * 60)
    logger.info("ÉTAPE 3 — Export CSV")
    logger.info("=" * 60)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    prospects = get_tous_prospects()

    colonnes = [
        "id", "nom_entreprise", "telephone", "site_web",
        "adresse", "secteur", "statut",
        "message_genere", "lien_whatsapp",
        "date_ajout", "date_contact",
    ]

    with open(CSV_PATH, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=colonnes, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(prospects)

    logger.info(f"→ CSV exporté : {CSV_PATH} ({len(prospects)} lignes)")


# ─── ÉTAPE 4 : Génération HTML ───────────────────────────────────────────────

def etape_generation_html():
    logger.info("=" * 60)
    logger.info("ÉTAPE 4 — Génération page HTML")
    logger.info("=" * 60)

    prospects = get_tous_prospects()
    secteurs  = sorted(set(p["secteur"] for p in prospects if p["secteur"]))
    date_gen  = datetime.now().strftime("%d/%m/%Y à %H:%M")

    # ── Lignes du tableau ──
    lignes_html = ""
    for p in prospects:
        lien        = p.get("lien_whatsapp", "")
        message     = (p.get("message_genere") or "").replace("\n", "<br>")
        statut      = p.get("statut", "nouveau")
        statut_css  = "statut-contacte" if statut == "contacte" else "statut-nouveau"
        bouton      = (
            f'<a href="{lien}" target="_blank" class="btn-wa" '
            f'onclick="marquerContacte({p["id"]}, this)">📲 WhatsApp</a>'
            if lien else
            '<span class="no-phone">Pas de numéro</span>'
        )

        lignes_html += f"""
        <tr data-id="{p['id']}" data-secteur="{p.get('secteur','')}" class="row-{statut}">
            <td class="td-nom">{p['nom_entreprise']}</td>
            <td><span class="badge">{p.get('secteur','—')}</span></td>
            <td class="td-tel">{p.get('telephone','—')}</td>
            <td class="td-msg"><div class="msg-preview">{message or '<em>Non généré</em>'}</div></td>
            <td><span class="{statut_css}">{statut.capitalize()}</span></td>
            <td>{bouton}</td>
        </tr>"""

    # ── Options filtre secteur ──
    options_secteur = '<option value="">Tous les secteurs</option>'
    for s in secteurs:
        options_secteur += f'<option value="{s}">{s}</option>'

    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TUTTO LEGNO — Prospects WhatsApp</title>
    <style>
        :root {{
            --or:    #B8892A;
            --or2:   #d4a843;
            --fond:  #0f0f0f;
            --card:  #1a1a1a;
            --bord:  #2a2a2a;
            --texte: #e8e8e8;
            --gris:  #888;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            background: var(--fond);
            color: var(--texte);
            font-family: 'Segoe UI', system-ui, sans-serif;
            min-height: 100vh;
        }}
        header {{
            background: linear-gradient(135deg, #1a1200, #2d1e00);
            border-bottom: 2px solid var(--or);
            padding: 24px 40px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
        }}
        header h1 {{
            font-size: 1.6rem;
            color: var(--or);
            letter-spacing: 2px;
            text-transform: uppercase;
        }}
        header p {{ color: var(--gris); font-size: 0.85rem; }}
        .counter {{
            background: var(--or);
            color: #000;
            padding: 8px 20px;
            border-radius: 30px;
            font-weight: 700;
            font-size: 1rem;
        }}
        .toolbar {{
            padding: 20px 40px;
            display: flex;
            gap: 16px;
            align-items: center;
            flex-wrap: wrap;
            border-bottom: 1px solid var(--bord);
        }}
        select, input {{
            background: var(--card);
            border: 1px solid var(--bord);
            color: var(--texte);
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 0.9rem;
            outline: none;
            cursor: pointer;
            transition: border-color 0.2s;
        }}
        select:focus, input:focus {{ border-color: var(--or); }}
        .stats-bar {{
            padding: 12px 40px;
            display: flex;
            gap: 24px;
            font-size: 0.85rem;
            color: var(--gris);
            border-bottom: 1px solid var(--bord);
        }}
        .stats-bar span {{ color: var(--or); font-weight: 600; }}
        .table-wrap {{
            overflow-x: auto;
            padding: 24px 40px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 0.88rem;
        }}
        thead th {{
            background: var(--card);
            color: var(--or);
            padding: 12px 14px;
            text-align: left;
            border-bottom: 2px solid var(--or);
            white-space: nowrap;
            text-transform: uppercase;
            font-size: 0.78rem;
            letter-spacing: 1px;
        }}
        tbody tr {{
            border-bottom: 1px solid var(--bord);
            transition: background 0.15s;
        }}
        tbody tr:hover {{ background: #1e1800; }}
        tbody tr.row-contacte {{ opacity: 0.55; }}
        td {{
            padding: 12px 14px;
            vertical-align: top;
        }}
        .td-nom {{ font-weight: 600; color: #fff; min-width: 180px; }}
        .td-tel {{ white-space: nowrap; color: var(--or2); }}
        .td-msg {{ min-width: 280px; max-width: 400px; }}
        .msg-preview {{
            font-size: 0.82rem;
            color: #ccc;
            line-height: 1.5;
            max-height: 90px;
            overflow: hidden;
            position: relative;
        }}
        .badge {{
            background: #1e1800;
            border: 1px solid var(--or);
            color: var(--or);
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 0.75rem;
            white-space: nowrap;
        }}
        .statut-nouveau  {{ color: #4ade80; font-size: 0.82rem; font-weight: 600; }}
        .statut-contacte {{ color: var(--gris); font-size: 0.82rem; }}
        .btn-wa {{
            display: inline-block;
            background: #25D366;
            color: #000;
            padding: 7px 14px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 700;
            font-size: 0.82rem;
            white-space: nowrap;
            transition: opacity 0.2s, transform 0.1s;
        }}
        .btn-wa:hover {{ opacity: 0.85; transform: scale(1.03); }}
        .btn-wa.contacte {{ background: var(--bord); color: var(--gris); pointer-events: none; }}
        .no-phone {{ color: var(--gris); font-size: 0.8rem; }}
        .hidden {{ display: none !important; }}
        footer {{
            text-align: center;
            padding: 30px;
            color: var(--gris);
            font-size: 0.8rem;
            border-top: 1px solid var(--bord);
        }}
        footer a {{ color: var(--or); text-decoration: none; }}
    </style>
</head>
<body>

<header>
    <div>
        <h1>TUTTO LEGNO — Prospection WhatsApp</h1>
        <p>Généré le {date_gen} · Menuiserie bois massif haut de gamme · Abidjan</p>
    </div>
    <div class="counter" id="counter">{len(prospects)} prospects prêts à contacter</div>
</header>

<div class="toolbar">
    <select id="filtreSecteur" onchange="filtrer()">
        {options_secteur}
    </select>
    <select id="filtreStatut" onchange="filtrer()">
        <option value="">Tous les statuts</option>
        <option value="nouveau">Nouveau</option>
        <option value="contacte">Contacté</option>
    </select>
    <input type="text" id="recherche" placeholder="Rechercher un nom..." oninput="filtrer()">
</div>

<div class="stats-bar">
    <div>Total : <span id="stat-total">{len(prospects)}</span></div>
    <div>Nouveaux : <span id="stat-nouveaux">{sum(1 for p in prospects if p['statut']=='nouveau')}</span></div>
    <div>Contactés : <span id="stat-contactes">{sum(1 for p in prospects if p['statut']=='contacte')}</span></div>
    <div>Avec numéro : <span id="stat-tel">{sum(1 for p in prospects if p.get('telephone'))}</span></div>
</div>

<div class="table-wrap">
    <table id="tableau">
        <thead>
            <tr>
                <th>Entreprise</th>
                <th>Secteur</th>
                <th>Téléphone</th>
                <th>Message préparé</th>
                <th>Statut</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            {lignes_html}
        </tbody>
    </table>
</div>

<footer>
    TUTTO LEGNO · Cocody Abatta, Abidjan · 07 07 55 35 45 ·
    <a href="https://www.tutto-legno.ci" target="_blank">www.tutto-legno.ci</a>
</footer>

<script>
    // Filtre combiné : secteur + statut + texte
    function filtrer() {{
        const secteur  = document.getElementById('filtreSecteur').value.toLowerCase();
        const statut   = document.getElementById('filtreStatut').value.toLowerCase();
        const texte    = document.getElementById('recherche').value.toLowerCase();
        const lignes   = document.querySelectorAll('#tableau tbody tr');
        let visibles   = 0;

        lignes.forEach(tr => {{
            const s  = (tr.dataset.secteur || '').toLowerCase();
            const st = tr.className.includes('row-contacte') ? 'contacte' : 'nouveau';
            const t  = tr.querySelector('.td-nom')?.textContent.toLowerCase() || '';

            const ok = (!secteur || s === secteur)
                    && (!statut  || st === statut)
                    && (!texte   || t.includes(texte));

            tr.classList.toggle('hidden', !ok);
            if (ok) visibles++;
        }});

        document.getElementById('counter').textContent = visibles + ' prospects affichés';
    }}

    // Marque un prospect comme contacté au clic sur le bouton WhatsApp
    function marquerContacte(id, btn) {{
        const tr = document.querySelector('tr[data-id="' + id + '"]');
        if (!tr) return;

        // Mise à jour visuelle immédiate
        tr.classList.add('row-contacte');
        const statutSpan = tr.querySelector('[class^="statut"]');
        if (statutSpan) {{
            statutSpan.className = 'statut-contacte';
            statutSpan.textContent = 'Contacté';
        }}
        btn.classList.add('contacte');
        btn.textContent = '✓ Envoyé';

        // Mise à jour du compteur
        const total    = document.querySelectorAll('tbody tr:not(.hidden)').length;
        const contactes = document.querySelectorAll('tbody tr.row-contacte:not(.hidden)').length;
        document.getElementById('stat-contactes').textContent = contactes;
        document.getElementById('stat-nouveaux').textContent  = total - contactes;
    }}
</script>

</body>
</html>"""

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(HTML_PATH, "w", encoding="utf-8") as f:
        f.write(html)

    logger.info(f"→ Page HTML générée : {HTML_PATH}")


# ─── PIPELINE COMPLET ────────────────────────────────────────────────────────

def main():
    logger.info("╔══════════════════════════════════════════════════════════╗")
    logger.info("║        TUTTO LEGNO — Agent de prospection v1.0          ║")
    logger.info("╚══════════════════════════════════════════════════════════╝")

    # Initialiser la base de données
    init_database()

    # Étape 1 — Scraping
    etape_scraping()

    # Étape 2 — Génération messages & liens WhatsApp
    etape_messages_et_liens()

    # Étape 3 — Export CSV
    etape_export_csv()

    # Étape 4 — Génération HTML
    etape_generation_html()

    logger.info("╔══════════════════════════════════════════════════════════╗")
    logger.info("║  Pipeline terminé. Fichiers disponibles dans output/    ║")
    logger.info(f"║  HTML  → {HTML_PATH}")
    logger.info(f"║  CSV   → {CSV_PATH}")
    logger.info("╚══════════════════════════════════════════════════════════╝")


if __name__ == "__main__":
    main()
