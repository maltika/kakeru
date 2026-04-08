"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Sidebar from "@/app/manga/components/Sidebar";
import type { Anime, WatchStatus, AnimeStatus } from "@/src/lib/googleSheetsAnime";

export type { Anime, WatchStatus, AnimeStatus };

// ── Constants ──────────────────────────────────────────────────────────────────
const TABS: { label: string; value: WatchStatus | "all" }[] = [
  { label: "ทั้งหมด", value: "all" },
  { label: "กำลังดู", value: "watching" },
  { label: "ดูจบแล้ว", value: "completed" },
  { label: "ยังไม่ดู", value: "planned" },
  { label: "หยุดดู", value: "dropped" },
];

const watchStatusLabel: Record<WatchStatus, string> = {
  watching: "กำลังดู",
  completed: "ดูจบแล้ว",
  planned: "ยังไม่ดู",
  dropped: "หยุดดู",
};

const seriesStatusLabel: Record<AnimeStatus, string> = {
  ongoing: "กำลังออกอากาศ",
  completed: "จบแล้ว",
  hiatus: "หยุดออกอากาศ",
  upcoming: "เร็วๆ นี้",
};

const watchStatusColor: Record<WatchStatus, { bg: string; color: string; border: string }> = {
  watching:  { bg: "#e0f2fe", color: "#0369a1", border: "#7dd3fc" },
  completed: { bg: "#dcfce7", color: "#166534", border: "#86efac" },
  planned:   { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
  dropped:   { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
};

const SHELF_SLOTS = 7;

// ── Design tokens ──────────────────────────────────────────────────────────────
const infoBlock = {
  padding: "14px 16px",
  background: "#f8fbff",
  borderRadius: 14,
  border: "1.5px solid #e8f2fb",
};

const labelStyle = {
  fontSize: 11, fontWeight: 700, color: "#93c5e8",
  marginBottom: 4, display: "block" as const,
  letterSpacing: "0.04em", textTransform: "uppercase" as const,
};

const inputStyle = {
  width: "100%", padding: "7px 11px", borderRadius: 9,
  border: "1.5px solid #d8edf8", fontSize: 13, color: "#1a5fa8",
  outline: "none", boxSizing: "border-box" as const, background: "#fff",
};

const selectStyle = { ...inputStyle };

// ── StarBadge (เหมือน Manga) ──────────────────────────────────────────────────
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
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}
      style={{ display: "block", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.22))" }}>
      <polygon points={pts} fill="#F5A623" stroke="#D4891A" strokeWidth="1" strokeLinejoin="round" />
      <text x={cx} y={cy + s * 0.13} textAnchor="middle" fontSize={s * 0.36}
        fontWeight="700" fill="#fff" fontFamily="sans-serif">{rank}</text>
    </svg>
  );
}

// ── AnimeCard ──────────────────────────────────────────────────────────────────
function AnimeCard({ anime, onClick }: { anime: Anime; onClick: () => void }) {
  const sc = watchStatusColor[anime.watch_status];
  return (
    <div onClick={onClick} style={{
      borderRadius: 16, overflow: "hidden", background: "#fff",
      border: "1.5px solid #e8f2fb", cursor: "pointer",
      transition: "all 0.2s ease", boxShadow: "0 2px 8px rgba(124,194,240,0.1)",
      display: "flex", flexDirection: "column",
    }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(124,194,240,0.25)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(124,194,240,0.1)";
      }}
    >
      <div style={{ position: "relative", aspectRatio: "2/3", background: "#eef6fd" }}>
        {anime.cover_url ? (
          <Image src={anime.cover_url} alt={anime.title} fill style={{ objectFit: "cover" }} unoptimized />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 32 }}>🎌</div>
        )}
        <div style={{
          position: "absolute", top: 8, left: 8,
          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
          background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
        }}>{watchStatusLabel[anime.watch_status]}</div>
        {anime.rating && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
            background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a",
          }}>⭐ {anime.rating}</div>
        )}
      </div>
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 700, color: "#1a5fa8", lineHeight: 1.3,
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{anime.title}</p>
        {anime.watched_episodes !== undefined && anime.total_episodes && (
          <p style={{ margin: 0, fontSize: 11, color: "#93c5e8" }}>ตอน {anime.watched_episodes}/{anime.total_episodes}</p>
        )}
        {anime.watch_source && (
          <p style={{ margin: 0, fontSize: 11, color: "#7ab0d4", fontWeight: 600 }}>📺 {anime.watch_source}</p>
        )}
      </div>
    </div>
  );
}

// ── AniList Search ─────────────────────────────────────────────────────────────
interface AniListResult {
  id: number;
  title: { romaji: string; english: string | null; native: string };
  coverImage: { large: string };
  episodes: number | null;
  status: string;
  genres: string[];
}

async function searchAniList(query: string): Promise<AniListResult[]> {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query ($search: String) {
        Page(perPage: 8) {
          media(search: $search, type: ANIME) {
            id title { romaji english native }
            coverImage { large } episodes status genres
          }
        }
      }`,
      variables: { search: query },
    }),
  });
  const data = await res.json();
  return data?.data?.Page?.media || [];
}

// ── ManageFavoriteModal ────────────────────────────────────────────────────────
function ManageFavoriteModal({ animes, shelfIds, onSave, onClose }: {
  animes: Anime[];
  shelfIds: string[];
  onSave: (ids: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [localIds, setLocalIds] = useState<string[]>([...shelfIds]);
  const [search, setSearch] = useState("");
  const [dragSrc, setDragSrc] = useState<number | null>(null);

  const usedIds = localIds;
  const filtered = animes.filter((a) =>
    search.trim() === "" ? true :
      a.title.includes(search) || (a.title_en ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd(anime: Anime) {
    if (usedIds.includes(anime.id)) return;
    if (localIds.length >= SHELF_SLOTS) return;
    setLocalIds((prev) => [...prev, anime.id]);
  }

  function handleRemove(id: string) {
    setLocalIds((prev) => prev.filter((x) => x !== id));
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

  const localAnimes = localIds.map((id) => animes.find((a) => a.id === id) ?? null);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, backdropFilter: "blur(3px)",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 20, border: "2px solid #b8d9f5",
        width: "min(760px, 95vw)", maxHeight: "88vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1.5px solid #e8f4fc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#1a5fa8", margin: 0 }}>⭐ จัดการ My Favorite Anime</p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#93c5e8" }}>×</button>
        </div>

        {/* Current picks */}
        <div style={{ padding: "14px 20px", borderBottom: "1.5px solid #e8f4fc" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#5b9bd5", margin: "0 0 10px 0" }}>
            อันดับปัจจุบัน ({localIds.length}/{SHELF_SLOTS}) — ลากเพื่อเรียงลำดับ
          </p>
          {localIds.length === 0 ? (
            <div style={{ textAlign: "center", padding: "18px 0", color: "#b8d9f5", fontSize: 13 }}>ยังไม่มีรายการ — เลือก anime ด้านล่าง</div>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {localAnimes.map((anime, idx) =>
                anime ? (
                  <div key={`${anime.id}-${idx}`} draggable
                    onDragStart={() => setDragSrc(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(idx)}
                    style={{
                      position: "relative", width: 72, cursor: "grab",
                      opacity: dragSrc === idx ? 0.5 : 1, transition: "opacity 0.15s",
                    }}
                  >
                    <div style={{ position: "absolute", top: -6, left: -6, zIndex: 10 }}>
                      <StarBadge rank={idx + 1} size={26} />
                    </div>
                    <button onClick={() => handleRemove(anime.id)} style={{
                      position: "absolute", top: 3, right: 3,
                      width: 18, height: 18, borderRadius: "50%",
                      background: "#f87171", color: "#fff", border: "none",
                      cursor: "pointer", fontSize: 11, lineHeight: "18px",
                      textAlign: "center", padding: 0, zIndex: 10,
                    }}>×</button>
                    <div style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "2/3", background: "#eef6fd", position: "relative" }}>
                      {anime.cover_url
                        ? <Image src={anime.cover_url} alt={anime.title} fill style={{ objectFit: "cover" }} unoptimized />
                        : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 20 }}>🎌</div>
                      }
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ padding: "12px 20px", borderBottom: "1.5px solid #e8f4fc" }}>
          <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ค้นหา anime ที่จะเพิ่ม..."
            style={{ width: "100%", padding: "9px 16px", borderRadius: 20, border: "1.5px solid #b8d9f5", fontSize: 14, color: "#1a5fa8", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", padding: "14px 20px", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 12 }}>
            {filtered.map((anime) => {
              const picked = usedIds.includes(anime.id);
              const full = localIds.length >= SHELF_SLOTS && !picked;
              return (
                <div key={anime.id}
                  onClick={() => { if (picked) handleRemove(anime.id); else if (!full) handleAdd(anime); }}
                  style={{ position: "relative", cursor: full ? "not-allowed" : "pointer", opacity: full ? 0.4 : 1 }}
                >
                  <div style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "2/3", background: "#eef6fd", position: "relative" }}>
                    {anime.cover_url
                      ? <Image src={anime.cover_url} alt={anime.title} fill style={{ objectFit: "cover" }} unoptimized />
                      : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 24 }}>🎌</div>
                    }
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "#1a5fa8", fontWeight: 600, lineHeight: 1.3,
                    overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {anime.title}
                  </p>
                  {picked && (
                    <div style={{
                      position: "absolute", inset: 0, background: "rgba(94,171,224,0.3)",
                      borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#1a5fa8", background: "#fff", borderRadius: 8, padding: "2px 6px" }}>
                        ✓ {localIds.indexOf(anime.id) + 1}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1.5px solid #e8f4fc", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 20, background: "#f0f8ff", color: "#5b9bd5", border: "1.5px solid #b8d9f5", cursor: "pointer", fontWeight: 600 }}>ยกเลิก</button>
          <button onClick={async () => { await onSave(localIds); onClose(); }} style={{ padding: "9px 24px", borderRadius: 20, background: "#7ec8f0", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

// ── AddAnimeModal ──────────────────────────────────────────────────────────────
function AddAnimeModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (anime: Omit<Anime, "id">) => Promise<void>;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AniListResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<AniListResult | null>(null);
  const [form, setForm] = useState<Omit<Anime, "id">>({ title: "", series_status: "ongoing", watch_status: "planned" });
  const [saving, setSaving] = useState(false);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try { setSearchResults(await searchAniList(searchQuery)); }
    finally { setSearching(false); }
  }

  function selectResult(r: AniListResult) {
    setSelected(r);
    const statusMap: Record<string, AnimeStatus> = {
      FINISHED: "completed", RELEASING: "ongoing",
      NOT_YET_RELEASED: "upcoming", CANCELLED: "hiatus", HIATUS: "hiatus",
    };
    setForm({
      title: r.title.native || r.title.romaji,
      title_en: r.title.english || r.title.romaji,
      cover_url: r.coverImage.large,
      series_status: statusMap[r.status] || "ongoing",
      total_episodes: r.episodes || undefined,
      genre: r.genres?.slice(0, 3).join(", ") || undefined,
      watch_status: "planned",
      anilist_id: r.id,
    });
    setSearchResults([]);
  }

  function set<K extends keyof Omit<Anime, "id">>(key: K, value: Omit<Anime, "id">[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.title) return;
    setSaving(true);
    try { await onAdd(form); onClose(); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 24, border: "2px solid #d8edf8", width: "95%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 32px 64px -12px rgba(124,194,240,0.25)" }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a5fa8" }}>🎌 เพิ่ม Anime</h2>

        <div style={infoBlock}>
          <label style={labelStyle}>ค้นหาจาก AniList</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...inputStyle, flex: 1 }} value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="พิมพ์ชื่อ anime..." />
            <button onClick={handleSearch} disabled={searching} style={{ padding: "7px 16px", borderRadius: 9, background: "linear-gradient(135deg, #7ec8f0, #5b9bd5)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
              {searching ? "..." : "ค้นหา"}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              {searchResults.map((r) => (
                <div key={r.id} onClick={() => selectResult(r)} style={{ display: "flex", gap: 10, padding: "8px 10px", borderRadius: 10, border: "1.5px solid #d8edf8", cursor: "pointer", background: "#f8fbff", alignItems: "center" }}>
                  {r.coverImage?.large && <img src={r.coverImage.large} alt="" style={{ width: 36, height: 52, objectFit: "cover", borderRadius: 6 }} />}
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a5fa8" }}>{r.title.native || r.title.romaji}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#93c5e8" }}>{r.title.english || r.title.romaji}</p>
                    {r.episodes && <p style={{ margin: 0, fontSize: 11, color: "#7ab0d4" }}>{r.episodes} ตอน</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {selected && <p style={{ margin: "8px 0 0", fontSize: 12, color: "#5b9bd5", fontWeight: 600 }}>✓ เลือก: {selected.title.native || selected.title.romaji}</p>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div><label style={labelStyle}>ชื่อเรื่อง *</label><input style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="ชื่อภาษาไทย/ญี่ปุ่น" /></div>
          <div><label style={labelStyle}>ชื่อภาษาอังกฤษ</label><input style={inputStyle} value={form.title_en || ""} onChange={(e) => set("title_en", e.target.value)} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={labelStyle}>สถานะเรื่อง</label>
              <select style={selectStyle} value={form.series_status} onChange={(e) => set("series_status", e.target.value as AnimeStatus)}>
                <option value="ongoing">กำลังออกอากาศ</option><option value="completed">จบแล้ว</option>
                <option value="hiatus">หยุดออกอากาศ</option><option value="upcoming">เร็วๆ นี้</option>
              </select></div>
            <div><label style={labelStyle}>สถานะการดู</label>
              <select style={selectStyle} value={form.watch_status} onChange={(e) => set("watch_status", e.target.value as WatchStatus)}>
                <option value="planned">ยังไม่ดู</option><option value="watching">กำลังดู</option>
                <option value="completed">ดูจบแล้ว</option><option value="dropped">หยุดดู</option>
              </select></div>
            <div><label style={labelStyle}>ตอนทั้งหมด</label><input style={inputStyle} type="number" value={form.total_episodes || ""} onChange={(e) => set("total_episodes", e.target.value ? Number(e.target.value) : undefined)} /></div>
            <div><label style={labelStyle}>ดูแล้วกี่ตอน</label><input style={inputStyle} type="number" value={form.watched_episodes || ""} onChange={(e) => set("watched_episodes", e.target.value ? Number(e.target.value) : undefined)} /></div>
            <div><label style={labelStyle}>จำนวน Season</label><input style={inputStyle} type="number" value={form.total_seasons || ""} onChange={(e) => set("total_seasons", e.target.value ? Number(e.target.value) : undefined)} /></div>
            <div><label style={labelStyle}>Season ปัจจุบัน</label><input style={inputStyle} type="number" value={form.current_season || ""} onChange={(e) => set("current_season", e.target.value ? Number(e.target.value) : undefined)} /></div>
            <div><label style={labelStyle}>เรท (1-10)</label><input style={inputStyle} type="number" min={1} max={10} value={form.rating || ""} onChange={(e) => set("rating", e.target.value ? Number(e.target.value) : undefined)} /></div>
            <div><label style={labelStyle}>แนวเรื่อง</label><input style={inputStyle} value={form.genre || ""} onChange={(e) => set("genre", e.target.value)} /></div>
          </div>
          <div><label style={labelStyle}>แหล่งที่ดู</label><input style={inputStyle} value={form.watch_source || ""} onChange={(e) => set("watch_source", e.target.value)} placeholder="เช่น Netflix, Crunchyroll, iQIYI..." /></div>
          <div><label style={labelStyle}>หมายเหตุ</label><textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} /></div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 22, fontWeight: 700, fontSize: 13, background: "#f0f8ff", color: "#5b9bd5", border: "1.5px solid #d8edf8", cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={handleSave} disabled={saving || !form.title} style={{ padding: "9px 24px", borderRadius: 22, fontWeight: 700, fontSize: 13, background: saving ? "#b8d9f5" : "linear-gradient(135deg, #7ec8f0, #5b9bd5)", color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 4px 12px #7ec8f055" }}>
            {saving ? "กำลังบันทึก..." : "💾 บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AnimeDetailModal ───────────────────────────────────────────────────────────
function AnimeDetailModal({ anime, onClose, onDelete, onUpdate }: {
  anime: Anime; onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (anime: Anime) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Anime>(anime);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Anime>(key: K, value: Anime[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try { await onUpdate(form); setEditing(false); }
    finally { setSaving(false); }
  }

  const sc = watchStatusColor[anime.watch_status];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 28, border: "2px solid #d8edf8", width: "95%", maxWidth: 800, maxHeight: "90vh", display: "flex", gap: 24, padding: 28, position: "relative", boxShadow: "0 32px 64px -12px rgba(124,194,240,0.25)", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ flex: "0 0 30%", position: "relative", aspectRatio: "2/3", borderRadius: 18, overflow: "hidden", background: "#eef6fd", alignSelf: "flex-start", boxShadow: "0 8px 24px rgba(124,194,240,0.2)" }}>
          {form.cover_url
            ? <Image src={form.cover_url} alt={form.title} fill style={{ objectFit: "cover" }} unoptimized />
            : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 48 }}>🎌</div>
          }
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <input style={{ ...inputStyle, fontSize: 18, fontWeight: 700 }} value={form.title} onChange={(e) => set("title", e.target.value)} />
              <input style={inputStyle} value={form.title_en || ""} onChange={(e) => set("title_en", e.target.value)} placeholder="ชื่อภาษาอังกฤษ" />
            </div>
          ) : (
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a5fa8", lineHeight: 1.3 }}>{anime.title}</h1>
              {anime.title_en && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#7ab0d4" }}>{anime.title_en}</p>}
            </div>
          )}

          <div style={{ ...infoBlock, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {editing ? (
              <>
                <div><label style={labelStyle}>สถานะเรื่อง</label>
                  <select style={selectStyle} value={form.series_status} onChange={(e) => set("series_status", e.target.value as AnimeStatus)}>
                    <option value="ongoing">กำลังออกอากาศ</option><option value="completed">จบแล้ว</option>
                    <option value="hiatus">หยุดออกอากาศ</option><option value="upcoming">เร็วๆ นี้</option>
                  </select></div>
                <div><label style={labelStyle}>แนวเรื่อง</label><input style={inputStyle} value={form.genre || ""} onChange={(e) => set("genre", e.target.value)} /></div>
                <div><label style={labelStyle}>แหล่งที่ดู</label><input style={inputStyle} value={form.watch_source || ""} onChange={(e) => set("watch_source", e.target.value)} /></div>
              </>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: 13 }}><span style={{ color: "#93c5e8", fontWeight: 600 }}>สถานะเรื่อง</span><br /><strong style={{ color: "#1a5fa8" }}>{seriesStatusLabel[anime.series_status]}</strong></p>
                <p style={{ margin: 0, fontSize: 13 }}><span style={{ color: "#93c5e8", fontWeight: 600 }}>แนวเรื่อง</span><br /><strong style={{ color: "#1a5fa8" }}>{anime.genre || "—"}</strong></p>
                {anime.watch_source && <p style={{ margin: 0, fontSize: 13 }}><span style={{ color: "#93c5e8", fontWeight: 600 }}>แหล่งที่ดู</span><br /><strong style={{ color: "#1a5fa8" }}>📺 {anime.watch_source}</strong></p>}
              </>
            )}
          </div>

          <div style={{ ...infoBlock, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
            {editing ? (
              <>
                <div><label style={labelStyle}>ตอนทั้งหมด</label><input style={inputStyle} type="number" value={form.total_episodes || ""} onChange={(e) => set("total_episodes", e.target.value ? Number(e.target.value) : undefined)} /></div>
                <div><label style={labelStyle}>ดูแล้ว</label><input style={inputStyle} type="number" value={form.watched_episodes || ""} onChange={(e) => set("watched_episodes", e.target.value ? Number(e.target.value) : undefined)} /></div>
                <div><label style={labelStyle}>Season ทั้งหมด</label><input style={inputStyle} type="number" value={form.total_seasons || ""} onChange={(e) => set("total_seasons", e.target.value ? Number(e.target.value) : undefined)} /></div>
                <div><label style={labelStyle}>Season ปัจจุบัน</label><input style={inputStyle} type="number" value={form.current_season || ""} onChange={(e) => set("current_season", e.target.value ? Number(e.target.value) : undefined)} /></div>
              </>
            ) : (
              [
                { val: anime.total_episodes, label: "ตอนทั้งหมด", color: "#1a5fa8" },
                { val: anime.watched_episodes, label: "ดูแล้ว", color: "#5b9bd5" },
                { val: anime.total_seasons, label: "Season", color: "#7ec8f0" },
                { val: anime.current_season, label: "Season ล่าสุด", color: "#93c5e8" },
              ].map(({ val, label, color }) => (
                <div key={label} style={{ textAlign: "center", padding: "6px 0", borderRadius: 10, background: "#fff", border: "1.5px solid #e8f2fb" }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color }}>{val ?? "—"}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "#93c5e8", fontWeight: 600 }}>{label}</p>
                </div>
              ))
            )}
          </div>

          {!editing && anime.watched_episodes !== undefined && anime.total_episodes && (
            <div style={infoBlock}>
              <label style={labelStyle}>ความคืบหน้า</label>
              <div style={{ background: "#e8f2fb", borderRadius: 99, height: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 99, width: `${Math.min(100, (anime.watched_episodes / anime.total_episodes) * 100)}%`, background: "linear-gradient(90deg, #7ec8f0, #5b9bd5)", transition: "width 0.5s ease" }} />
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#93c5e8", textAlign: "right" }}>
                {anime.watched_episodes}/{anime.total_episodes} ตอน ({Math.round((anime.watched_episodes / anime.total_episodes) * 100)}%)
              </p>
            </div>
          )}

          <div style={{ ...infoBlock, display: "flex", alignItems: "center", gap: 16 }}>
            {editing ? (
              <>
                <div style={{ flex: 1 }}><label style={labelStyle}>สถานะการดู</label>
                  <select style={selectStyle} value={form.watch_status} onChange={(e) => set("watch_status", e.target.value as WatchStatus)}>
                    <option value="planned">ยังไม่ดู</option><option value="watching">กำลังดู</option>
                    <option value="completed">ดูจบแล้ว</option><option value="dropped">หยุดดู</option>
                  </select></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>เรท (1-10)</label><input style={inputStyle} type="number" min={1} max={10} value={form.rating || ""} onChange={(e) => set("rating", e.target.value ? Number(e.target.value) : undefined)} /></div>
              </>
            ) : (
              <>
                <span style={{ fontSize: 13, fontWeight: 700, background: sc.bg, color: sc.color, padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${sc.border}` }}>
                  🎌 {watchStatusLabel[anime.watch_status]}
                </span>
                {anime.rating && <span style={{ fontSize: 13, fontWeight: 700, color: "#b45309", background: "#fffbeb", padding: "5px 12px", borderRadius: 20, border: "1.5px solid #fde68a" }}>⭐ {anime.rating}/10</span>}
              </>
            )}
          </div>

          {(editing || anime.notes) && (
            <div style={infoBlock}>
              <label style={labelStyle}>หมายเหตุ</label>
              {editing
                ? <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
                : <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>{anime.notes}</p>
              }
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: "auto", paddingTop: 4 }}>
            {editing ? (
              <>
                <button onClick={() => { setEditing(false); setForm(anime); }} style={{ padding: "9px 20px", borderRadius: 22, fontWeight: 700, fontSize: 13, background: "#f0f8ff", color: "#5b9bd5", border: "1.5px solid #d8edf8", cursor: "pointer" }}>ยกเลิก</button>
                <button onClick={handleSave} disabled={saving} style={{ padding: "9px 24px", borderRadius: 22, fontWeight: 700, fontSize: 13, background: saving ? "#b8d9f5" : "linear-gradient(135deg, #7ec8f0, #5b9bd5)", color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 4px 12px #7ec8f055" }}>
                  {saving ? "กำลังบันทึก..." : "💾 บันทึก"}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { if (confirm("ลบเรื่องนี้จริงๆ เหรอ?")) { onDelete(anime.id); onClose(); } }} style={{ padding: "9px 20px", borderRadius: 22, fontWeight: 700, fontSize: 13, background: "#fff5f5", color: "#dc2626", border: "1.5px solid #fca5a5", cursor: "pointer" }}>ลบ</button>
                <button onClick={() => setEditing(true)} style={{ padding: "9px 24px", borderRadius: 22, fontWeight: 700, fontSize: 13, background: "linear-gradient(135deg, #7ec8f0, #5b9bd5)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 12px #7ec8f055" }}>✏️ แก้ไข</button>
              </>
            )}
          </div>
        </div>

        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 18, background: "#f0f8ff", border: "1.5px solid #d8edf8", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", color: "#93c5e8" }}>×</button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AnimePage() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [activeTab, setActiveTab] = useState<WatchStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Anime | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // My Favorite state
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showManage, setShowManage] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    fetch("/api/anime-favorites")
      .then((r) => r.json())
      .then((ids: string[]) => { if (Array.isArray(ids)) setFavoriteIds([...new Set(ids)]); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function fetchAnimes() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/anime");
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        setAnimes(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnimes();
  }, []);

  async function handleSaveFavorites(ids: string[]) {
    const cleanIds = [...new Set(ids)];
    setFavoriteIds(cleanIds);
    await fetch("/api/anime-favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: cleanIds }),
    });
  }

  async function handleAdd(anime: Omit<Anime, "id">) {
    const res = await fetch("/api/anime", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(anime) });
    if (!res.ok) throw new Error("เพิ่มไม่สำเร็จ");
    setAnimes(await fetch("/api/anime").then((r) => r.json()));
  }

  async function handleUpdate(anime: Anime) {
    const res = await fetch("/api/anime", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(anime) });
    if (!res.ok) throw new Error("แก้ไขไม่สำเร็จ");
    setAnimes((prev) => prev.map((a) => (a.id === anime.id ? anime : a)));
    setSelected(anime);
  }

  async function handleDelete(id: string) {
    await fetch("/api/anime", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setAnimes((prev) => prev.filter((a) => a.id !== id));
    setSelected(null);
  }

  const filtered = useMemo(() => {
    return animes
      .filter((a) => activeTab === "all" || a.watch_status === activeTab)
      .filter((a) => search.trim() === "" ? true : a.title.includes(search) || (a.title_en ?? "").toLowerCase().includes(search.toLowerCase()));
  }, [animes, activeTab, search]);

  const favoriteAnimes = favoriteIds.map((id) => animes.find((a) => a.id === id) ?? null);
  const sortedFiltered = [...filtered].sort((a, b) => a.title.localeCompare(b.title, "th"));

  return (
    <div style={{
      display: "flex", minHeight: "100vh", backgroundColor: "#fff",
      backgroundImage: `linear-gradient(rgba(184,217,245,0.5) 1px,transparent 2px),linear-gradient(90deg,rgba(184,217,245,0.5) 1px,transparent 2px)`,
      backgroundSize: "70px 70px", overflowX: "hidden", width: "100%",
    }}>
      <Sidebar />

      <main style={{
        flex: 1, padding: 16, paddingTop: isMobile ? 72 : 16,
        display: "flex", flexDirection: "column", gap: 14,
        minWidth: 0, maxWidth: "100%", boxSizing: "border-box" as const, overflowX: "hidden",
      }}>
        {error && <div style={{ padding: "12px 16px", background: "#fee", color: "#c33", borderRadius: 8 }}>{error}</div>}

        {/* Banner */}
        <div style={{ borderRadius: 16, height: 300, background: "#b8d9f5", overflow: "hidden", position: "relative" }}>
          <Image src="/banner-anime.jpg" alt="Anime Banner" fill priority style={{ objectFit: "cover", objectPosition: "center 65%" }} />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, background: "#fff", border: "1.5px solid #b8d9f5", borderRadius: 30, padding: "6px 8px", flexWrap: "wrap" }}>
          {TABS.map((tab) => (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)} style={{
              flex: 1, padding: "8px 10px", borderRadius: 20, cursor: "pointer",
              background: activeTab === tab.value ? "#7ec8f0" : "#fff",
              color: activeTab === tab.value ? "#fff" : "#5b9bd5",
              border: "none", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" as const,
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Search + ปุ่มเพิ่ม */}
        <div style={{ display: "flex", gap: 8 }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 ค้นหาชื่อ anime..."
            style={{ flex: 1, padding: "10px 16px", borderRadius: 20, border: "1.5px solid #b8d9f5", fontSize: 14, color: "#1a5fa8", outline: "none", minWidth: 0 }} />
          <button onClick={() => setShowAdd(true)} style={{
            padding: "10px 16px", borderRadius: 50, background: "#b8d9f5",
            color: "#1a5fa8", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14,
            whiteSpace: "nowrap" as const, flexShrink: 0,
          }}>+ เพิ่ม Anime</button>
        </div>

        {isLoading && <div style={{ textAlign: "center", padding: 40, color: "#93c5e8", fontSize: 15 }}>กำลังโหลด...</div>}

        {!isLoading && (
          <div style={{ padding: "8px 0", display: "flex", flexDirection: "column", gap: 24 }}>

            {/* ── My Favorite ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#5b9bd5" }}>
                  ✦ My Favorite <span style={{ fontSize: 11, fontWeight: 500, color: "#93c5e8" }}>({favoriteIds.length}/{SHELF_SLOTS})</span>
                </span>
                <button onClick={() => setShowManage(true)} style={{ padding: "5px 14px", borderRadius: 20, background: "#b8d9f5", color: "#1a5fa8", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>✏️ จัดการ</button>
              </div>

              <div style={{ background: "#e8f4fc", borderRadius: 16, padding: "16px 14px", minHeight: 180, border: "1.5px solid #d8edf8" }}>
                {favoriteIds.length === 0 ? (
                  <div style={{ height: 150, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#93c5e8" }}>
                    <span style={{ fontSize: 32 }}>🎌</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>ยังไม่มีรายการโปรด กด จัดการ เพื่อเริ่ม</span>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${SHELF_SLOTS}, 1fr)`, gap: 10 }}>
                    {favoriteAnimes.map((anime, idx) =>
                      anime ? (
                        <div key={`${anime.id}-${idx}`} style={{ position: "relative" }}>
                          <div style={{ position: "absolute", top: -8, left: -8, zIndex: 10 }}>
                            <StarBadge rank={idx + 1} size={30} />
                          </div>
                          <AnimeCard anime={anime} onClick={() => setSelected(anime)} />
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── ชั้นวาง ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#5b9bd5" }}>✦ ทั้งหมด</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#93c5e8", background: "#f8fbff", padding: "2px 10px", borderRadius: 12, border: "1px solid #e8f2fb" }}>
                  {sortedFiltered.length} เรื่อง
                </span>
              </div>

              {sortedFiltered.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", gap: 10, color: "#93c5e8" }}>
                  <span style={{ fontSize: 36 }}>🎌</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>ยังไม่มี anime ในรายการ</span>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(140px, 100%/3), 1fr))", gap: "16px 10px" }}>
                  {sortedFiltered.map((anime) => (
                    <AnimeCard key={anime.id} anime={anime} onClick={() => setSelected(anime)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showAdd && <AddAnimeModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {selected && <AnimeDetailModal anime={selected} onClose={() => setSelected(null)} onDelete={handleDelete} onUpdate={handleUpdate} />}
      {showManage && <ManageFavoriteModal animes={animes} shelfIds={favoriteIds} onSave={handleSaveFavorites} onClose={() => setShowManage(false)} />}
    </div>
  );
}