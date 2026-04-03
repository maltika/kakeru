import { NextRequest, NextResponse } from "next/server";
import { getFavorites, saveFavorites } from "@/src/lib/googleSheets";

export async function GET() {
  try {
    const ids = await getFavorites();
    return NextResponse.json(ids);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();
    await saveFavorites(ids);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}