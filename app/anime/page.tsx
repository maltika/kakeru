// app/anime/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth } from "@/src/lib/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import Sidebar from "@/app/Sidebar";
import AnimeCard, { Anime, AnimeStatus, AnimeType } from "@/app/anime/components/AnimeCard";
import AddAnimeModal from "@/app/anime/components/AddAnimeModal";
import AnimeDetailModal from "@/app/anime/components/AnimeDetailModal";
import AnimeFavoriteSection from "@/app/anime/components/AnimeFavoriteSection";

function apiFetch(url: string, uid: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", "x-uid": uid, ...(options.headers ?? {}) },
  });
}

async function readApiError(res: Response) {
  try {
    const data = await res.json();
    if (data?.error) return String(data.error);
  } catch {
    // ignore json parse failure
  }
  return `Request failed (${res.status})`;
}

const STATUS_TABS: { value: AnimeStatus | "all"; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "watching", label: "กำลังดู" },
  { value: "completed", label: "ดูจบแล้ว" },
  { value: "planned", label: "ยังไม่ดู" },
  { value: "dropped", label: "หยุดดู" },
];

const TYPE_TABS: { value: AnimeType | "all"; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "series", label: "📺 Series" },
  { value: "movie", label: "🎬 Movie" },
];

export default function AnimePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Anime | null>(null);
  const [activeStatus, setActiveStatus] = useState<AnimeStatus | "all">("all");
  const [activeType, setActiveType] = useState<AnimeType | "all">("all");
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
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;
    apiFetch("/api/anime", user.uid)
      .then((r) => r.json())
      .then((data) => setAnimeList(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [authReady, user]);

  const filtered = useMemo(() => {
    return animeList
      .filter((a) => activeStatus === "all" || a.status === activeStatus)
      .filter((a) => activeType === "all" || a.type === activeType)
      .filter((a) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return a.title.toLowerCase().includes(q) || (a.title_en ?? "").toLowerCase().includes(q);
      });
  }, [animeList, activeStatus, activeType, search]);

  async function handleAdd(anime: Omit<Anime, "id">) {
    if (!user) return;
    const createRes = await apiFetch("/api/anime", user.uid, { method: "POST", body: JSON.stringify(anime) });
    if (!createRes.ok) {
      throw new Error(await readApiError(createRes));
    }
    const listRes = await apiFetch("/api/anime", user.uid);
    if (!listRes.ok) {
      throw new Error(await readApiError(listRes));
    }
    const data = await listRes.json();
    setAnimeList(Array.isArray(data) ? data : []);
  }

  async function handleUpdate(anime: Anime) {
    if (!user) return;
    const res = await apiFetch("/api/anime", user.uid, { method: "PUT", body: JSON.stringify(anime) });
    if (!res.ok) {
      throw new Error(await readApiError(res));
    }
    setAnimeList((prev) => prev.map((a) => (a.id === anime.id ? anime : a)));
    setSelected(anime);
  }

  async function handleDelete(id: string) {
    if (!user) return;
    const res = await apiFetch("/api/anime", user.uid, { method: "DELETE", body: JSON.stringify({ id }) });
    if (!res.ok) {
      throw new Error(await readApiError(res));
    }
    setAnimeList((prev) => prev.filter((a) => a.id !== id));
    setSelected(null);
  }

  if (!authReady) return null;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", alignItems: "flex-start", backgroundColor: "#fff", backgroundImage: `linear-gradient(rgba(184,217,245,0.5) 1px,transparent 2px),linear-gradient(90deg,rgba(184,217,245,0.5) 1px,transparent 2px)`, backgroundSize: "70px 70px", overflowX: "hidden", width: "100%" }}>
      <Sidebar />

      <main style={{ flex: 1, padding: 16, paddingTop: isMobile ? 72 : 16, display: "flex", flexDirection: "column", gap: 14, minWidth: 0, maxWidth: "100%", boxSizing: "border-box", overflowX: "hidden", overflowY: "auto", height: "100%" }}>

        {/* Banner */}
        <div style={{ borderRadius: 16, height: isMobile ? 180 : 300, background: "#b8d9f5", overflow: "hidden", position: "relative", flexShrink: 0 }}>
          <Image src="/banner-anime.jpg" alt="Banner" fill priority style={{ objectFit: "cover", objectPosition: "center 40%" }} />
        </div>

        {/* Filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

          {/* Status tabs */}
          <div style={{
            display: "flex", gap: 2,
            background: "#fff", border: "1.5px solid #b8d9f5",
            borderRadius: 30, padding: "4px 5px",
            overflowX: "auto", scrollbarWidth: "none",
          }}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveStatus(tab.value)}
                style={{
                  flex: 1,
                  padding: "7px 6px", borderRadius: 20, cursor: "pointer",
                  background: activeStatus === tab.value ? "#7ec8f0" : "transparent",
                  color: activeStatus === tab.value ? "#fff" : "#5b9bd5",
                  border: "none", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search + Type toggle + ปุ่มเพิ่ม */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 ค้นหาชื่อ anime..."
              style={{
                flex: 1, padding: "10px 16px", borderRadius: 20,
                border: "1.5px solid #b8d9f5", fontSize: 14,
                color: "#1a5fa8", outline: "none", minWidth: 0,
              }}
            />

            {/* Type toggle — desktop เท่านั้น */}
            {!isMobile && (
              <div style={{
                display: "flex", flexShrink: 0,
                background: "#f0f8ff", border: "1.5px solid #b8d9f5",
                borderRadius: 20, overflow: "hidden",
              }}>
                {TYPE_TABS.filter((t) => t.value !== "all").map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveType(activeType === tab.value ? "all" : tab.value)}
                    style={{
                      padding: "8px 12px", border: "none", cursor: "pointer",
                      background: activeType === tab.value ? "#5b9bd5" : "transparent",
                      color: activeType === tab.value ? "#fff" : "#5b9bd5",
                      fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
                      transition: "all 0.15s",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowAdd(true)}
              style={{
                padding: "10px 16px", borderRadius: 50,
                background: "#b8d9f5", color: "#1a5fa8",
                border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: 14,
                whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              + เพิ่ม
            </button>
          </div>

          {/* Type toggle — mobile เท่านั้น แถวแยก */}
          {isMobile && (
            <div style={{
              display: "flex",
              background: "#f0f8ff", border: "1.5px solid #b8d9f5",
              borderRadius: 20, overflow: "hidden",
            }}>
              {TYPE_TABS.filter((t) => t.value !== "all").map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveType(activeType === tab.value ? "all" : tab.value)}
                  style={{
                    flex: 1, padding: "8px 12px", border: "none", cursor: "pointer",
                    background: activeType === tab.value ? "#5b9bd5" : "transparent",
                    color: activeType === tab.value ? "#fff" : "#5b9bd5",
                    fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* My Favorite */}
        {!isLoading && user && (
          <AnimeFavoriteSection
            animeList={animeList}
            uid={user.uid}
            onAnimeClick={setSelected}
          />
        )}

        {/* Grid */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#93c5e8", fontSize: 15 }}>กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: 40, margin: "0 0 12px" }}>🎌</p>
            <p style={{ color: "#93c5e8", fontSize: 15, fontWeight: 600 }}>
              {search ? "ไม่พบ anime ที่ค้นหา" : "ยังไม่มี anime ในคอลเลกชัน"}
            </p>
            {!search && (
              <button onClick={() => setShowAdd(true)} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 20, background: "#7ec8f0", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                + เพิ่ม Anime แรก
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#5b9bd5" }}>✦ My Anime</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#93c5e8", background: "#f8fbff", padding: "2px 10px", borderRadius: 12, border: "1px solid #e8f2fb" }}>
                {filtered.length} เรื่อง
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(120px, 100%/3), 1fr))", gap: "16px 10px" }}>
              {filtered.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} onClick={setSelected} />
              ))}
            </div>
          </div>
        )}
      </main>

      {showAdd && <AddAnimeModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {selected && <AnimeDetailModal anime={selected} onClose={() => setSelected(null)} onDelete={handleDelete} onUpdate={handleUpdate} />}
    </div>
  );
}