"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Anime, AnimeStatus, AnimeType } from "./AnimeCard";
import { WatchSourcePicker } from "./WatchSourcePicker";

interface Props {
  onClose: () => void;
  onAdd: (anime: Omit<Anime, "id">) => Promise<void>;
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== "undefined") return window.innerWidth < breakpoint;
    return false;
  });
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#5b9bd5",
  marginBottom: 4,
  display: "block" as const,
};

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 10,
  border: "1.5px solid #b8d9f5",
  fontSize: 14,
  color: "#1a5fa8",
  outline: "none",
  boxSizing: "border-box" as const,
  background: "#fff",
};

const selectStyle = { ...inputStyle };

interface JikanResult {
  mal_id: number;
  title: string;
  title_english?: string;
  images: { jpg: { image_url: string } };
  type: string;
  episodes?: number;
  genres: { name: string }[];
  studios: { name: string }[];
  year?: number;
  season?: string;
}

export default function AddAnimeModal({ onClose, onAdd }: Props) {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<JikanResult[]>([]);
  const [query, setQuery] = useState("");
  const isMobile = useIsMobile(640);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState<Omit<Anime, "id">>({
    mal_id: 0,
    title: "",
    title_en: "",
    cover_url: "",
    type: "series",
    status: "planned",
    genre: "",
    year: undefined,
    season: "",
    studio: "",
    total_episodes: undefined,
    watched_episodes: undefined,
    watch_source: "",
    start_date: "",
    end_date: "",
    rating: undefined,
    rewatch_count: undefined,
    notes: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=8&sfw=true`);
        const data = await res.json();
        setSearchResults(Array.isArray(data.data) ? data.data : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  function applySelectedAnime(item: JikanResult) {
    const mappedType: AnimeType = item.type === "Movie" ? "movie" : "series";
    const seasonLabel = item.season && item.year
      ? `${item.season.charAt(0).toUpperCase() + item.season.slice(1)} ${item.year}`
      : "";

    setForm((prev) => ({
      ...prev,
      mal_id: item.mal_id,
      title: item.title,
      title_en: item.title_english ?? "",
      cover_url: item.images.jpg.image_url,
      type: mappedType,
      genre: item.genres.map((g) => g.name).join(", "),
      studio: item.studios.map((s) => s.name).join(", "),
      total_episodes: item.episodes,
      year: item.year,
      season: seasonLabel,
    }));
    setQuery(item.title);
    setSearchResults([]);
  }

  async function handleSubmit() {
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      await onAdd(form);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "บันทึกไม่สำเร็จ";
      alert(`บันทึกไม่สำเร็จ: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(3px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: isMobile ? "24px 24px 0 0" : 20, border: "2px solid #b8d9f5", width: isMobile ? "100%" : "min(620px, 95vw)", maxHeight: isMobile ? "95vh" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1.5px solid #e8f4fc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#1a5fa8", margin: 0 }}>เพิ่ม Anime</p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#93c5e8" }}>x</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <label style={labelStyle}>ชื่อเรื่อง</label>
            <input
              style={inputStyle}
              value={query || form.title}
              onChange={(e) => {
                setQuery(e.target.value);
                set("title", e.target.value);
                set("mal_id", 0);
              }}
              placeholder="พิมพ์ชื่อ เช่น Attack on Titan"
              autoFocus
            />
            {searching && (
              <div style={{ position: "absolute", right: 12, top: 36, fontSize: 12, color: "#93c5e8" }}>
                กำลังค้นหา...
              </div>
            )}
            {searchResults.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 40, background: "#fff", border: "1.5px solid #b8d9f5", borderRadius: 12, boxShadow: "0 8px 24px rgba(124,194,240,0.2)", overflow: "hidden", marginTop: 4, maxHeight: 320, overflowY: "auto" }}>
                {searchResults.map((item) => (
                  <button
                    key={item.mal_id}
                    type="button"
                    onClick={() => applySelectedAnime(item)}
                    style={{ width: "100%", display: "flex", gap: 10, padding: "10px 12px", cursor: "pointer", border: "none", borderBottom: "1px solid #f0f8ff", alignItems: "center", textAlign: "left", background: "#fff" }}
                  >
                    <div style={{ width: 36, height: 54, position: "relative", borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "#eef6fd" }}>
                      <Image src={item.images.jpg.image_url} alt={item.title} fill style={{ objectFit: "cover" }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a5fa8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11, color: "#93c5e8" }}>
                        {item.type} · {item.episodes ? `${item.episodes} ep` : "?"} · {item.year ?? "—"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>ชื่ออังกฤษ/ญี่ปุ่น</label>
            <input style={inputStyle} value={form.title_en ?? ""} onChange={(e) => set("title_en", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>ลิงก์รูปปก</label>
            <input style={inputStyle} value={form.cover_url ?? ""} onChange={(e) => set("cover_url", e.target.value)} placeholder="https://..." />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>ประเภท</label>
              <select style={selectStyle} value={form.type} onChange={(e) => set("type", e.target.value as AnimeType)}>
                <option value="series">Series</option>
                <option value="movie">Movie</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>สถานะ</label>
              <select style={selectStyle} value={form.status} onChange={(e) => set("status", e.target.value as AnimeStatus)}>
                <option value="planned">ยังไม่ดู</option>
                <option value="watching">กำลังดู</option>
                <option value="completed">ดูจบแล้ว</option>
                <option value="dropped">หยุดดู</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>ดูถึงตอนที่</label>
              <input style={inputStyle} type="number" min={0} value={form.watched_episodes ?? ""} onChange={(e) => set("watched_episodes", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <label style={labelStyle}>ตอนทั้งหมด</label>
              <input style={inputStyle} type="number" min={0} value={form.total_episodes ?? ""} onChange={(e) => set("total_episodes", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <label style={labelStyle}>คะแนน (1-10)</label>
              <input style={inputStyle} type="number" min={1} max={10} value={form.rating ?? ""} onChange={(e) => set("rating", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <label style={labelStyle}>ดูกี่รอบแล้ว</label>
              <input style={inputStyle} type="number" min={0} value={form.rewatch_count ?? ""} onChange={(e) => set("rewatch_count", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <label style={labelStyle}>ปี</label>
              <input style={inputStyle} type="number" min={1900} max={2100} value={form.year ?? ""} onChange={(e) => set("year", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <label style={labelStyle}>Season</label>
              <input style={inputStyle} value={form.season ?? ""} onChange={(e) => set("season", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Genre</label>
              <input style={inputStyle} value={form.genre ?? ""} onChange={(e) => set("genre", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Studio</label>
              <input style={inputStyle} value={form.studio ?? ""} onChange={(e) => set("studio", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>เริ่มดู</label>
              <input style={inputStyle} type="date" value={form.start_date ?? ""} onChange={(e) => set("start_date", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>ดูจบ</label>
              <input style={inputStyle} type="date" value={form.end_date ?? ""} onChange={(e) => set("end_date", e.target.value)} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>แหล่งที่ดู</label>
            <WatchSourcePicker
              value={form.watch_source ?? ""}
              onChange={(v) => set("watch_source", v)}
            />
          </div>

          <div>
            <label style={labelStyle}>หมายเหตุ</label>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1.5px solid #e8f4fc", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ flex: isMobile ? 1 : undefined, padding: "10px 20px", borderRadius: 20, background: "#f0f8ff", color: "#5b9bd5", border: "1.5px solid #b8d9f5", cursor: "pointer", fontWeight: 600 }}>
            ยกเลิก
          </button>
          <button onClick={handleSubmit} disabled={loading || !form.title.trim()} style={{ flex: isMobile ? 2 : undefined, padding: "10px 24px", borderRadius: 20, background: loading || !form.title.trim() ? "#b8d9f5" : "#7ec8f0", color: "#fff", border: "none", cursor: loading ? "wait" : !form.title.trim() ? "not-allowed" : "pointer", fontWeight: 600 }}>
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
