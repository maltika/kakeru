"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { WishlistItem, WishlistPriority, priorityConfig } from "@/app/wishlist/components/Wishlistcard";

interface Props {
  item: WishlistItem;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (item: WishlistItem) => Promise<void>;
  onMoveToShelf?: (item: WishlistItem) => void;
  publishers?: string[];
}

// ── Responsive hook ───────────────────────────────────────────────────────────
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
  fontSize: 11, fontWeight: 700, color: "#93c5e8",
  marginBottom: 4, display: "block" as const,
  letterSpacing: "0.04em", textTransform: "uppercase" as const,
};
const inputStyle = {
  width: "100%", padding: "7px 11px", borderRadius: 9,
  border: "1.5px solid #d8edf8", fontSize: 13, color: "#1a5fa8",
  outline: "none", boxSizing: "border-box" as const, background: "#fff",
};
const infoBlock = {
  padding: "14px 16px", background: "#f8fbff",
  borderRadius: 14, border: "1.5px solid #e8f2fb",
};

const PRIORITY_OPTIONS: { value: WishlistPriority; label: string; color: string; bg: string }[] = [
  { value: "high", label: "🔥 สำคัญมาก", color: "#dc2626", bg: "#fff0f0" },
  { value: "medium", label: "⭐ ปานกลาง", color: "#d97706", bg: "#fffbeb" },
  { value: "low", label: "💤 ไม่รีบ", color: "#6b7280", bg: "#f9fafb" },
];

const PUBLISHERS = ["Siam Inter Comics", "NED Comics", "Vibulkij", "Bongkoch", "animag", "Nation Edutainment", "อื่นๆ"];
const STORES = ["ร้านหนังสือทั่วไป", "Kinokuniya", "B2S", "Se-ed", "Naiin", "Shopee", "Lazada", "อื่นๆ"];

export default function WishlistDetailModal({
  item, onClose, onDelete, onUpdate, onMoveToShelf, publishers = []
}: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<WishlistItem>({ ...item });
  const [confirmMove, setConfirmMove] = useState(false);
  const [publisherCustom, setPublisherCustom] = useState(false);
  const [storeCustom, setStoreCustom] = useState(false);
  const isMobile = useIsMobile(640);

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

  async function handleToggleBought() {
    const updated = { ...form, bought: !form.bought };
    setForm(updated);
    await onUpdate(updated);
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

  const p = priorityConfig[form.priority];
  const addedDate = new Date(item.added_at).toLocaleDateString("th-TH", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: isMobile ? "flex-end" : "center",
          justifyContent: "center",
          zIndex: 50, backdropFilter: "blur(3px)",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: isMobile ? "24px 24px 0 0" : 20,
            border: "2px solid #b8d9f5",
            width: isMobile ? "100%" : "min(540px, 95vw)",
            maxHeight: isMobile ? "92vh" : "90vh",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "16px 20px", borderBottom: "1.5px solid #e8f4fc",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexShrink: 0,
          }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#1a5fa8", margin: 0 }}>
              ✨ {editing ? "แก้ไข Wishlist" : "รายละเอียด"}
            </p>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#93c5e8" }}>×</button>
          </div>

          {/* Body */}
          <div style={{ overflowY: "auto", flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Cover + title */}
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

              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {editing ? (
                  <>
                    <div>
                      <label style={labelStyle}>ชื่อเรื่อง</label>
                      <input style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>ชื่ออังกฤษ/ญี่ปุ่น</label>
                      <input style={inputStyle} value={form.title_en ?? ""} onChange={(e) => set("title_en", e.target.value)} />
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a5fa8", lineHeight: 1.3 }}>{form.title}</p>
                    {form.title_en && <p style={{ margin: 0, fontSize: 13, color: "#93c5e8" }}>{form.title_en}</p>}
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "4px 12px", borderRadius: 20,
                      background: p.bg, border: `1.5px solid ${p.border}`,
                      alignSelf: "flex-start",
                    }}>
                      <span style={{ fontSize: 13 }}>{p.icon} {p.label}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── ซื้อแล้ว toggle ── */}
            {!editing && (
              <div style={{
                ...infoBlock,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderColor: form.bought ? "#6ee7b7" : "#e8f2fb",
                background: form.bought ? "#ecfdf5" : "#f8fbff",
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: form.bought ? "#059669" : "#5b9bd5" }}>
                    {form.bought ? "✓ ซื้อแล้ว" : "ยังไม่ซื้อ"}
                  </span>
                  <span style={{ fontSize: 11, color: "#93c5e8" }}>
                    {form.bought ? "กดปุ่มเพื่อย้ายไป My Manga ได้เลย" : "ติ๊กเมื่อซื้อแล้ว"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {form.bought && (
                    <button
                      onClick={() => setConfirmMove(true)}
                      style={{
                        padding: "7px 14px", borderRadius: 20,
                        background: "linear-gradient(135deg, #34d399, #059669)",
                        color: "#fff", border: "none", cursor: "pointer",
                        fontSize: 12, fontWeight: 700,
                        boxShadow: "0 2px 8px rgba(5,150,105,0.25)",
                      }}
                    >
                      📚 ย้ายไป My Manga
                    </button>
                  )}
                  <button
                    onClick={handleToggleBought}
                    style={{
                      width: 48, height: 26, borderRadius: 13,
                      background: form.bought
                        ? "linear-gradient(135deg, #34d399, #059669)"
                        : "#d1d5db",
                      border: "none", cursor: "pointer", position: "relative",
                      transition: "background 0.2s", padding: 0, flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 3,
                      left: form.bought ? 25 : 3,
                      width: 20, height: 20, borderRadius: "50%",
                      background: "#fff",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                      transition: "left 0.2s",
                    }} />
                  </button>
                </div>
              </div>
            )}
            {/* Type edit */}
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

            {/* ── สำนักพิมพ์ / ร้าน / ราคา / เล่ม ── */}
            {editing ? (
              <>
                {/* สำนักพิมพ์ */}
                <div style={infoBlock}>
                  <label style={labelStyle}>สำนักพิมพ์</label>
                  <input
                    style={inputStyle}
                    value={form.publisher ?? ""}
                    onChange={(e) => set("publisher", e.target.value)}
                    placeholder="เช่น Siam Inter Comics"
                    list="wish-detail-publisher-list"
                  />
                  <datalist id="wish-detail-publisher-list">
                    {publishers.map((p) => <option key={p} value={p} />)}
                  </datalist>
                </div>

                {/* ซื้อจากที่ไหน */}
                <div style={infoBlock}>
                  <label style={labelStyle}>ซื้อจากที่ไหน</label>
                  {storeCustom ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        value={form.store ?? ""}
                        onChange={(e) => set("store", e.target.value)}
                        placeholder="พิมพ์ชื่อร้าน"
                      />
                      <button
                        onClick={() => { setStoreCustom(false); set("store", ""); }}
                        style={{ padding: "0 10px", borderRadius: 9, border: "1.5px solid #d8edf8", background: "#f0f8ff", color: "#93c5e8", cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <select
                      value={form.store ?? ""}
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
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ ...infoBlock, flex: 1 }}>
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
                  <div style={{ ...infoBlock, flex: 1 }}>
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
                <div style={infoBlock}>
                  <label style={labelStyle}>เล่มที่ต้องการ</label>
                  <input
                    style={inputStyle}
                    value={form.volumes_wanted ?? ""}
                    onChange={(e) => set("volumes_wanted", e.target.value)}
                    placeholder="เช่น 3-5 หรือ 1,3,7"
                  />
                </div>
              </>
            ) : (
              /* View mode — แสดงเฉพาะถ้ามีข้อมูล */
              (form.publisher || form.store || form.price || form.volumes_total || form.volumes_wanted) && (
                <div style={{ ...infoBlock, display: "flex", flexDirection: "column", gap: 10 }}>
                  {form.publisher && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#93c5e8", fontWeight: 600 }}>🏢 สำนักพิมพ์</span>
                      <span style={{ fontSize: 13, color: "#1a5fa8", fontWeight: 600 }}>{form.publisher}</span>
                    </div>
                  )}
                  {form.store && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#93c5e8", fontWeight: 600 }}>🛒 ซื้อจาก</span>
                      <span style={{ fontSize: 13, color: "#1a5fa8", fontWeight: 600 }}>{form.store}</span>
                    </div>
                  )}
                  {form.price && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#93c5e8", fontWeight: 600 }}>💰 ราคา</span>
                      <span style={{ fontSize: 13, color: "#1a5fa8", fontWeight: 600 }}>{form.price.toLocaleString()} บาท</span>
                    </div>
                  )}
                  {(form.volumes_wanted || form.volumes_total) && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#93c5e8", fontWeight: 600 }}>📖 เล่ม</span>
                      <span style={{ fontSize: 13, color: "#1a5fa8", fontWeight: 600 }}>
                        {form.volumes_wanted ? `ต้องการเล่ม ${form.volumes_wanted}` : ""}
                        {form.volumes_wanted && form.volumes_total ? " / " : ""}
                        {form.volumes_total ? `ทั้งหมด ${form.volumes_total} เล่ม` : ""}
                      </span>
                    </div>
                  )}
                </div>
              )
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

            {!editing && (
              <p style={{ margin: 0, fontSize: 12, color: "#b0cfe8", textAlign: "right" }}>
                เพิ่มเมื่อ {addedDate}
              </p>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "14px 20px", borderTop: "1.5px solid #e8f4fc",
            display: "flex", justifyContent: "space-between", gap: 10,
            flexShrink: 0, flexWrap: "wrap",
          }}>
            <button
              onClick={() => { if (confirm("ลบออกจาก Wishlist?")) onDelete(item.id); }}
              style={{
                padding: "9px 16px", borderRadius: 20,
                background: "#fff0f0", color: "#dc2626",
                border: "1.5px solid #fca5a5", cursor: "pointer", fontWeight: 600, fontSize: 13,
              }}
            >
              🗑️ ลบ
            </button>

            <div style={{ display: "flex", gap: 8 }}>
              {editing ? (
                <>
                  <button
                    onClick={() => { setForm({ ...item }); setEditing(false); setPublisherCustom(false); setStoreCustom(false); }}
                    style={{ padding: "9px 16px", borderRadius: 20, background: "#f0f8ff", color: "#5b9bd5", border: "1.5px solid #b8d9f5", cursor: "pointer", fontWeight: 600 }}
                  >
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
                <button
                  onClick={() => setEditing(true)}
                  style={{ padding: "9px 20px", borderRadius: 20, background: "#7ec8f0", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}
                >
                  ✏️ แก้ไข
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm Move Modal ── */}
      {confirmMove && (
        <div
          onClick={() => setConfirmMove(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 200, backdropFilter: "blur(3px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 20, border: "2px solid #b8d9f5",
              width: "min(360px, 90vw)", padding: "28px 24px",
              display: "flex", flexDirection: "column", gap: 20, alignItems: "center",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 40 }}>📚</span>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#1a5fa8" }}>
                ย้ายไป My Manga?
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "#5b9bd5" }}>
                <strong style={{ display: "block" }}>&quot;{form.title}&quot;</strong>
                จะถูกเพิ่มใน My Manga และลบออกจาก Wishlist
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, width: "100%" }}>
              <button
                onClick={() => setConfirmMove(false)}
                style={{ flex: 1, padding: "10px", borderRadius: 20, background: "#f0f8ff", color: "#5b9bd5", border: "1.5px solid #b8d9f5", cursor: "pointer", fontWeight: 600 }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onMoveToShelf?.(form);
                  setConfirmMove(false);
                  onClose();
                }}
                style={{ flex: 1, padding: "10px", borderRadius: 20, background: "linear-gradient(135deg, #34d399, #059669)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, boxShadow: "0 4px 12px rgba(5,150,105,0.3)" }}
              >
                ✓ ย้ายเลย
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}