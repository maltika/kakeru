import { NextRequest, NextResponse } from "next/server";
import { getAnimeFavorites, saveAnimeFavorites } from "@/src/lib/googleSheetsAnime";

export async function GET() {
  try {
    const ids = await getAnimeFavorites();
    return NextResponse.json(ids);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();
    await saveAnimeFavorites(ids);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}