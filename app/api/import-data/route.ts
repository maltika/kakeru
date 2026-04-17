import { NextResponse } from "next/server";
import { getDb } from "@/src/lib/firebase"; // ไฟล์ Admin SDK ของคุณ
import data from "@/data.json";

export async function GET() {
    try {
        const db = getDb();
        const batch = db.batch();
        const booksCol = db.collection("books");

        data.forEach((book) => {
            const docRef = booksCol.doc(); // สุ่ม ID ใหม่ให้ทุกเรื่อง
            batch.set(docRef, {
                ...book,
                createdAt: new Date().toISOString()
            });
        });

        await batch.commit();
        return NextResponse.json({ message: `นำเข้ามังงะสำเร็จ ${data.length} เรื่อง!` });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}