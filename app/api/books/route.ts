// app/api/books/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getBooks, addBook, updateBook, deleteBook } from "@/src/lib/googleSheets";

export async function GET() {
  try {
    const books = await getBooks();
    return NextResponse.json(books);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await addBook(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/books error:", e); // เพิ่มบรรทัดนี้
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    await updateBook(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await deleteBook(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}