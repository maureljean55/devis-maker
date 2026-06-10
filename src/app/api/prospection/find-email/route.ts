import { NextRequest, NextResponse } from "next/server";
import { updateProspect } from "@/lib/prospection-db";

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const IGNORED_DOMAINS = [
  "sentry.io", "google.com", "googleapis.com", "gstatic.com",
  "facebook.com", "twitter.com", "instagram.com", "linkedin.com",
  "wixpress.com", "wix.com", "squarespace.com", "wordpress.com",
  "cloudflare.com", "jsdelivr.net", "unpkg.com", "amazonaws.com",
  "example.com", "email.com", "domain.com", "schema.org",
];

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate",
  "Cache-Control": "no-cache",
};

function scoreEmail(email: string): number {
  const lower = email.toLowerCase();
  if (lower.startsWith("contact@"))   return 10;
  if (lower.startsWith("info@"))      return 9;
  if (lower.startsWith("hello@"))     return 8;
  if (lower.startsWith("bonjour@"))   return 8;
  if (lower.startsWith("accueil@"))   return 7;
  if (lower.startsWith("commercial@")) return 7;
  if (lower.startsWith("direction@")) return 6;
  if (lower.startsWith("admin@"))     return 5;
  if (lower.includes("noreply"))      return -5;
  if (lower.includes("no-reply"))     return -5;
  if (lower.includes("donotreply"))   return -5;
  if (lower.includes("example"))      return -10;
  if (/\.(png|jpg|gif|svg|css|js)/.test(lower)) return -20;
  return 3;
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: BROWSER_HEADERS,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function extractEmails(html: string, siteDomain: string): string[] {
  const mailtoMatches = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g) || [];
  const mailtoEmails  = mailtoMatches.map((m) => m.replace("mailto:", "").split("?")[0].toLowerCase());

  const allMatches = html.match(EMAIL_REGEX) || [];
  const allEmails  = allMatches.map((e) => e.toLowerCase());

  const seen      = new Set<string>();
  const candidates: string[] = [];
  for (const email of [...mailtoEmails, ...allEmails]) {
    if (seen.has(email)) continue;
    seen.add(email);
    const domain = email.split("@")[1];
    if (!domain) continue;
    if (IGNORED_DOMAINS.some((d) => domain.includes(d))) continue;
    if (email.length > 80) continue;
    candidates.push(email);
  }

  const sameDomain = candidates.filter((e) => e.includes(siteDomain));
  const others     = candidates.filter((e) => !e.includes(siteDomain));

  return [...sameDomain, ...others].sort((a, b) => scoreEmail(b) - scoreEmail(a)).slice(0, 5);
}

// Génère des emails probables à partir du domaine (fallback)
function guesserEmails(domain: string): string[] {
  return [
    `contact@${domain}`,
    `info@${domain}`,
    `commercial@${domain}`,
    `direction@${domain}`,
  ];
}

export async function POST(req: NextRequest) {
  try {
    const { prospect_id, site_web } = await req.json();

    if (!site_web) {
      return NextResponse.json({ error: "Ce prospect n'a pas de site web renseigné." }, { status: 400 });
    }

    let url = site_web.trim();
    if (!url.startsWith("http")) url = "https://" + url;

    const siteDomain = new URL(url).hostname.replace(/^www\./, "");

    // Essai 1 : page d'accueil
    let emails: string[] = [];
    let siteAccessible = false;

    try {
      const html = await fetchHtml(url);
      siteAccessible = true;
      emails = extractEmails(html, siteDomain);
    } catch {
      // Essai avec http://
      try {
        const html = await fetchHtml(url.replace("https://", "http://"));
        siteAccessible = true;
        emails = extractEmails(html, siteDomain);
      } catch {
        // Site inaccessible — on passe au fallback
      }
    }

    // Essai 2 : page /contact si aucun email de qualité
    if (siteAccessible && (emails.length === 0 || scoreEmail(emails[0]) < 5)) {
      try {
        const contactUrl = url.replace(/\/$/, "") + "/contact";
        const contactHtml = await fetchHtml(contactUrl);
        const contactEmails = extractEmails(contactHtml, siteDomain);
        const merged = new Map<string, number>();
        [...emails, ...contactEmails].forEach((e) => merged.set(e, scoreEmail(e)));
        emails = Array.from(merged.keys()).sort((a, b) => (merged.get(b)! - merged.get(a)!));
      } catch { /* page /contact inaccessible */ }
    }

    // Fallback : si toujours rien de bien, proposer des emails probables
    if (emails.length === 0 || scoreEmail(emails[0]) < 0) {
      const guesses = guesserEmails(siteDomain);
      return NextResponse.json({
        email:       guesses[0],
        suggestions: guesses,
        guessed:     true,
        warning:     siteAccessible
          ? "Aucun email trouvé sur ce site. Voici des adresses probables à vérifier."
          : "Site inaccessible. Voici des adresses probables basées sur le domaine.",
      });
    }

    const best = emails[0];
    if (prospect_id) {
      updateProspect(prospect_id, { email: best });
    }

    return NextResponse.json({ email: best, suggestions: emails });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
