"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import ShelfGrid from "@/components/ShelfGrid";
import AddBookModal from "@/components/AddBookModal";
import BookDetailModal from "@/components/BookDetailModal";
import { Book, ReadStatus } from "@/components/BookCard";

const TABS: { label: string; value: ReadStatus | "all" }[] = [
  { label: "ทั้งหมด", value: "all" },
  { label: "กำลังอ่าน", value: "reading" },
  { label: "อ่านจบแล้ว", value: "completed" },
  { label: "ยังไม่อ่าน", value: "planned" },
  { label: "หยุดอ่าน", value: "dropped" },
];

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<ReadStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // ── ดึงข้อมูลจาก Google Sheets ──
  useEffect(() => {
    async function fetchBooks() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/books");
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        const data: Book[] = await res.json();
        setBooks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setIsLoading(false);
      }
    }
    fetchBooks();
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── เพิ่มหนังสือ ──
  async function handleAdd(book: Omit<Book, "id">) {
    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(book),
    });
    if (!res.ok) throw new Error("เพิ่มไม่สำเร็จ");
    // reload
    const updated = await fetch("/api/books").then((r) => r.json());
    setBooks(updated);
  }

  // ── อัปเดตหนังสือ ──
  async function handleUpdate(book: Book) {
    const res = await fetch("/api/books", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(book),
    });
    if (!res.ok) throw new Error("แก้ไขไม่สำเร็จ");
    setBooks((prev) => prev.map((b) => (b.id === book.id ? book : b)));
    setSelectedBook(book);
  }

  // ── ลบหนังสือ ──
  async function handleDelete(id: string) {
    await fetch("/api/books", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setSelectedBook(null);
  }

  // ── Filter + Search ──
  const filtered = useMemo(() => {
    return books
      .filter((b) => activeTab === "all" || b.read_status === activeTab)
      .filter((b) =>
        search.trim() === ""
          ? true
          : b.title.includes(search) || (b.title_en ?? "").toLowerCase().includes(search.toLowerCase())
      );
  }, [books, activeTab, search]);

  return (
    <div style={{
      display: "flex", minHeight: "100vh", backgroundColor: "#fff",
      backgroundImage: `linear-gradient(rgba(184,217,245,0.5) 1px,transparent 2px),linear-gradient(90deg,rgba(184,217,245,0.5) 1px,transparent 2px)`,
      backgroundSize: "70px 70px",
      overflowX: "hidden",  // ← เพิ่ม
      width: "100%",
    }}>
      <Sidebar />

      <main style={{ flex: 1, padding: 16, paddingTop: isMobile ? 72 : 16, display: "flex", flexDirection: "column", gap: 14, minWidth: 0, maxWidth: "100%", boxSizing: "border-box" as const, overflowX: "hidden" }}>
      {error && <div style={{ padding: "12px 16px", backgroundColor: "#fee", color: "#c33", borderRadius: 8 }}>{error}</div>}

      {/* Banner */}
      <div style={{ borderRadius: 16, height: 300, background: "#b8d9f5", overflow: "hidden", position: "relative" }}>
        <Image src="/banner.jpg" alt="Banner" fill priority style={{ objectFit: "cover", objectPosition: "center 65%" }} />
      </div>

      {/* Filter + Search + ปุ่มเพิ่ม */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

        {/* Tabs */}
        <div style={{ flex: "1", gap: 6, background: "#fff", border: "1.5px solid #b8d9f5", borderRadius: 30, padding: "6px 8px", flexWrap: "wrap" }}>
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                flex: 1,
                padding: "8px 10px", borderRadius: 20, cursor: "pointer",
                background: activeTab === tab.value ? "#7ec8f0" : "#fff",
                color: activeTab === tab.value ? "#fff" : "#5b9bd5",
                border: "none", fontSize: 13, fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + ปุ่มเพิ่ม */}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ค้นหาชื่อเรื่อง..."
            style={{
              flex: 1, padding: "10px 16px", borderRadius: 20,
              border: "1.5px solid #b8d9f5", fontSize: 14, color: "#1a5fa8", outline: "none",
              minWidth: 0,
            }}
          />
          <button
            onClick={() => setShowAdd(true)}
            style={{
              padding: "10px 16px", borderRadius: 50, background: "#b8d9f5",
              color: "#1a5fa8", border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 14, whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            + เพิ่มหนังสือ
          </button>
        </div>

      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ textAlign: "center", padding: 40, color: "#93c5e8", fontSize: 15 }}>
          กำลังโหลด...
        </div>
      )}

      {/* Shelf */}
      {!isLoading && (
        <ShelfGrid
          books={books}        // ← ส่ง books ทั้งหมด
          filtered={filtered}  // ← ส่ง filtered แยก
          onBookClick={(book) => setSelectedBook(book)}
          onAddClick={() => setShowAdd(true)}
        />
      )}
    </main>

      {/* Modals */ }
  { showAdd && <AddBookModal onClose={() => setShowAdd(false)} onAdd={handleAdd} /> }

  {
    selectedBook && (
      <BookDetailModal
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    )
  }
    </div >
  );
}
