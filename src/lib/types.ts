export interface LigneDevis {
  id: string;
  designation: string;
  unitaire: number | "";
  qte: number | "";
  montant: number | "";
}

export interface DevisData {
  num_devis: string;
  date_devis: string;
  client_nom: string;
  client_contact: string;
  client_objet: string;
  titre_travaux: string;
  lignes: LigneDevis[];
  main_oeuvre: number | "";
  montant_lettres: string;
  avance_pct: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface DevisUpdate {
  num_devis?: string | null;
  date_devis?: string | null;
  client_nom?: string | null;
  client_contact?: string | null;
  client_objet?: string | null;
  titre_travaux?: string | null;
  lignes?: Array<{ designation: string; unitaire: number; qte: number }> | null;
  main_oeuvre?: number | null;
  montant_lettres?: string | null;
  avance_pct?: number | null;
}

export interface ChatResponse {
  message: string;
  update: DevisUpdate | null;
}
