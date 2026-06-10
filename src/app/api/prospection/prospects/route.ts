import { NextRequest, NextResponse } from "next/server";
import { getAllProspects, insertProspect } from "@/lib/prospection-db";

export async function GET() {
  try {
    const prospects = getAllProspects();
    return NextResponse.json({ prospects });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nom_entreprise, telephone, email, site_web, adresse, secteur } = body;

    if (!nom_entreprise?.trim()) {
      return NextResponse.json({ error: "nom_entreprise requis" }, { status: 400 });
    }

    const id = insertProspect({ nom_entreprise, telephone, email, site_web, adresse, secteur });

    if (id === -1) {
      return NextResponse.json({ error: "Prospect déjà existant" }, { status: 409 });
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
