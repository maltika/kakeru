"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth } from "@/src/lib/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import Sidebar from "@/app/manga/components/Sidebar";
import WishlistCard, { WishlistItem, WishlistPriority } from "@/app/wishlist/components/Wishlistcard";
import AddWishModal from "@/app/wishlist/components/Addwishmodal";
import WishlistDetailModal from "@/app/wishlist/components/Wishlistdetailmodal";

function apiFetch(url: string, uid: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", "x-uid": uid, ...(options.headers ?? {}) },
  });
}

const PRIORITY_TABS: { value: WishlistPriority | "all"; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "high", label: "🔥 สำคัญมาก" },
  { value: "medium", label: "⭐ ปานกลาง" },
  { value: "low", label: "💤 ไม่รีบ" },
];

export default function WishlistPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  const [activeTab, setActiveTab] = useState<WishlistPriority | "all">("all");
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) router.push("/login");
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;
    apiFetch("/api/wishlist", user.uid)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [authReady, user]);

  const filtered = useMemo(() => {
    let list = items;
    if (activeTab !== "all") list = list.filter((i) => i.priority === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.title.toLowerCase().includes(q) || i.title_en?.toLowerCase().includes(q));
    }
    return list;
  }, [items, activeTab, search]);

  async function handleAdd(item: Omit<WishlistItem, "id" | "added_at">) {
    if (!user) return;
    await apiFetch("/api/wishlist", user.uid, { method: "POST", body: JSON.stringify(item) });
    const data = await apiFetch("/api/wishlist", user.uid).then((r) => r.json());
    setItems(Array.isArray(data) ? data : []);
  }

  async function handleUpdate(item: WishlistItem) {
    if (!user) return;
    await apiFetch("/api/wishlist", user.uid, { method: "PUT", body: JSON.stringify(item) });
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    setSelectedItem(item);
  }

  async function handleDelete(id: string) {
    if (!user) return;
    await apiFetch("/api/wishlist", user.uid, { method: "DELETE", body: JSON.stringify({ id }) });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedItem(null);
  }

  // ── ย้ายจาก Wishlist → My Manga ──
  async function handleMoveToShelf(wishItem: WishlistItem) {
    if (!user) return;

    const newBook = {
      title: wishItem.title,
      title_en: wishItem.title_en ?? "",
      type: wishItem.type,
      publisher: wishItem.publisher ?? "",
      cover_url: wishItem.cover_url ?? "",
      series_status: "ongoing" as const,
      format: "physical" as const,
      total_volumes: wishItem.volumes_total,
      owned_volumes: undefined,
      read_volume: undefined,
      read_status: "planned" as const,
      notes: wishItem.notes ?? "",
    };

    await apiFetch("/api/books", user.uid, {
      method: "POST",
      body: JSON.stringify(newBook),
    });

    // ลบออกจาก wishlist
    await handleDelete(wishItem.id);
  }

  if (!authReady) return null;

  const counts = {
    all: items.length,
    high: items.filter((i) => i.priority === "high").length,
    medium: items.filter((i) => i.priority === "medium").length,
    low: items.filter((i) => i.priority === "low").length,
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", alignItems: "flex-start", backgroundColor: "#fff", backgroundImage: `linear-gradient(rgba(184,217,245,0.5) 1px,transparent 2px),linear-gradient(90deg,rgba(184,217,245,0.5) 1px,transparent 2px)`, backgroundSize: "70px 70px", overflowX: "hidden", width: "100%" }}>
      <Sidebar />

      <main style={{ flex: 1, padding: isMobile ? "72px 16px 24px" : "24px 24px 24px", maxWidth: "100%", overflowX: "hidden", overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
        <div style={{
          borderRadius: 16,
          height: isMobile ? 180 : 300,
          background: "#b8d9f5",
          overflow: "hidden",
          position: "relative",
          flexShrink: 0
        }}>
          <Image src="/banner-anime.jpg" alt="Banner" fill priority style={{ objectFit: "cover", objectPosition: "center 65%" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", marginBottom: 20, marginTop: 16, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a5fa8" }}>✨ My Wishlist</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#93c5e8" }}>
              {items.length} เรื่องที่อยากได้
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{ padding: "10px 20px", borderRadius: 20, background: "#7ec8f0", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(126,200,240,0.35)" }}
          >
            + เพิ่มรายการ
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ค้นหาชื่อเรื่อง..."
            style={{ width: "100%", padding: "10px 16px", borderRadius: 14, border: "1.5px solid #b8d9f5", fontSize: 14, color: "#1a5fa8", outline: "none", boxSizing: "border-box", background: "#fff" }}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {PRIORITY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: `1.5px solid ${activeTab === tab.value ? "#7ec8f0" : "#b8d9f5"}`,
                background: activeTab === tab.value ? "#7ec8f0" : "#fff",
                color: activeTab === tab.value ? "#fff" : "#7ab0d4",
              }}
            >
              {tab.label}
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>
                ({counts[tab.value as keyof typeof counts] ?? 0})
              </span>
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#93c5e8" }}>กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: 40, margin: "0 0 12px" }}>✨</p>
            <p style={{ color: "#93c5e8", fontSize: 15, fontWeight: 600 }}>
              {search ? "ไม่พบเรื่องที่ค้นหา" : "ยังไม่มีรายการใน Wishlist"}
            </p>
            {!search && (
              <button
                onClick={() => setShowAdd(true)}
                style={{ marginTop: 16, padding: "10px 24px", borderRadius: 20, background: "#7ec8f0", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}
              >
                + เพิ่มเรื่องแรก
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 16,
          }}>
            {filtered.map((item) => (
              <WishlistCard key={item.id} item={item} onClick={setSelectedItem} />
            ))}
          </div>
        )}
      </main>

      {showAdd && <AddWishModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {selectedItem && (
        <WishlistDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onMoveToShelf={handleMoveToShelf}
        />
      )}
    </div>
  );
}