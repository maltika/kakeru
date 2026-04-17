"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Sidebar from "@/app/manga/components/Sidebar";
import ShelfGrid from "@/app/manga/components/ShelfGrid";
import AddBookModal from "@/app/manga/components/AddBookModal";
import BookDetailModal from "@/app/manga/components/BookDetailModal";
import { Book, ReadStatus } from "@/app/manga/components/BookCard";
import { auth } from "@/src/lib/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";

//import MigrationButton from "@/importData"; // ปรับ path ให้ตรง


const TABS: { label: string; value: ReadStatus | "all" }[] = [
  { label: "ทั้งหมด", value: "all" },
  { label: "กำลังอ่าน", value: "reading" },
  { label: "อ่านจบแล้ว", value: "completed" },
  { label: "ยังไม่อ่าน", value: "planned" },
  { label: "หยุดอ่าน", value: "dropped" },
];

// helper: fetch พร้อมแนบ uid ทุกครั้ง
function apiFetch(url: string, uid: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-uid": uid,
      ...(options.headers ?? {}),
    },
  });
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<ReadStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // ── รอ auth พร้อม ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) router.push("/login"); // ไม่ได้ login → ไปหน้า login
    });
    return () => unsub();
  }, [router]);

  // ── ดึงข้อมูล (รอให้มี user ก่อน) ──
  useEffect(() => {
    if (!authReady || !user) return;
    async function fetchBooks() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await apiFetch("/api/books", user!.uid);
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
  }, [authReady, user]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  async function handleAdd(book: Omit<Book, "id">) {
    if (!user) return;
    const res = await apiFetch("/api/books", user.uid, {
      method: "POST",
      body: JSON.stringify(book),
    });
    if (!res.ok) throw new Error("เพิ่มไม่สำเร็จ");
    const updated = await apiFetch("/api/books", user.uid).then((r) => r.json());
    setBooks(updated);
  }

  async function handleUpdate(book: Book) {
    if (!user) return;
    const res = await apiFetch("/api/books", user.uid, {
      method: "PUT",
      body: JSON.stringify(book),
    });
    if (!res.ok) throw new Error("แก้ไขไม่สำเร็จ");
    setBooks((prev) => prev.map((b) => (b.id === book.id ? book : b)));
    setSelectedBook(book);
  }

  async function handleDelete(id: string) {
    if (!user) return;
    await apiFetch("/api/books", user.uid, {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setSelectedBook(null);
  }

  const filtered = useMemo(() => {
    return books
      .filter((b) => activeTab === "all" || b.read_status === activeTab)
      .filter((b) =>
        search.trim() === ""
          ? true
          : b.title.includes(search) || (b.title_en ?? "").toLowerCase().includes(search.toLowerCase())
      );
  }, [books, activeTab, search]);

  // รอ auth โหลด
  if (!authReady) return null;
  if (!user) return null;

  return (
    <div style={{ display: "flex", height: "100vh",overflow: "hidden",alignItems: "flex-start", backgroundColor: "#fff", backgroundImage: `linear-gradient(rgba(184,217,245,0.5) 1px,transparent 2px),linear-gradient(90deg,rgba(184,217,245,0.5) 1px,transparent 2px)`, backgroundSize: "70px 70px", overflowX: "hidden", width: "100%" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 16, paddingTop: isMobile ? 72 : 16, display: "flex", flexDirection: "column", gap: 14, minWidth: 0, maxWidth: "100%", boxSizing: "border-box", overflowX: "hidden" ,overflowY: "auto",height:"100%"}}>
        {error && <div style={{ padding: "12px 16px", backgroundColor: "#fee", color: "#c33", borderRadius: 8 }}>{error}</div>}

        <div style={{ borderRadius: 16, height: 300, background: "#b8d9f5", overflow: "hidden", position: "relative",flexShrink: 0,  }}>
          <Image src="/banner-manga.jpg" alt="Banner" fill priority style={{ objectFit: "cover", objectPosition: "center 65%" }} />
        </div>

        {/* <MigrationButton /> */}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ flex: "1", gap: 6, background: "#fff", border: "1.5px solid #b8d9f5", borderRadius: 30, padding: "6px 8px", flexWrap: "wrap" }}>
            {TABS.map((tab) => (
              <button key={tab.value} onClick={() => setActiveTab(tab.value)} style={{ flex: 1, padding: "8px 10px", borderRadius: 20, cursor: "pointer", background: activeTab === tab.value ? "#7ec8f0" : "#fff", color: activeTab === tab.value ? "#fff" : "#5b9bd5", border: "none", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 ค้นหาชื่อเรื่อง..." style={{ flex: 1, padding: "10px 16px", borderRadius: 20, border: "1.5px solid #b8d9f5", fontSize: 14, color: "#1a5fa8", outline: "none", minWidth: 0 }} />
            <button onClick={() => setShowAdd(true)} style={{ padding: "10px 16px", borderRadius: 50, background: "#b8d9f5", color: "#1a5fa8", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>
              + เพิ่มหนังสือ
            </button>
          </div>
        </div>

        {isLoading && <div style={{ textAlign: "center", padding: 40, color: "#93c5e8", fontSize: 15 }}>กำลังโหลด...</div>}

        {!isLoading && (
          <ShelfGrid books={books} filtered={filtered} onBookClick={(book) => setSelectedBook(book)} onAddClick={() => setShowAdd(true)} uid={user!.uid} />
        )}
      </main>

      {showAdd && <AddBookModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {selectedBook && <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} onDelete={handleDelete} onUpdate={handleUpdate} />}
    </div>
  );
}