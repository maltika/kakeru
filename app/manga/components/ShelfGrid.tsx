"use client";

import { useState, useEffect } from "react";
import BookCard, { Book } from "./BookCard";

interface ShelfGridProps {
  books: Book[];
  filtered?: Book[];
  onBookClick?: (book: Book) => void;
  onAddClick?: () => void;
}

const COLS = 7;
const SHELF_SLOTS = COLS;

function StarBadge({ rank, size = 28 }: { rank: number; size?: number }) {
  const s = size;
  const cx = s / 2, cy = s / 2, r = s / 2 - 1;
  const pts = Array.from({ length: 5 }, (_, i) => {
    const outerA = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const innerA = outerA + Math.PI / 5;
    const ox = cx + r * Math.cos(outerA);
    const oy = cy + r * Math.sin(outerA);
    const ix = cx + (r * 0.42) * Math.cos(innerA);
    const iy = cy + (r * 0.42) * Math.sin(innerA);
    return `${ox.toFixed(2)},${oy.toFixed(2)} ${ix.toFixed(2)},${iy.toFixed(2)}`;
  }).join(" ");

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: "block", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.22))" }}>
      <polygon points={pts} fill="#F5A623" stroke="#D4891A" strokeWidth="1" strokeLinejoin="round" />
      <text x={cx} y={cy + s * 0.13} textAnchor="middle" fontSize={s * 0.36} fontWeight="700" fill="#fff" fontFamily="sans-serif">
        {rank}
      </text>
    </svg>
  );
}

// ── Modal จัดการ My Favorite ──────────────────────────────────────────────────
function ManageFavoriteModal({
  books,
  shelfIds,
  onSave,
  onClose,
}: {
  books: Book[];
  shelfIds: (string | null)[];
  onSave: (ids: (string | null)[]) => void;
  onClose: () => void;
}) {
  const [localIds, setLocalIds] = useState<(string | null)[]>([...shelfIds]);
  const [search, setSearch] = useState("");
  const [dragSrc, setDragSrc] = useState<number | null>(null);

  const usedIds = localIds.filter(Boolean);
  const filtered = books.filter((b) =>
    search.trim() === ""
      ? true
      : b.title.includes(search) ||
      (b.title_en ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd(book: Book) {
    if (usedIds.includes(book.id)) return;
    if (localIds.length >= SHELF_SLOTS) return;
    setLocalIds((prev) => [...prev, book.id]);
  }

  function handleRemove(bookId: string) {
    setLocalIds((prev) => prev.filter((id) => id !== bookId));
  }

  function handleDragStart(idx: number) {
    setDragSrc(idx);
  }

  function handleDrop(idx: number) {
    if (dragSrc === null || dragSrc === idx) return;
    setLocalIds((prev) => {
      const next = [...prev];
      [next[dragSrc], next[idx]] = [next[idx], next[dragSrc]];
      return next;
    });
    setDragSrc(null);
  }

  const localBooks = localIds.map((id) => books.find((b) => b.id === id) ?? null);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, border: "2px solid #b8d9f5",
          width: "min(760px, 95vw)", maxHeight: "88vh",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1.5px solid #e8f4fc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#1a5fa8", margin: 0 }}>⭐ จัดการ My Favorite</p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#93c5e8" }}>×</button>
        </div>

        <div style={{ padding: "14px 20px", borderBottom: "1.5px solid #e8f4fc" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#5b9bd5", margin: "0 0 10px 0" }}>
            อันดับปัจจุบัน ({localIds.length}/{SHELF_SLOTS}) — ลากเพื่อเรียงลำดับ
          </p>
          {localIds.length === 0 ? (
            <div style={{ textAlign: "center", padding: "18px 0", color: "#b8d9f5", fontSize: 13 }}>
              ยังไม่มีรายการ — เลือกหนังสือด้านล่าง
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {localBooks.map((book, idx) =>
                book ? (
                  <div
                    key={book.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(idx)}
                    style={{
                      position: "relative", width: 72, cursor: "grab",
                      opacity: dragSrc === idx ? 0.5 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    <div style={{ position: "absolute", top: -6, left: -6, zIndex: 10 }}>
                      <StarBadge rank={idx + 1} size={26} />
                    </div>
                    <button
                      onClick={() => handleRemove(book.id)}
                      style={{
                        position: "absolute", top: 3, right: 3,
                        width: 18, height: 18, borderRadius: "50%",
                        background: "#f87171", color: "#fff",
                        border: "none", cursor: "pointer",
                        fontSize: 11, lineHeight: "18px",
                        textAlign: "center", padding: 0, zIndex: 10,
                      }}
                    >
                      ×
                    </button>
                    <BookCard book={book} onClick={() => { }} />
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px", borderBottom: "1.5px solid #e8f4fc" }}>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ค้นหาหนังสือที่จะเพิ่ม..."
            style={{
              width: "100%", padding: "9px 16px", borderRadius: 20,
              border: "1.5px solid #b8d9f5", fontSize: 14,
              color: "#1a5fa8", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ overflowY: "auto", padding: "14px 20px", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 12 }}>
            {filtered.map((book) => {
              const picked = usedIds.includes(book.id);
              const full = localIds.length >= SHELF_SLOTS && !picked;
              return (
                <div
                  key={book.id}
                  onClick={() => { if (picked) handleRemove(book.id); else if (!full) handleAdd(book); }}
                  style={{
                    position: "relative",
                    cursor: full ? "not-allowed" : "pointer",
                    opacity: full ? 0.4 : 1,
                    transition: "transform 0.15s",
                  }}
                >
                  <BookCard book={book} onClick={() => { }} />
                  {picked && (
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "rgba(94,171,224,0.3)",
                      borderRadius: 12,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#1a5fa8", background: "#fff", borderRadius: 8, padding: "2px 6px" }}>
                        ✓ {localIds.indexOf(book.id) + 1}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1.5px solid #e8f4fc", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 20, background: "#f0f8ff", color: "#5b9bd5", border: "1.5px solid #b8d9f5", cursor: "pointer", fontWeight: 600 }}>ยกเลิก</button>
          <button onClick={async () => { await onSave(localIds); onClose(); }} style={{ padding: "9px 24px", borderRadius: 20, background: "#7ec8f0", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ShelfGrid({ books, filtered, onBookClick }: ShelfGridProps) {
  const [shelfIds, setShelfIds] = useState<(string | null)[]>([]);
  const [showManage, setShowManage] = useState(false);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((ids: string[]) => { if (Array.isArray(ids)) setShelfIds([...new Set(ids)]); }) // ← เพิ่ม Set
      .catch(() => { });
  }, []);

  async function handleSaveFavorites(ids: (string | null)[]) {
    const cleanIds = [...new Set(ids.filter((id): id is string => !!id))]; // ← เพิ่ม Set
    setShelfIds(cleanIds);
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: cleanIds }),
    });
  }

  const shelfBooks = shelfIds.map((id) => books.find((b) => b.id === id) ?? null);
  const visibleBooks = filtered ?? books;
  const sortedBooks = [...visibleBooks].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <>
      <div style={{ padding: "16px 8px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── My Favorite ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#5b9bd5" }}>
              ✦ My Favorite{" "}
              <span style={{ fontSize: 11, fontWeight: 500, color: "#93c5e8" }}>
                ({shelfIds.length}/{SHELF_SLOTS})
              </span>
            </span>
            <button
              onClick={() => setShowManage(true)}
              style={{ padding: "5px 14px", borderRadius: 20, background: "#b8d9f5", color: "#1a5fa8", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
            >
              ✏️ จัดการ
            </button>
          </div>

          <div
            style={{
              background: "#e8f4fc",
              borderRadius: 16,
              border: "1.5px solid #d8edf8",
              padding: "16px 14px",
              minHeight: 160,
              overflow: "visible",  
            }}
          >
            {shelfIds.length === 0 ? (
              <div style={{ height: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#93c5e8" }}>
                <span style={{ fontSize: 32 }}>⭐</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>ยังไม่มีรายการโปรด กด จัดการ เพื่อเริ่ม</span>
              </div>
            ) : (
              <div
                style={{
                  overflowX: "auto",
                  overflowY: "visible",          // ← เผื่อ StarBadge โผล่ขอบบน
                  paddingBottom: 6,
                  paddingTop: 14,               // ← เว้นที่ StarBadge
                  // custom scrollbar ให้ดูเรียบ
                  paddingLeft: 10,    
                  scrollbarWidth: "thin",
                  scrollbarColor: "#b8d9f5 transparent",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    width: "max-content",        // ← ไม่ wrap บังคับให้ scroll
                  }}
                >
                  {shelfBooks.map((book, idx) =>
                    book ? (
                      <div
                        key={`${book.id}-${idx}`}
                        style={{
                          position: "relative",
                          width: 130,             // ← fixed width ปกไม่ย่อ
                          flexShrink: 0,
                        }}
                      >
                        <div style={{ position: "absolute", top: -8, left: -8, zIndex: 10 }}>
                          <StarBadge rank={idx + 1} size={30} />
                        </div>
                        <BookCard book={book} onClick={() => onBookClick?.(book)} />
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── ชั้นวาง ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#5b9bd5" }}>✦ ชั้นวาง</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#93c5e8", background: "#f8fbff", padding: "2px 10px", borderRadius: 12, border: "1px solid #e8f2fb" }}>
              {sortedBooks.length} เรื่อง
            </span>
          </div>

          {sortedBooks.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", gap: 10, color: "#93c5e8" }}>
              <span style={{ fontSize: 36 }}>📚</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>ยังไม่มีหนังสือในคอลเลกชัน</span>
            </div>
          ) : (
            <div style={{
              display: "grid",
              // Responsive: แถวละ 7 บนจอใหญ่ และลดลงตามขนาดจอ (iPad จะอยู่ที่ประมาณ 5-6)
              gridTemplateColumns: "repeat(auto-fill, minmax(min(120px, 100%/3), 1fr))",
              gap: "16px 10px"
            }}>
              {sortedBooks.map((book) => (
                <BookCard key={book.id} book={book} onClick={() => onBookClick?.(book)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showManage && (
        <ManageFavoriteModal
          books={books}
          shelfIds={shelfIds}
          onSave={handleSaveFavorites}
          onClose={() => setShowManage(false)}
        />
      )}
    </>
  );
}