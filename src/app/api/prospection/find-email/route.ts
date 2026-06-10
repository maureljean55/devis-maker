import { NextRequest, NextResponse } from "next/server";
import { updateProspect } from "@/lib/prospection-db";

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// Domaines génériques à ignorer (images, scripts, etc.)
const IGNORED_DOMAINS = [
  "sentry.io", "google.com", "googleapis.com", "gstatic.com",
  "facebook.com", "twitter.com", "instagram.com", "linkedin.com",
  "wixpress.com", "wix.com", "squarespace.com", "wordpress.com",
  "cloudflare.com", "jsdelivr.net", "unpkg.com", "amazonaws.com",
  "example.com", "email.com", "domain.com",
];

function scoreEmail(email: string): number {
  const lower = email.toLowerCase();
  // Favoriser les emails de contact génériques
  if (lower.startsWith("contact@"))  return 10;
  if (lower.startsWith("info@"))     return 9;
  if (lower.startsWith("hello@"))    return 8;
  if (lower.startsWith("bonjour@"))  return 8;
  if (lower.startsWith("accueil@"))  return 7;
  if (lower.startsWith("commercial@")) return 7;
  if (lower.startsWith("direction@")) return 6;
  if (lower.startsWith("admin@"))    return 5;
  // Pénaliser les emails suspects
  if (lower.includes("noreply"))     return -5;
  if (lower.includes("no-reply"))    return -5;
  if (lower.includes("donotreply"))  return -5;
  if (lower.includes("example"))     return -10;
  if (lower.includes(".png") || lower.includes(".jpg") || lower.includes(".gif")) return -20;
  return 3;
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EmailFinder/1.0)",
        "Accept": "text/html",
      },
    });
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function extractEmails(html: string, siteDomain: string): string[] {
  // Extraire depuis les liens mailto: en priorité
  const mailtoMatches = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g) || [];
  const mailtoEmails  = mailtoMatches.map((m) => m.replace("mailto:", "").split("?")[0].toLowerCase());

  // Extraire tous les emails du texte
  const allMatches = html.match(EMAIL_REGEX) || [];
  const allEmails  = allMatches.map((e) => e.toLowerCase());

  // Fusionner, dédupliquer
  const seen  = new Set<string>();
  const candidates: string[] = [];
  for (const email of [...mailtoEmails, ...allEmails]) {
    if (seen.has(email)) continue;
    seen.add(email);
    // Ignorer les domaines génériques et les emails pas du site
    const domain = email.split("@")[1];
    if (IGNORED_DOMAINS.some((d) => domain.includes(d))) continue;
    if (email.length > 80) continue;
    candidates.push(email);
  }

  // Trier par score décroissant
  candidates.sort((a, b) => scoreEmail(b) - scoreEmail(a));

  // Favoriser les emails du même domaine que le site
  const sameDomain = candidates.filter((e) => e.includes(siteDomain));
  const others     = candidates.filter((e) => !e.includes(siteDomain));

  return [...sameDomain, ...others].slice(0, 5);
}

export async function POST(req: NextRequest) {
  try {
    const { prospect_id, site_web } = await req.json();

    if (!site_web) {
      return NextResponse.json({ error: "Ce prospect n'a pas de site web renseigné." }, { status: 400 });
    }

    let url = site_web.trim();
    if (!url.startsWith("http")) url = "https://" + url;

    // Extraire le domaine pour scorer les emails
    const siteDomain = new URL(url).hostname.replace(/^www\./, "");

    let html = "";
    try {
      html = await fetchHtml(url);
    } catch {
      // Essayer avec http si https échoue
      try {
        html = await fetchHtml(url.replace("https://", "http://"));
      } catch {
        return NextResponse.json({ error: "Impossible d'accéder au site web du prospect." }, { status: 400 });
      }
    }

    // Chercher aussi la page /contact si pas d'email trouvé sur la homepage
    const emails = extractEmails(html, siteDomain);
    let finalEmails = emails;

    if (emails.length === 0 || scoreEmail(emails[0]) < 3) {
      try {
        const contactUrl = url.replace(/\/$/, "") + "/contact";
        const contactHtml = await fetchHtml(contactUrl);
        const contactEmails = extractEmails(contactHtml, siteDomain);
        // Fusionner
        const merged = new Set([...emails, ...contactEmails]);
        finalEmails = Array.from(merged).sort((a, b) => scoreEmail(b) - scoreEmail(a));
      } catch {
        // page /contact inaccessible, on garde ce qu'on a
      }
    }

    if (finalEmails.length === 0) {
      return NextResponse.json({ error: "Aucun email trouvé sur ce site." }, { status: 404 });
    }

    const best = finalEmails[0];

    // Sauvegarder automatiquement le meilleur email
    if (prospect_id) {
      updateProspect(prospect_id, { email: best });
    }

    return NextResponse.json({ email: best, suggestions: finalEmails });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
