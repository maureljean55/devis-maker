import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { updateProspect } from "@/lib/prospection-db";

export async function POST(req: NextRequest) {
  try {
    const { prospect_id, to, subject, body } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: "to, subject et body sont requis" }, { status: 400 });
    }

    // Validation email basique
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || "smtp.gmail.com",
      port:   Number(process.env.SMTP_PORT) || 465,
      secure: Number(process.env.SMTP_PORT) !== 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Tutto Legno" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, "<br>"),
    });

    // Sauvegarder l'email et marquer comme contacté
    if (prospect_id) {
      const now = new Date().toISOString();
      updateProspect(prospect_id, {
        email:        to,
        statut:       "contacte",
        date_contact: now,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
