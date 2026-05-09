"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Anime } from "./AnimeCard";


const MAX_FAV = 7;

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

function AnimeThumb({ anime, onClick }: { anime: Anime; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "1.5px solid #e8f2fb", borderRadius: 14,
        background: "#fff", padding: 0,
        display: "flex", flexDirection: "column",
        cursor: "pointer", textAlign: "left", overflow: "hidden", width: "100%",
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "2/3", background: "#eef6fd" }}>
        {anime.cover_url ? (
          <Image src={anime.cover_url} alt={anime.title} fill style={{ objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 24 }}>🎌</div>
        )}
      </div>
    </button>
  );
}

// ── Manage Modal ──────────────────────────────────────────────────────────────
function ManageFavModal({ animeList, favIds, onSave, onClose }: {
  animeList: Anime[];
  favIds: string[];
  onSave: (ids: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [localIds, setLocalIds] = useState<string[]>([...favIds]);
  const [search, setSearch] = useState("");
  const [dragSrc, setDragSrc] = useState<number | null>(null);

  const filtered = animeList.filter((a) =>
    search.trim() === "" ? true :
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.title_en ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function toggle(anime: Anime) {
    if (localIds.includes(anime.id)) {
      setLocalIds((prev) => prev.filter((id) => id !== anime.id));
    } else if (localIds.length < MAX_FAV) {
      setLocalIds((prev) => [...prev, anime.id]);
    }
  }

  function handleDragStart(idx: number) { setDragSrc(idx); }
  function handleDrop(idx: number) {
    if (dragSrc === null || dragSrc === idx) return;
    setLocalIds((prev) => {
      const next = [...prev];
      [next[dragSrc], next[idx]] = [next[idx], next[dragSrc]];
      return next;
    });
    setDragSrc(null);
  }

  const localAnime = localIds.map((id) => animeList.find((a) => a.id === id)).filter(Boolean) as Anime[];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(3px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, border: "2px solid #b8d9f5", width: "min(760px, 95vw)", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ padding: "16px 20px", borderBottom: "1.5px solid #e8f4fc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#1a5fa8", margin: 0 }}>⭐ จัดการ My Favorite</p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#93c5e8" }}>×</button>
        </div>

        {/* Current favs */}
        <div style={{ padding: "14px 20px", borderBottom: "1.5px solid #e8f4fc" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#5b9bd5", margin: "0 0 10px" }}>
            อันดับปัจจุบัน ({localIds.length}/{MAX_FAV}) — ลากเพื่อเรียงลำดับ
          </p>
          {localAnime.length === 0 ? (
            <div style={{ textAlign: "center", padding: "18px 0", color: "#b8d9f5", fontSize: 13 }}>ยังไม่มีรายการ — เลือกอนิเมะด้านล่าง</div>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {localAnime.map((anime, idx) => (
                <div
                  key={anime.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(idx)}
                  style={{ position: "relative", width: 72, cursor: "grab", opacity: dragSrc === idx ? 0.5 : 1 }}
                >
                  <div style={{ position: "absolute", top: -6, left: -6, zIndex: 10 }}>
                    <StarBadge rank={idx + 1} size={26} />
                  </div>
                  <button
                    onClick={() => toggle(anime)}
                    style={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, borderRadius: "50%", background: "#f87171", color: "#fff", border: "none", cursor: "pointer", fontSize: 11, lineHeight: "18px", textAlign: "center", padding: 0, zIndex: 10 }}
                  >×</button>
                  <AnimeThumb anime={anime} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ padding: "12px 20px", borderBottom: "1.5px solid #e8f4fc" }}>
          <input
            autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ค้นหาอนิเมะที่จะเพิ่ม..."
            style={{ width: "100%", padding: "9px 16px", borderRadius: 20, border: "1.5px solid #b8d9f5", fontSize: 14, color: "#1a5fa8", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Grid */}
        <div style={{ overflowY: "auto", padding: "14px 20px", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 12 }}>
            {filtered.map((anime) => {
              const picked = localIds.includes(anime.id);
              const full = localIds.length >= MAX_FAV && !picked;
              return (
                <div key={anime.id} onClick={() => { if (!full) toggle(anime); }}
                  style={{ position: "relative", cursor: full ? "not-allowed" : "pointer", opacity: full ? 0.4 : 1 }}
                >
                  <AnimeThumb anime={anime} />
                  {picked && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(94,171,224,0.3)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
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

        <div style={{ padding: "12px 20px", borderTop: "1.5px solid #e8f4fc", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 20, background: "#f0f8ff", color: "#5b9bd5", border: "1.5px solid #b8d9f5", cursor: "pointer", fontWeight: 600 }}>ยกเลิก</button>
          <button onClick={async () => { await onSave(localIds); onClose(); }} style={{ padding: "9px 24px", borderRadius: 20, background: "#7ec8f0", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function AnimeFavoriteSection({ animeList, uid, onAnimeClick }: {
  animeList: Anime[];
  uid: string;
  onAnimeClick: (anime: Anime) => void;
}) {
  const [favIds, setFavIds] = useState<string[]>([]);
  const [showManage, setShowManage] = useState(false);

  // โหลด favs
  useEffect(() => {
    fetch("/api/anime-favorites", { headers: { "x-uid": uid } })
      .then(async (r) => {
        if (!r.ok) throw new Error("failed to load anime favorites");
        return r.json();
      })
      .then((ids) => { if (Array.isArray(ids)) setFavIds(ids); })
      .catch(() => {});
  }, [uid]);

  async function handleSave(ids: string[]) {
    const clean = [...new Set(ids.filter(Boolean))];
    setFavIds(clean);
    const res = await fetch("/api/anime-favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-uid": uid },
      body: JSON.stringify({ ids: clean }),
    });
    if (!res.ok) {
      throw new Error("failed to save anime favorites");
    }
  }

  const favAnime = favIds.map((id) => animeList.find((a) => a.id === id)).filter(Boolean) as Anime[];

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#5b9bd5" }}>
            ⭐ My Favorite{" "}
            <span style={{ fontSize: 11, fontWeight: 500, color: "#93c5e8" }}>({favIds.length}/{MAX_FAV})</span>
          </span>
          <button
            onClick={() => setShowManage(true)}
            style={{ padding: "5px 14px", borderRadius: 20, background: "#b8d9f5", color: "#1a5fa8", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
          >
            ✏️ จัดการ
          </button>
        </div>

        <div style={{ background: "#e8f4fc", borderRadius: 16, border: "1.5px solid #d8edf8", padding: "16px 14px", minHeight: 160, overflow: "visible" }}>
          {favAnime.length === 0 ? (
            <div style={{ height: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#93c5e8" }}>
              <span style={{ fontSize: 32 }}>⭐</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>ยังไม่มีรายการโปรด กด จัดการ เพื่อเริ่ม</span>
            </div>
          ) : (
            <div style={{ overflowX: "auto", overflowY: "visible", paddingBottom: 6, paddingTop: 14, paddingLeft: 10, scrollbarWidth: "thin", scrollbarColor: "#b8d9f5 transparent" }}>
              <div style={{ display: "flex", gap: 10, width: "max-content", alignItems: "flex-start" }}>
                {favAnime.map((anime, idx) => (
                  <div key={anime.id} style={{ position: "relative", width: 130, flexShrink: 0 }}>
                    <div style={{ position: "absolute", top: -8, left: -8, zIndex: 10 }}>
                      <StarBadge rank={idx + 1} size={30} />
                    </div>
                    <AnimeThumb anime={anime} onClick={() => onAnimeClick(anime)} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showManage && (
        <ManageFavModal
          animeList={animeList}
          favIds={favIds}
          onSave={handleSave}
          onClose={() => setShowManage(false)}
        />
      )}
    </>
  );
}