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
  bought?: boolean;
  // ── ใหม่ ──
  publisher?: string;
  price?: number;
  volumes_wanted?: string;
  volumes_total?: number;
  store?: string;
}

export const priorityConfig: Record<WishlistPriority, { icon: string; color: string; bg: string; label: string; border: string }> = {
  high: { icon: "🔥", color: "#dc2626", bg: "rgba(220,38,38,0.10)", label: "สำคัญมาก", border: "#fca5a5" },
  medium: { icon: "⭐", color: "#d97706", bg: "rgba(217,119,6,0.10)", label: "ปานกลาง", border: "#fcd34d" },
  low: { icon: "💤", color: "#6b7280", bg: "rgba(107,114,128,0.10)", label: "ไม่รีบ", border: "#d1d5db" },
};

interface Props {
  item: WishlistItem;
  onClick?: (item: WishlistItem) => void;
  onToggleBought?: (item: WishlistItem, bought: boolean) => void;
}

export default function WishlistCard({ item, onClick, onToggleBought }: Props) {
  const p = priorityConfig[item.priority];

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        aspectRatio: "2/3",
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: item.bought
          ? "2px solid #34d399"
          : `2px solid ${p.border}`,
        background: "#fff",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: item.bought
          ? "0 0 0 3px rgba(52,211,153,0.15)"
          : "none",
      }}
      onClick={() => onClick?.(item)}
    >
      {/* รูปปก */}
      {item.cover_url ? (
        <Image
          src={item.cover_url}
          alt={item.title}
          fill
          style={{ objectFit: "cover", filter: item.bought ? "brightness(0.72)" : "none", transition: "filter 0.2s" }}
          sizes="(max-width: 768px) 50vw, 200px"
        />
      ) : (
        <span style={{ fontSize: 11, color: "#93c5e8", textAlign: "center", padding: "0 6px", zIndex: 1 }}>
          {item.title}
        </span>
      )}

      {/* Overlay ถ้าซื้อแล้ว */}
      {item.bought && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, transparent 40%, rgba(5,150,105,0.6) 100%)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          paddingBottom: 10, zIndex: 2,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 800, color: "#fff",
            background: "rgba(5,150,105,0.85)", borderRadius: 20,
            padding: "3px 10px", letterSpacing: "0.03em",
          }}>
            ✓ ซื้อแล้ว
          </span>
        </div>
      )}

      {/* Priority badge */}
      {/* {!item.bought && (
        <div style={{
          position: "absolute", top: 6, right: 6, zIndex: 3,
          background: p.bg, backdropFilter: "blur(4px)",
          borderRadius: 8, padding: "2px 6px",
          fontSize: 13, fontWeight: 700,
          border: `1px solid ${p.color}33`,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}>
          {p.icon}
        </div>
      )} */}

      {/* Checkbox ซื้อแล้ว */}
      {/* Checkbox — โชว์เฉพาะตอนซื้อแล้ว */}
{item.bought && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onToggleBought?.(item, !item.bought);
    }}
    title="ยกเลิก"
    style={{
      position: "absolute", top: 6, left: 6, zIndex: 4,
      width: 24, height: 24, borderRadius: 7,
      border: "2px solid #34d399",
      background: "#34d399",
      backdropFilter: "blur(4px)",
      cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, lineHeight: 1,
      transition: "all 0.15s",
      boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
      padding: 0,
    }}
  >
    ✓
  </button>
)}
    </div>
  );
}