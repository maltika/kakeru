// app/api/anime/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAnimes, addAnime, updateAnime, deleteAnime } from "@/src/lib/googleSheetsAnime";

export async function GET() {
  try {
    const animes = await getAnimes();
    return NextResponse.json(animes);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await addAnime(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/anime error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    await updateAnime(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await deleteAnime(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}