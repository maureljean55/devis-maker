"""
database.py — Gestion SQLite des prospects TUTTO LEGNO
Crée la base, insère les prospects et évite les doublons.
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "output", "prospects.db")


def get_connection():
    """Retourne une connexion SQLite avec row_factory pour accès par colonnes."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    """Crée la table prospects si elle n'existe pas encore."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS prospects (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            nom_entreprise  TEXT    NOT NULL,
            telephone       TEXT,
            site_web        TEXT,
            adresse         TEXT,
            secteur         TEXT,
            message_genere  TEXT,
            lien_whatsapp   TEXT,
            statut          TEXT    DEFAULT 'nouveau',
            date_ajout      TEXT    DEFAULT (datetime('now')),
            date_contact    TEXT
        )
    """)
    conn.commit()
    conn.close()
    print("[DB] Base de données initialisée.")


def prospect_existe(nom_entreprise: str) -> bool:
    """Vérifie si un prospect existe déjà (comparaison insensible à la casse)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id FROM prospects WHERE LOWER(nom_entreprise) = LOWER(?)",
        (nom_entreprise.strip(),)
    )
    existe = cursor.fetchone() is not None
    conn.close()
    return existe


def inserer_prospect(data: dict) -> int:
    """
    Insère un nouveau prospect et retourne son id.
    data : dict avec clés nom_entreprise, telephone, site_web, adresse, secteur.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO prospects
            (nom_entreprise, telephone, site_web, adresse, secteur, date_ajout)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data.get("nom_entreprise", "").strip(),
        data.get("telephone", ""),
        data.get("site_web", ""),
        data.get("adresse", ""),
        data.get("secteur", ""),
        datetime.now().isoformat()
    ))
    conn.commit()
    prospect_id = cursor.lastrowid
    conn.close()
    print(f"[DB] Prospect inséré → id={prospect_id} | {data.get('nom_entreprise')}")
    return prospect_id


def mettre_a_jour_message(prospect_id: int, message: str, lien_whatsapp: str):
    """Met à jour le message généré et le lien WhatsApp d'un prospect."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE prospects
        SET message_genere = ?, lien_whatsapp = ?
        WHERE id = ?
    """, (message, lien_whatsapp, prospect_id))
    conn.commit()
    conn.close()
    print(f"[DB] Message & lien mis à jour → id={prospect_id}")


def marquer_contacte(prospect_id: int):
    """Passe le statut du prospect à 'contacte' avec la date du jour."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE prospects
        SET statut = 'contacte', date_contact = ?
        WHERE id = ?
    """, (datetime.now().isoformat(), prospect_id))
    conn.commit()
    conn.close()


def get_tous_prospects() -> list:
    """Retourne tous les prospects triés par date d'ajout décroissante."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM prospects ORDER BY date_ajout DESC")
    prospects = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return prospects


def get_nouveaux_prospects() -> list:
    """Retourne uniquement les prospects avec statut 'nouveau'."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM prospects WHERE statut = 'nouveau' ORDER BY date_ajout DESC"
    )
    prospects = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return prospects
