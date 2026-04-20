"use client";

import Image from "next/image";

export type WishlistPriority = "high" | "medium" | "low";

export interface WishlistItem {
  id: string;
  title: string;
  title_en?: string;
  cover_url?: string;
  type: "manga" | "novel";
  priority: WishlistPriority;
  notes?: string;
  added_at: string;
}

const priorityConfig: Record<WishlistPriority, { icon: string; color: string; bg: string; label: string }> = {
  high: { icon: "🔥", color: "#dc2626", bg: "rgba(220,38,38,0.12)", label: "สำคัญมาก" },
  medium: { icon: "⭐", color: "#d97706", bg: "rgba(217,119,6,0.12)", label: "ปานกลาง" },
  low: { icon: "💤", color: "#6b7280", bg: "rgba(107,114,128,0.12)", label: "ไม่รีบ" },
};

interface Props {
  item: WishlistItem;
  onClick?: (item: WishlistItem) => void;
}

export default function WishlistCard({ item, onClick }: Props) {
  const p = priorityConfig[item.priority];

  return (
    <div
      onClick={() => onClick?.(item)}
      style={{
        position: "relative",
        background: "#fff",
        border: "2px solid #b8d9f5",
        borderRadius: 12,
        aspectRatio: "2/3",
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {item.cover_url ? (
        <Image
          src={item.cover_url}
          alt={item.title}
          fill
          style={{ objectFit: "cover" }}
          sizes="(max-width: 768px) 50vw, 200px"
        />
      ) : (
        <span style={{ fontSize: 11, color: "#93c5e8", textAlign: "center", padding: "0 6px" }}>
          {item.title}
        </span>
      )}

      {/* Priority badge */}
      <div style={{
        position: "absolute", top: 6, right: 6,
        background: p.bg, backdropFilter: "blur(4px)",
        borderRadius: 8, padding: "2px 6px",
        fontSize: 13, fontWeight: 700,
        border: `1px solid ${p.color}33`,
      }}>
        {p.icon}
      </div>
    </div>
  );
}