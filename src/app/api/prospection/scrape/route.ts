import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

// Lance le scraper Python dans le répertoire tutto_legno_agent
// mode "demo" → prospects fictifs (rapide, sans Chrome)
// mode "full"  → scraping Google réel (nécessite Chrome installé)
export async function POST(req: NextRequest) {
  const { mode } = await req.json().catch(() => ({ mode: "demo" }));
  const agentDir = path.join(process.cwd(), "tutto_legno_agent");
  const script   = mode === "full" ? "main.py" : "demo.py";

  return new Promise<NextResponse>((resolve) => {
    // Essaie d'abord le venv, sinon python3 système
    const venvPython = path.join(agentDir, "venv", "bin", "python3");
    const cmd = `"${venvPython}" "${path.join(agentDir, script)}" 2>&1 || python3 "${path.join(agentDir, script)}" 2>&1`;

    exec(cmd, { cwd: agentDir, timeout: 120_000 }, (err, stdout, stderr) => {
      const output = stdout + (stderr || "");
      if (err && !stdout) {
        resolve(NextResponse.json({ error: output || String(err) }, { status: 500 }));
      } else {
        resolve(NextResponse.json({ ok: true, log: output }));
      }
    });
  });
}
