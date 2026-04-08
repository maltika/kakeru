"use client";

import { useState } from "react";
import { Book, BookType, SeriesStatus, ReadStatus, Format } from "./BookCard";

interface Props {
  onClose: () => void;
  onAdd: (book: Omit<Book, "id">) => Promise<void>;
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
};
const selectStyle = { ...inputStyle, background: "#fff" };

export default function AddBookModal({ onClose, onAdd }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<Omit<Book, "id">>({
    title: "",
    title_en: "",
    type: "manga",
    publisher: "",
    cover_url: "",
    series_status: "ongoing",
    format: "physical",
    total_volumes: undefined,
    owned_volumes: undefined,
    read_volume: undefined,
    read_status: "planned",
    rating: undefined,
    genre: "",
    notes: "",
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
          width: "min(600px, 95vw)", maxHeight: "90vh",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1.5px solid #e8f4fc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#1a5fa8", margin: 0 }}>➕ เพิ่มหนังสือ</p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#93c5e8" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ชื่อ */}
          <div>
            <label style={labelStyle}>ชื่อเรื่อง (ไทย) *</label>
            <input style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="เช่น ดาบพิฆาตอสูร" />
          </div>
          <div>
            <label style={labelStyle}>ชื่อเรื่อง (อังกฤษ/ญี่ปุ่น)</label>
            <input style={inputStyle} value={form.title_en} onChange={(e) => set("title_en", e.target.value)} placeholder="เช่น Kimetsu no Yaiba" />
          </div>

          {/* ประเภท + สำนักพิมพ์ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>ประเภท</label>
              <select style={selectStyle} value={form.type} onChange={(e) => set("type", e.target.value as BookType)}>
                <option value="manga">มังงะ/การ์ตูน</option>
                <option value="novel">นิยาย/หนังสือ</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>สำนักพิมพ์</label>
              <input style={inputStyle} value={form.publisher} onChange={(e) => set("publisher", e.target.value)} placeholder="เช่น Siam Inter" />
            </div>
          </div>

          {/* รูปปก */}
          <div>
            <label style={labelStyle}>รูปปก</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {form.cover_url && (
                <img src={form.cover_url} alt="cover" style={{ width: 60, height: 90, objectFit: "cover", borderRadius: 8, border: "1.5px solid #b8d9f5" }} />
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

          {/* สถานะเรื่อง + format */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>สถานะเรื่อง</label>
              <select style={selectStyle} value={form.series_status} onChange={(e) => set("series_status", e.target.value as SeriesStatus)}>
                <option value="ongoing">กำลังตีพิมพ์</option>
                <option value="completed">จบแล้ว</option>
                <option value="hiatus">หยุดตีพิมพ์</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>รูปแบบที่เก็บ</label>
              <select style={selectStyle} value={form.format} onChange={(e) => set("format", e.target.value as Format)}>
                <option value="physical">เล่มจริง</option>
                <option value="ebook">Ebook</option>
                <option value="both">ทั้งคู่</option>
              </select>
            </div>
          </div>

          {/* จำนวนเล่ม */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>เล่มทั้งหมด</label>
              <input style={inputStyle} type="number" min={1} value={form.total_volumes ?? ""} onChange={(e) => set("total_volumes", e.target.value ? Number(e.target.value) : undefined)} placeholder="-" />
            </div>
            <div>
              <label style={labelStyle}>เล่มที่มี</label>
              <input style={inputStyle} type="number" min={0} value={form.owned_volumes ?? ""} onChange={(e) => set("owned_volumes", e.target.value ? Number(e.target.value) : undefined)} placeholder="-" />
            </div>
            <div>
              <label style={labelStyle}>อ่านถึงเล่ม</label>
              <input style={inputStyle} type="number" min={0} value={form.read_volume ?? ""} onChange={(e) => set("read_volume", e.target.value ? Number(e.target.value) : undefined)} placeholder="-" />
            </div>
          </div>

          {/* สถานะการอ่าน + rating */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>สถานะการอ่าน</label>
              <select style={selectStyle} value={form.read_status} onChange={(e) => set("read_status", e.target.value as ReadStatus)}>
                <option value="planned">ยังไม่อ่าน</option>
                <option value="reading">กำลังอ่าน</option>
                <option value="completed">อ่านจบแล้ว</option>
                <option value="dropped">หยุดอ่าน</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>คะแนน (1-10)</label>
              <input style={inputStyle} type="number" min={1} max={10} value={form.rating ?? ""} onChange={(e) => set("rating", e.target.value ? Number(e.target.value) : undefined)} placeholder="-" />
            </div>
          </div>

          {/* แนวเรื่อง */}
          <div>
            <label style={labelStyle}>แนวเรื่อง</label>
            <input style={inputStyle} value={form.genre} onChange={(e) => set("genre", e.target.value)} placeholder="เช่น แฟนตาซี, แอ็กชั่น" />
          </div>

          {/* หมายเหตุ */}
          <div>
            <label style={labelStyle}>หมายเหตุส่วนตัว</label>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 70 }}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="โน้ตอะไรก็ได้..."
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
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}