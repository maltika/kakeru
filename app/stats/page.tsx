"use client";

import { useEffect, useState } from "react";
import { Book } from "@/app/manga/components/BookCard";

// ── helpers ──────────────────────────────────────────────────────────────────

function avg(nums: number[]) {
    if (!nums.length) return 0;
    return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function genreCount(books: Book[]) {
    const map: Record<string, number> = {};
    books.forEach((b) => {
        if (!b.genre) return;
        b.genre.split(/[,،、，]/).forEach((g) => {
            const t = g.trim();
            if (t) map[t] = (map[t] ?? 0) + 1;
        });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div style={{
            background: "#fff", borderRadius: 16, border: "1.5px solid #d8edf8",
            padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4,
        }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#93c5e8" }}>{label}</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#1a5fa8", lineHeight: 1.1 }}>{value}</span>
            {sub && <span style={{ fontSize: 11, color: "#b8d9f5" }}>{sub}</span>}
        </div>
    );
}

// ── Mini Bar Chart ─────────────────────────────────────────────────────────────
function BarChart({ data }: { data: [string, number][] }) {
    const max = Math.max(...data.map((d) => d[1]), 1);
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.map(([label, count]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#5b9bd5", minWidth: 90, textAlign: "right", flexShrink: 0 }}>{label}</span>
                    <div style={{ flex: 1, height: 14, background: "#e8f4fc", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                            width: `${(count / max) * 100}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #7ec8f0, #5b9bd5)",
                            borderRadius: 99,
                            transition: "width 0.4s ease",
                        }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1a5fa8", minWidth: 20 }}>{count}</span>
                </div>
            ))}
        </div>
    );
}

// ── Recently Updated ──────────────────────────────────────────────────────────
function RecentCard({ book }: { book: Book & { updated_at?: string } }) {
    return (
        <div style={{
            display: "flex", gap: 12, alignItems: "center",
            padding: "10px 14px", background: "#fff",
            borderRadius: 14, border: "1.5px solid #d8edf8",
        }}>
            <div style={{
                width: 44, height: 66, borderRadius: 8, overflow: "hidden",
                background: "#eef6fd", flexShrink: 0,
                border: "1.5px solid #b8d9f5",
            }}>
                {book.cover_url
                    ? <img src={book.cover_url} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📖</div>
                }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a5fa8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.title}</p>
                {book.title_en && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#7ab0d4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.title_en}</p>}
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#93c5e8" }}>
                    อ่านถึงเล่ม <strong style={{ color: "#5b9bd5" }}>{book.read_volume ?? "—"}</strong>
                    {book.owned_volumes ? ` / ${book.owned_volumes}` : ""}
                </p>
            </div>
            {book.updated_at && (
                <span style={{ fontSize: 10, color: "#b8d9f5", flexShrink: 0 }}>
                    {new Date(book.updated_at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                </span>
            )}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StatsPage() {
    const [books, setBooks] = useState<(Book & { updated_at?: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/books")
            .then((r) => r.json())
            .then((data) => setBooks(Array.isArray(data) ? data : data.books ?? []))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", color: "#93c5e8", fontSize: 14 }}>
            กำลังโหลด...
        </div>
    );

    // ── คำนวณ ──
    const total = books.length;
    const manga = books.filter((b) => b.type === "manga").length;
    const novel = books.filter((b) => b.type === "novel").length;
    const totalOwned = books.reduce((s, b) => s + (b.owned_volumes ?? 0), 0);
    const totalRead = books.reduce((s, b) => s + (b.read_volume ?? 0), 0);
    const ratings = books.map((b) => b.rating).filter((r): r is number => r !== undefined);
    const avgRating = avg(ratings);
    const completed = books.filter((b) => b.read_status === "completed").length;
    const reading = books.filter((b) => b.read_status === "reading").length;
    const genres = genreCount(books);
    const recent = [...books]
        .filter((b) => b.updated_at)
        .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
        .slice(0, 5);

    return (
        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 28, maxWidth: 800 }}>

            {/* ── Header ── */}
            <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a5fa8" }}>📊 Statistics</h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#93c5e8" }}>ภาพรวมคอลเลกชันทั้งหมด</p>
            </div>

            {/* ── Stat Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                <StatCard label="เรื่องทั้งหมด" value={total} />
                <StatCard label="มังงะ / นิยาย" value={`${manga} / ${novel}`} />
                <StatCard label="เล่มที่มี" value={totalOwned} sub="เล่มรวมทุกเรื่อง" />
                <StatCard label="อ่านแล้ว" value={totalRead} sub={`${totalOwned > 0 ? Math.round((totalRead / totalOwned) * 100) : 0}% ของที่มี`} />
                <StatCard label="คะแนนเฉลี่ย" value={avgRating > 0 ? `${avgRating}/10` : "—"} sub={`จาก ${ratings.length} เรื่อง`} />
                <StatCard label="อ่านจบแล้ว" value={completed} sub={`กำลังอ่าน ${reading} เรื่อง`} />
            </div>

            {/* ── Genre Chart ── */}
            {genres.length > 0 && (
                <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #d8edf8", padding: "20px 24px" }}>
                    <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1a5fa8" }}>แนวเรื่องยอดนิยม</p>
                    <BarChart data={genres} />
                </div>
            )}

            {/* ── Read Status Breakdown ── */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #d8edf8", padding: "20px 24px" }}>
                <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1a5fa8" }}>สถานะการอ่าน</p>
                <BarChart data={[
                    ["อ่านจบแล้ว", books.filter((b) => b.read_status === "completed").length],
                    ["กำลังอ่าน", books.filter((b) => b.read_status === "reading").length],
                    ["ยังไม่อ่าน", books.filter((b) => b.read_status === "planned").length],
                    ["หยุดอ่าน", books.filter((b) => b.read_status === "dropped").length],
                ]} />
            </div>

            {/* ── Recently Updated ── */}
            {recent.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a5fa8" }}>🕐 อัปเดตล่าสุด</p>
                    {recent.map((book) => <RecentCard key={book.id} book={book} />)}
                </div>
            )}

        </div>
    );
}