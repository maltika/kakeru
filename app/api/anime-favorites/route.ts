import { NextRequest, NextResponse } from "next/server";
import { getAnimeFavorites, saveAnimeFavorites } from "@/src/lib/firebase";

export async function GET(req: NextRequest) {
  const uid = req.headers.get("x-uid");
  if (!uid) return NextResponse.json([], { status: 401 });

  const ids = await getAnimeFavorites(uid);
  return NextResponse.json(ids);
}

export async function POST(req: NextRequest) {
  const uid = req.headers.get("x-uid");
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = await req.json();
  await saveAnimeFavorites(uid, ids);
  return NextResponse.json({ ok: true });
}