import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export interface Prospect {
  id: number;
  nom_entreprise: string;
  telephone: string | null;
  email?: string | null;
  site_web: string | null;
  adresse: string | null;
  secteur: string | null;
  message_genere: string | null;
  lien_whatsapp: string | null;
  statut: "nouveau" | "contacte" | "repondu";
  date_ajout: string;
  date_contact: string | null;
}

// Sur Vercel le filesystem est read-only — seul /tmp est accessible en écriture.
// En local on garde le chemin dans le projet pour la persistance.
const DB_PATH = process.env.VERCEL
  ? "/tmp/prospects.db"
  : path.join(process.cwd(), "tutto_legno_agent", "output", "prospects.db");

function openDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS prospects (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      nom_entreprise  TEXT    NOT NULL,
      telephone       TEXT,
      email           TEXT,
      site_web        TEXT,
      adresse         TEXT,
      secteur         TEXT,
      message_genere  TEXT,
      lien_whatsapp   TEXT,
      statut          TEXT    DEFAULT 'nouveau',
      date_ajout      TEXT    DEFAULT (datetime('now')),
      date_contact    TEXT
    )
  `);
  // migration : ajoute email si la colonne n'existe pas encore
  try { db.exec("ALTER TABLE prospects ADD COLUMN email TEXT"); } catch { /* déjà présente */ }

  return db;
}

export function getAllProspects(): Prospect[] {
  const db = openDb();
  const rows = db
    .prepare("SELECT * FROM prospects ORDER BY date_ajout DESC")
    .all() as Prospect[];
  db.close();
  return rows;
}

export function insertProspect(
  data: Omit<Prospect, "id" | "statut" | "date_ajout" | "date_contact" | "message_genere" | "lien_whatsapp">
): number {
  const db = openDb();
  const exists = db
    .prepare("SELECT id FROM prospects WHERE LOWER(nom_entreprise) = LOWER(?)")
    .get(data.nom_entreprise.trim());
  if (exists) {
    db.close();
    return -1; // doublon
  }
  const result = db
    .prepare(`
      INSERT INTO prospects (nom_entreprise, telephone, email, site_web, adresse, secteur)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      data.nom_entreprise.trim(),
      data.telephone || null,
      data.email || null,
      data.site_web || null,
      data.adresse || null,
      data.secteur || null
    );
  db.close();
  return result.lastInsertRowid as number;
}

export function updateProspect(
  id: number,
  fields: Partial<Pick<Prospect, "message_genere" | "lien_whatsapp" | "statut" | "date_contact" | "email">>
) {
  const db = openDb();
  const sets = Object.keys(fields)
    .map((k) => `${k} = ?`)
    .join(", ");
  db.prepare(`UPDATE prospects SET ${sets} WHERE id = ?`).run(
    ...Object.values(fields),
    id
  );
  db.close();
}

export function deleteProspect(id: number) {
  const db = openDb();
  db.prepare("DELETE FROM prospects WHERE id = ?").run(id);
  db.close();
}
