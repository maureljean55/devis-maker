import { NextRequest, NextResponse } from "next/server";
import { updateProspect, deleteProspect } from "@/lib/prospection-db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "id invalide" }, { status: 400 });
    }

    const body = await req.json();
    const allowed = ["message_genere", "lien_whatsapp", "statut", "date_contact", "email"];
    const fields: Record<string, string> = {};

    for (const key of allowed) {
      if (key in body) fields[key] = body[key];
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
    }

    updateProspect(id, fields);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "id invalide" }, { status: 400 });
    }
    deleteProspect(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
