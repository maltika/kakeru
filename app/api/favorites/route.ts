import { NextRequest, NextResponse } from "next/server";
import { getMangaFavorites, saveMangaFavorites } from "@/src/lib/firebase";

export async function GET(req: NextRequest) {
  const uid = req.headers.get("x-uid");
  if (!uid) return NextResponse.json([], { status: 401 });

  const ids = await getMangaFavorites(uid);
  return NextResponse.json(ids);
}

export async function POST(req: NextRequest) {
  const uid = req.headers.get("x-uid");
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = await req.json();
  await saveMangaFavorites(uid, ids);
  return NextResponse.json({ ok: true });
}