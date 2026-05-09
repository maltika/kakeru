"use client";

import { useState } from "react";
import { WishlistItem, WishlistPriority } from "@/app/wishlist/components/Wishlistcard";

interface Props {
  onClose: () => void;
  onAdd: (item: Omit<WishlistItem, "id" | "added_at">) => Promise<void>;
  publishers?: string[];
}

const labelStyle = { fontSize: 13, fontWeight: 600, color: "#5b9bd5", marginBottom: 4, display: "block" as const };
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

const PRIORITY_OPTIONS: { value: WishlistPriority; label: string; color: string; bg: string }[] = [
  { value: "high", label: "🔥 สำคัญมาก", color: "#dc2626", bg: "#fff0f0" },
  { value: "medium", label: "⭐ ปานกลาง", color: "#d97706", bg: "#fffbeb" },
  { value: "low", label: "💤 ไม่รีบ", color: "#6b7280", bg: "#f9fafb" },
];

const PUBLISHERS = ["Siam Inter Comics", "NED Comics", "Vibulkij", "Bongkoch", "animag", "Nation Edutainment", "อื่นๆ"];
const STORES = ["ร้านหนังสือทั่วไป", "Kinokuniya", "B2S", "Se-ed", "Naiin", "Shopee", "Lazada", "อื่นๆ"];

export default function AddWishModal({ onClose, onAdd, publishers = [] }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [publisherCustom, setPublisherCustom] = useState(false);
  const [storeCustom, setStoreCustom] = useState(false);
  const [form, setForm] = useState<Omit<WishlistItem, "id" | "added_at">>({
    title: "",
    title_en: "",
    cover_url: "",
    type: "manga",
    priority: "medium",
    notes: "",
    publisher: "",
    price: undefined,
    volumes_wanted: "",
    volumes_total: undefined,
    store: "",
  });

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: data }
      );
      const json = await res.json();
      set("cover_url", json.secure_url);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      await onAdd(form);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, border: "2px solid #b8d9f5",
          width: "min(480px, 95vw)", maxHeight: "90vh",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1.5px solid #e8f4fc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#1a5fa8", margin: 0 }}>✨ เพิ่มใน Wishlist</p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#93c5e8" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ชื่อ */}
          <div>
            <label style={labelStyle}>ชื่อเรื่อง *</label>
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="เช่น ดาบพิฆาตอสูร"
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>ชื่ออังกฤษ/ญี่ปุ่น</label>
            <input
              style={inputStyle}
              value={form.title_en}
              onChange={(e) => set("title_en", e.target.value)}
              placeholder="เช่น Kimetsu no Yaiba"
            />
          </div>

          {/* ประเภท */}
          <div>
            <label style={labelStyle}>ประเภท</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["manga", "novel"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => set("type", t)}
                  style={{
                    flex: 1, padding: "8px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border: `1.5px solid ${form.type === t ? "#7ec8f0" : "#b8d9f5"}`,
                    background: form.type === t ? "#e8f7ff" : "#f8fbff",
                    color: form.type === t ? "#1a5fa8" : "#93c5e8",
                  }}
                >
                  {t === "manga" ? "📚 มังงะ/การ์ตูน" : "📖 นิยาย/หนังสือ"}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label style={labelStyle}>ความสำคัญ</label>
            <div style={{ display: "flex", gap: 8 }}>
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => set("priority", opt.value)}
                  style={{
                    flex: 1, padding: "8px 4px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: `1.5px solid ${form.priority === opt.value ? opt.color : "#b8d9f5"}`,
                    background: form.priority === opt.value ? opt.bg : "#f8fbff",
                    color: form.priority === opt.value ? opt.color : "#93c5e8",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* สำนักพิมพ์ */}
          <div>
            <label style={labelStyle}>สำนักพิมพ์</label>
            <input
              style={inputStyle}
              value={form.publisher}
              onChange={(e) => set("publisher", e.target.value)}
              placeholder="เช่น Siam Inter Comics"
              list="wish-publisher-list"
            />
            <datalist id="wish-publisher-list">
              {publishers.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>

          {/* ซื้อจากที่ไหน */}
          <div>
            <label style={labelStyle}>ซื้อจากที่ไหน</label>
            {storeCustom ? (
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={form.store}
                  onChange={(e) => set("store", e.target.value)}
                  placeholder="พิมพ์ชื่อร้าน"
                  autoFocus
                />
                <button
                  onClick={() => { setStoreCustom(false); set("store", ""); }}
                  style={{ padding: "0 10px", borderRadius: 10, border: "1.5px solid #b8d9f5", background: "#f0f8ff", color: "#93c5e8", cursor: "pointer", fontSize: 13 }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <select
                value={form.store}
                onChange={(e) => {
                  if (e.target.value === "อื่นๆ") { setStoreCustom(true); set("store", ""); }
                  else set("store", e.target.value);
                }}
                style={{ ...inputStyle }}
              >
                <option value="">— เลือกร้าน —</option>
                {STORES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>

          {/* ราคา + มีทั้งหมด */}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>ราคา (บาท)</label>
              <input
                style={inputStyle}
                type="number"
                min={0}
                value={form.price ?? ""}
                onChange={(e) => set("price", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="เช่น 85"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>มีทั้งหมด (เล่ม)</label>
              <input
                style={inputStyle}
                type="number"
                min={1}
                value={form.volumes_total ?? ""}
                onChange={(e) => set("volumes_total", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="เช่น 12"
              />
            </div>
          </div>

          {/* เล่มที่ต้องการ */}
          <div>
            <label style={labelStyle}>เล่มที่ต้องการ</label>
            <input
              style={inputStyle}
              value={form.volumes_wanted ?? ""}
              onChange={(e) => set("volumes_wanted", e.target.value)}
              placeholder="เช่น 3-5 หรือ 1,3,7"
            />
          </div>

          {/* รูปปก */}
          <div>
            <label style={labelStyle}>รูปปก</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {form.cover_url && (
                <img src={form.cover_url} alt="cover" style={{ width: 50, height: 75, objectFit: "cover", borderRadius: 8, border: "1.5px solid #b8d9f5" }} />
              )}
              <label style={{
                padding: "8px 16px", borderRadius: 10, background: "#f0f8ff",
                color: uploading ? "#93c5e8" : "#5b9bd5",
                border: "1.5px solid #b8d9f5", cursor: uploading ? "wait" : "pointer",
                fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" as const,
              }}>
                {uploading ? "⏳ กำลังอัปโหลด..." : form.cover_url ? "🔄 เปลี่ยนรูป" : "📁 เลือกรูป"}
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* หมายเหตุ */}
          <div>
            <label style={labelStyle}>หมายเหตุ / เหตุผลที่อยากได้</label>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="เพื่อนแนะนำ, เห็นรีวิวดีมาก, ซื้อตอนลดราคา..."
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1.5px solid #e8f4fc", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 20, background: "#f0f8ff", color: "#5b9bd5", border: "1.5px solid #b8d9f5", cursor: "pointer", fontWeight: 600 }}>
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.title.trim()}
            style={{
              padding: "9px 24px", borderRadius: 20,
              background: loading || !form.title.trim() ? "#b8d9f5" : "#7ec8f0",
              color: "#fff", border: "none", cursor: loading ? "wait" : "pointer", fontWeight: 600,
            }}
          >
            {loading ? "กำลังบันทึก..." : "เพิ่มใน Wishlist"}
          </button>
        </div>
      </div>
    </div>
  );
}