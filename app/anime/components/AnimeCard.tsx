"use client";

import Image from "next/image";

export type AnimeStatus = "planned" | "watching" | "completed" | "dropped";
export type AnimeType = "series" | "movie";
export interface RewatchSession {
  start_date?: string;
  end_date?: string;
  note?: string;
}

export interface Anime {
  id: string;
  mal_id: number;
  title: string;
  title_en?: string;
  cover_url?: string;
  type: AnimeType;
  status: AnimeStatus;
  genre?: string;
  year?: number;
  season?: string;
  studio?: string;
  total_episodes?: number;
  watched_episodes?: number;
  watch_source?: string;
  start_date?: string;
  end_date?: string;
  rating?: number;
  rewatch_count?: number;
  notes?: string;
  rewatch_sessions?: RewatchSession[];
}

export const statusConfig: Record<AnimeStatus, { label: string; color: string; bg: string; border: string }> = {
  planned: { label: "ยังไม่ดู", color: "#5b9bd5", bg: "#f0f8ff", border: "#d8edf8" },
  watching: { label: "กำลังดู", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  completed: { label: "ดูจบแล้ว", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  dropped: { label: "หยุดดู", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

interface Props {
  anime: Anime;
  onClick: (anime: Anime) => void;
}

export default function AnimeCard({ anime, onClick }: Props) {
  const s = statusConfig[anime.status];
  const progress = anime.total_episodes
    ? `${anime.watched_episodes ?? 0}/${anime.total_episodes} ตอน`
    : anime.watched_episodes
      ? `${anime.watched_episodes} ตอน`
      : "ยังไม่เริ่ม";

  return (
    <button
      onClick={() => onClick(anime)}
      style={{
        border: "1.5px solid #e8f2fb",
        borderRadius: 14,
        background: "#fff",
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "2/3", borderRadius: 10, overflow: "hidden", background: "#eef6fd" }}>
        {anime.cover_url ? (
          <Image src={anime.cover_url} alt={anime.title} fill style={{ objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#b8d9f5", fontSize: 26 }}>🎌</div>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a5fa8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{anime.title}</div>
        <div style={{ fontSize: 11, color: "#93c5e8", marginTop: 2 }}>{progress}</div>
        <div style={{ display: "inline-flex", marginTop: 6, padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
          {s.label}
        </div>
      </div>
    </button>
  );
}