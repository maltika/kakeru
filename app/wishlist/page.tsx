"use client";

import { useEffect, useState } from "react";
import { Book } from "@/app/manga/components/BookCard";

interface WishItem {
  bookId: string;
  volume: number;
  bought: boolean;
}

export default function WishlistPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [bought, setBought] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/books")
      .then((r) => r.json())
      .then((data) => setBooks(Array.isArray(data) ? data : data.books ?? []))
      .finally(() => setLoading(false));

    // โหลด bought state จาก localStorage
    try {
      const saved = JSON.parse(localStorage.getItem("wishlist-bought") ?? "[]");
      setBought(new Set(saved));
    } catch {}
  }, []);

  function toggleBought(key: string) {
    setBought((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      localStorage.setItem("wishlist-bought", JSON.stringify([...next]));
      return next;
    });
  }

  // ── build wishlist จาก missing_volumes ──
  const items: (WishItem & { book: Book })[] = [];
  books.forEach((book) => {
    (book.missing_volumes ?? []).forEach((vol) => {
      const key = `${book.id}-${vol}`;
      items.push({ bookId: book.id, volume: vol, bought: bought.has(key), book });
    });
  });

  const pending = items.filter((i) => !i.bought);
  const done = items.filter((i) => i.bought);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", color: "#93c5e8", fontSize: 14 }}>
      กำลังโหลด...
    </div>
  );

  return (
    <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 24, maxWidth: 700 }}>

      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a5fa8" }}>🛒 Wishlist</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#93c5e8" }}>
          เล่มที่ยังขาด — รอซื้อ {pending.length} เล่ม{done.length > 0 ? ` · ซื้อแล้ว ${done.length} เล่ม` : ""}
        </p>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#b8d9f5" }}>
          <div style={{ fontSize: 36 }}>🎉</div>
          <p style={{ margin: "8px 0 0", fontSize: 14, fontWeight: 600 }}>ไม่มีเล่มที่ขาด ครบทุกเรื่องแล้ว!</p>
        </div>
      ) : (
        <>
          {/* ── รอซื้อ ── */}
          {pending.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* group by book */}
              {Object.entries(
                pending.reduce<Record<string, typeof pending>>((acc, item) => {
                  (acc[item.bookId] ??= []).push(item);
                  return acc;
                }, {})
              ).map(([bookId, vols]) => {
                const book = vols[0].book;
                return (
                  <div key={bookId} style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #d8edf8", overflow: "hidden" }}>
                    {/* book header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #e8f4fc" }}>
                      <div style={{ width: 36, height: 54, borderRadius: 6, overflow: "hidden", background: "#eef6fd", flexShrink: 0 }}>
                        {book.cover_url
                          ? <img src={book.cover_url} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📖</div>
                        }
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a5fa8" }}>{book.title}</p>
                        {book.publisher && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#93c5e8" }}>{book.publisher}</p>}
                      </div>
                      <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "#5b9bd5", background: "#e8f4fc", padding: "3px 10px", borderRadius: 20 }}>
                        ขาด {vols.length} เล่ม
                      </span>
                    </div>
                    {/* volume chips */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "12px 16px" }}>
                      {vols.map((item) => {
                        const key = `${item.bookId}-${item.volume}`;
                        return (
                          <button
                            key={key}
                            onClick={() => toggleBought(key)}
                            style={{
                              padding: "6px 14px", borderRadius: 20, cursor: "pointer",
                              fontSize: 13, fontWeight: 700,
                              background: "#fff0f0", color: "#b91c1c",
                              border: "1.5px solid #fca5a5",
                              transition: "all 0.15s",
                            }}
                          >
                            เล่ม {item.volume}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── ซื้อแล้ว ── */}
          {done.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#93c5e8" }}>✓ ซื้อแล้ว</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {done.map((item) => {
                  const key = `${item.bookId}-${item.volume}`;
                  return (
                    <button
                      key={key}
                      onClick={() => toggleBought(key)}
                      style={{
                        padding: "6px 14px", borderRadius: 20, cursor: "pointer",
                        fontSize: 13, fontWeight: 700,
                        background: "#f0fff8", color: "#065f46",
                        border: "1.5px solid #6ee7b7",
                        textDecoration: "line-through", opacity: 0.7,
                        transition: "all 0.15s",
                      }}
                    >
                      {item.book.title} เล่ม {item.volume}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}