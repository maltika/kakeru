"use client";

import Image from "next/image";
import { useState } from "react";
import { WishlistItem, WishlistPriority } from "@/app/wishlist/components/Wishlistcard";

interface Props {
  item: WishlistItem;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (item: WishlistItem) => Promise<void>;
  onMovedToShelf?: (item: WishlistItem) => void;
}

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
const infoBlock = { padding: "14px 16px", background: "#f8fbff", borderRadius: 14, border: "1.5px solid #e8f2fb" };

const PRIORITY_OPTIONS: { value: WishlistPriority; label: string; color: string; bg: string }[] = [
  { value: "high", label: "🔥 สำคัญมาก", color: "#dc2626", bg: "#fff0f0" },
  { value: "medium", label: "⭐ ปานกลาง", color: "#d97706", bg: "#fffbeb" },
  { value: "low", label: "💤 ไม่รีบ", color: "#6b7280", bg: "#f9fafb" },
];

export default function WishlistDetailModal({ item, onClose, onDelete, onUpdate, onMovedToShelf }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<WishlistItem>({ ...item });

  function set<K extends keyof WishlistItem>(key: K, value: WishlistItem[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate(form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
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

  const priorityInfo = PRIORITY_OPTIONS.find((p) => p.value === form.priority)!;
  const addedDate = new Date(item.added_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(3px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 20, border: "2px solid #b8d9f5", width: "min(540px, 95vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1.5px solid #e8f4fc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#1a5fa8", margin: 0 }}>
            ✨ {editing ? "แก้ไข Wishlist" : "รายละเอียด"}
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#93c5e8" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Cover + info */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ flexShrink: 0 }}>
              {form.cover_url ? (
                <div style={{ position: "relative", width: 90, height: 135, borderRadius: 10, overflow: "hidden", border: "2px solid #b8d9f5" }}>
                  <Image src={form.cover_url} alt={form.title} fill style={{ objectFit: "cover" }} sizes="90px" />
                </div>
              ) : (
                <div style={{ width: 90, height: 135, borderRadius: 10, background: "#e8f3fc", border: "2px solid #b8d9f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 11, color: "#93c5e8", textAlign: "center", padding: "0 6px" }}>{form.title}</span>
                </div>
              )}
              {editing && (
                <label style={{ display: "block", textAlign: "center", marginTop: 6, fontSize: 11, color: "#5b9bd5", fontWeight: 600, cursor: "pointer" }}>
                  {uploading ? "⏳..." : "🔄 เปลี่ยนรูป"}
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} disabled={uploading} />
                </label>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div>
                    <label style={labelStyle}>ชื่อเรื่อง</label>
                    <input style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>ชื่ออังกฤษ/ญี่ปุ่น</label>
                    <input style={inputStyle} value={form.title_en ?? ""} onChange={(e) => set("title_en", e.target.value)} />
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#1a5fa8", lineHeight: 1.3 }}>{form.title}</p>
                  {form.title_en && <p style={{ margin: "0 0 10px", fontSize: 13, color: "#93c5e8" }}>{form.title_en}</p>}
                </div>
              )}

              {/* Priority badge */}
              {!editing && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: priorityInfo.bg, border: `1.5px solid ${priorityInfo.color}33`, marginTop: 4 }}>
                  <span style={{ fontSize: 13 }}>{priorityInfo.label}</span>
                </div>
              )}
            </div>
          </div>

          {/* Priority edit */}
          {editing && (
            <div style={infoBlock}>
              <label style={labelStyle}>ความสำคัญ</label>
              <div style={{ display: "flex", gap: 8 }}>
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => set("priority", opt.value)}
                    style={{
                      flex: 1, padding: "7px 4px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
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
          )}

          {/* Type */}
          {editing && (
            <div style={infoBlock}>
              <label style={labelStyle}>ประเภท</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["manga", "novel"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => set("type", t)}
                    style={{
                      flex: 1, padding: "7px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                      border: `1.5px solid ${form.type === t ? "#7ec8f0" : "#b8d9f5"}`,
                      background: form.type === t ? "#e8f7ff" : "#f8fbff",
                      color: form.type === t ? "#1a5fa8" : "#93c5e8",
                    }}
                  >
                    {t === "manga" ? "📚 มังงะ" : "📖 นิยาย"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div style={infoBlock}>
            <label style={labelStyle}>หมายเหตุ</label>
            {editing ? (
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
                value={form.notes ?? ""}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="เหตุผลที่อยากได้, แหล่งที่เห็น..."
              />
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: form.notes ? "#1a5fa8" : "#93c5e8", whiteSpace: "pre-wrap" }}>
                {form.notes || "—"}
              </p>
            )}
          </div>

          {/* Added date */}
          {!editing && (
            <p style={{ margin: 0, fontSize: 12, color: "#b0cfe8", textAlign: "right" }}>
              เพิ่มเมื่อ {addedDate}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1.5px solid #e8f4fc", display: "flex", justifyContent: "space-between", gap: 10 }}>
          <button
            onClick={() => { if (confirm("ลบออกจาก Wishlist?")) onDelete(item.id); }}
            style={{ padding: "9px 16px", borderRadius: 20, background: "#fff0f0", color: "#dc2626", border: "1.5px solid #fca5a5", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
          >
            🗑️ ลบ
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            {editing ? (
              <>
                <button onClick={() => { setForm({ ...item }); setEditing(false); }} style={{ padding: "9px 16px", borderRadius: 20, background: "#f0f8ff", color: "#5b9bd5", border: "1.5px solid #b8d9f5", cursor: "pointer", fontWeight: 600 }}>
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ padding: "9px 20px", borderRadius: 20, background: saving ? "#b8d9f5" : "#7ec8f0", color: "#fff", border: "none", cursor: saving ? "wait" : "pointer", fontWeight: 600 }}
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} style={{ padding: "9px 20px", borderRadius: 20, background: "#7ec8f0", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>
                ✏️ แก้ไข
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}