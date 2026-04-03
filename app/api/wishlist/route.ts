// app/api/wishlist/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getWishlist, addWishlistItem, deleteWishlistItem } from "@/src/lib/googleSheets";

export async function GET() {
  try {
    const items = await getWishlist();
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await addWishlistItem(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await deleteWishlistItem(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}