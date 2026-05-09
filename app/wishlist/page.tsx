"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth } from "@/src/lib/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import Sidebar from "@/app/Sidebar";
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
  { value: "high", label: "สำคัญมาก" },
  { value: "medium", label: "ปานกลาง" },
  { value: "low", label: "ไม่รีบ" },
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

  const publishers = useMemo(() => {
    return [...new Set(items.map((i) => i.publisher).filter(Boolean) as string[])].sort();
  }, [items]);

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

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", alignItems: "flex-start", backgroundColor: "#fff", backgroundImage: `linear-gradient(rgba(184,217,245,0.5) 1px,transparent 2px),linear-gradient(90deg,rgba(184,217,245,0.5) 1px,transparent 2px)`, backgroundSize: "70px 70px", overflowX: "hidden", width: "100%" }}>
      <Sidebar />

      <main style={{
        flex: 1, padding: 16, paddingTop: isMobile ? 72 : 16,
        display: "flex", flexDirection: "column", gap: 14,
        minWidth: 0, maxWidth: "100%", boxSizing: "border-box",
        overflowX: "hidden", overflowY: "auto", height: "100%"
      }}>

        {/* Banner */}
        <div style={{ borderRadius: 16, height: isMobile ? 180 : 300, background: "#b8d9f5", overflow: "hidden", position: "relative", flexShrink: 0 }}>
          <Image src="/banner-wishlist.jpg" alt="Banner" fill priority style={{ objectFit: "cover", objectPosition: "center 65%" }} />
        </div>

        {/* Filter + Search */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

          {/* Tab pill bar */}
          <div style={{ display: "flex", gap: 4, background: "#fff", border: "1.5px solid #b8d9f5", borderRadius: 30, padding: "5px 6px", overflowX: "auto", scrollbarWidth: "none" }}>
            {PRIORITY_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                style={{
                  flex: 1, flexShrink: 0, padding: "8px 14px", borderRadius: 20, cursor: "pointer",
                  background: activeTab === tab.value ? "#7ec8f0" : "transparent",
                  color: activeTab === tab.value ? "#fff" : "#5b9bd5",
                  border: "none", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
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
              style={{ flex: 1, padding: "10px 16px", borderRadius: 20, border: "1.5px solid #b8d9f5", fontSize: 14, color: "#1a5fa8", outline: "none", minWidth: 0 }}
            />
            <button
              onClick={() => setShowAdd(true)}
              style={{ padding: "10px 16px", borderRadius: 50, background: "#b8d9f5", color: "#1a5fa8", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}
            >
              + เพิ่มรายการ
            </button>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#93c5e8", fontSize: 15 }}>กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: 40, margin: "0 0 12px" }}>✨</p>
            <p style={{ color: "#93c5e8", fontSize: 15, fontWeight: 600 }}>
              {search ? "ไม่พบเรื่องที่ค้นหา" : "ยังไม่มีรายการใน Wishlist"}
            </p>
            {!search && (
              <button onClick={() => setShowAdd(true)} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 20, background: "#7ec8f0", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                + เพิ่มเรื่องแรก
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#5b9bd5" }}>✦ My Wishlist</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#93c5e8", background: "#f8fbff", padding: "2px 10px", borderRadius: 12, border: "1px solid #e8f2fb" }}>
                {filtered.length} เรื่อง
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(120px, 100%/3), 1fr))", gap: "16px 10px" }}>
              {filtered.map((item) => (
                <WishlistCard key={item.id} item={item} onClick={setSelectedItem} />
              ))}
            </div>
          </div>
        )}
      </main>

      {showAdd && <AddWishModal onClose={() => setShowAdd(false)} onAdd={handleAdd} publishers={publishers} />}
      {selectedItem && (
        <WishlistDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onMoveToShelf={handleMoveToShelf}
          publishers={publishers}
        />
      )}
    </div>
  );
}