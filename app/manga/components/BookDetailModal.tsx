"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Book, SeriesStatus, ReadStatus, Format, BookType, VolumeDetail, VolumeFormat } from "./BookCard";

interface Props {
  book: Book;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (book: Book) => Promise<void>;
}

// ── Responsive hook ───────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 640) {
  // initialize จาก window ทันที (ถ้ามี) เพื่อป้องกัน flash/wrong layout ตอน mount
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

// ── Design tokens ─────────────────────────────────────────────────────────────
const infoBlock = {
  padding: "14px 16px",
  background: "#f8fbff",
  borderRadius: 14,
  border: "1.5px solid #e8f2fb",
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: "#93c5e8",
  marginBottom: 4,
  display: "block" as const,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
};

const inputStyle = {
  width: "100%",
  padding: "7px 11px",
  borderRadius: 9,
  border: "1.5px solid #d8edf8",
  fontSize: 13,
  color: "#1a5fa8",
  outline: "none",
  boxSizing: "border-box" as const,
  background: "#fff",
  transition: "border-color 0.15s",
};

const selectStyle = { ...inputStyle };

// ── Format config ─────────────────────────────────────────────────────────────
const volumeFormatConfig: Record<VolumeFormat, {
  bg: string; activeBg: string; color: string; activeColor: string;
  border: string; activeBorder: string; label: string; icon: string;
}> = {
  physical: {
    bg: "#f0f8ff", activeBg: "#dbeeff", color: "#93c5e8", activeColor: "#1a5fa8",
    border: "#d8edf8", activeBorder: "#7ec8f0", label: "เล่มจริง", icon: "📚",
  },
  ebook: {
    bg: "#f0fff8", activeBg: "#d1fae8", color: "#6ee7b7", activeColor: "#065f46",
    border: "#bbf7d0", activeBorder: "#34d399", label: "Ebook", icon: "📱",
  },
  none: {
    bg: "#fafafa", activeBg: "#f1f5f9", color: "#cbd5e1", activeColor: "#64748b",
    border: "#e2e8f0", activeBorder: "#94a3b8", label: "ไม่มี", icon: "—",
  },
};

// ── Label maps ────────────────────────────────────────────────────────────────
const seriesStatusLabel: Record<SeriesStatus, string> = {
  ongoing: "กำลังตีพิมพ์", completed: "จบแล้ว", hiatus: "หยุดตีพิมพ์",
};
const readStatusLabel: Record<ReadStatus, string> = {
  planned: "ยังไม่อ่าน", reading: "กำลังอ่าน", completed: "อ่านจบแล้ว", dropped: "หยุดอ่าน",
};
const formatLabel: Record<Format, string> = {
  physical: "เล่มจริง", ebook: "Ebook", both: "ทั้งคู่",
};

// ── Missing Volumes Editor ────────────────────────────────────────────────────
function MissingVolumesEditor({ total, missing, extraNote, onChange }: {
  total?: number;
  missing: number[];
  extraNote: string;
  onChange: (missing: number[], extraNote: string) => void;
}) {
  const [customInput, setCustomInput] = useState("");

  function toggleVolume(vol: number) {
    const next = missing.includes(vol)
      ? missing.filter((v) => v !== vol)
      : [...missing, vol].sort((a, b) => a - b);
    onChange(next, extraNote);
  }

  function addCustom() {
    const nums = customInput
      .split(/[,\s]+/)
      .map((s) => parseInt(s))
      .filter((n) => !isNaN(n) && n > 0 && !missing.includes(n));
    if (nums.length === 0) return;
    onChange([...missing, ...nums].sort((a, b) => a - b), extraNote);
    setCustomInput("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {total && total > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {Array.from({ length: total }, (_, i) => i + 1).map((vol) => {
            const checked = missing.includes(vol);
            return (
              <button
                key={vol}
                onClick={() => toggleVolume(vol)}
                style={{
                  width: 36, height: 36, borderRadius: 9, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", border: "1.5px solid",
                  borderColor: checked ? "#fca5a5" : "#d8edf8",
                  background: checked ? "#fff0f0" : "#f8fbff",
                  color: checked ? "#dc2626" : "#7ab0d4",
                  transition: "all 0.15s",
                  transform: checked ? "scale(1.08)" : "scale(1)",
                  boxShadow: checked ? "0 2px 8px #fca5a544" : "none",
                }}
              >
                {vol}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustom()}
          placeholder="พิมพ์เลขเล่มเพิ่ม เช่น 3, 8, 12"
        />
        <button
          onClick={addCustom}
          style={{
            padding: "7px 16px", borderRadius: 9,
            background: "linear-gradient(135deg, #7ec8f0, #5b9bd5)",
            color: "#fff", border: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 12, whiteSpace: "nowrap",
            boxShadow: "0 2px 8px #7ec8f033",
          }}
        >
          + เพิ่ม
        </button>
      </div>

      {missing.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 5,
          padding: "8px 12px", background: "#fff5f5",
          borderRadius: 10, border: "1.5px solid #fca5a5",
        }}>
          <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 700, alignSelf: "center", marginRight: 2 }}>
            ขาด:
          </span>
          {missing.map((vol) => (
            <span
              key={vol}
              onClick={() => toggleVolume(vol)}
              style={{
                fontSize: 12, padding: "2px 9px", borderRadius: 20,
                background: "#fee2e2", color: "#b91c1c",
                cursor: "pointer", fontWeight: 700,
                border: "1px solid #fca5a5",
              }}
            >
              เล่ม {vol} ✕
            </span>
          ))}
        </div>
      )}

      <input
        style={inputStyle}
        value={extraNote}
        onChange={(e) => onChange(missing, e.target.value)}
        placeholder="หมายเหตุ เช่น สั่งแล้วรอของ, edition พิเศษ..."
      />
    </div>
  );
}

// ── Volume Details Editor ─────────────────────────────────────────────────────
function VolumeDetailsEditor({ total, missing, details, onChange }: {
  total?: number;
  missing: number[];
  details: VolumeDetail[];
  onChange: (d: VolumeDetail[]) => void;
}) {
  const [bulkInput, setBulkInput] = useState("");

  if (!total || total <= 0) return (
    <div style={{
      padding: "32px 16px", textAlign: "center", color: "#93c5e8",
      background: "#f8fbff", borderRadius: 12, border: "1.5px dashed #d8edf8",
    }}>
      <p style={{ margin: 0, fontSize: 14 }}>กรุณาระบุจำนวนเล่มทั้งหมดก่อนครับ</p>
    </div>
  );

  const ownedVolumes = Array.from({ length: total }, (_, i) => i + 1)
    .filter((vol) => !missing.includes(vol));

  if (ownedVolumes.length === 0) return (
    <div style={{
      padding: "32px 16px", textAlign: "center", color: "#93c5e8",
      background: "#f8fbff", borderRadius: 12, border: "1.5px dashed #d8edf8",
    }}>
      <p style={{ margin: 0, fontSize: 14 }}>ยังไม่มีเล่มที่ครบ ลองระบุเล่มที่ขาดก่อนนะครับ</p>
    </div>
  );

  function getDetail(vol: number): VolumeDetail {
    return details.find((d) => d.volume === vol) ?? { volume: vol, format: "none" };
  }

  function updateDetail(vol: number, patch: Partial<VolumeDetail>) {
    const existing = details.find((d) => d.volume === vol);
    const updated: VolumeDetail = { ...getDetail(vol), ...patch };
    const next = existing
      ? details.map((d) => (d.volume === vol ? updated : d))
      : [...details, updated].sort((a, b) => a.volume - b.volume);
    onChange(next);
  }

  function handleBulkApply() {
    const regex = /(\d+)-(\d+)\s*(physical|ebook|none)/i;
    const match = bulkInput.match(regex);
    if (!match) {
      alert("รูปแบบไม่ถูกต้องครับ ตัวอย่าง: 1-10 physical");
      return;
    }
    const start = parseInt(match[1]);
    const end = parseInt(match[2]);
    const format = match[3].toLowerCase() as VolumeFormat;
    const nextDetails = [...details];
    for (let v = start; v <= end; v++) {
      if (ownedVolumes.includes(v)) {
        const existingIdx = nextDetails.findIndex(d => d.volume === v);
        const updatedItem = { volume: v, format };
        if (existingIdx > -1) {
          nextDetails[existingIdx] = updatedItem;
        } else {
          nextDetails.push(updatedItem);
        }
      }
    }
    onChange(nextDetails.sort((a, b) => a.volume - b.volume));
    setBulkInput("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{
        padding: "14px",
        background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
        borderRadius: 16,
        border: "1.5px solid #bae6fd",
        boxShadow: "0 4px 12px rgba(186,230,253,0.2)"
      }}>
        <label style={{ ...labelStyle, color: "#0369a1", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          ✨ ทางลัดเลือกหลายเล่ม (Bulk Update)
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ ...inputStyle, flex: 1, border: "1.5px solid #7dd3fc" }}
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleBulkApply()}
            placeholder="เช่น 1-12 physical"
          />
          <button
            onClick={handleBulkApply}
            style={{
              padding: "0 14px",
              borderRadius: 10,
              background: "#0284c7",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            ตกลง
          </button>
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 10, color: "#0ea5e9", fontWeight: 600 }}>
          รูปแบบ: [เริ่ม]-[จบ] [ประเภท] (physical / ebook / none)
        </p>
      </div>

      <div style={{ height: "1px", background: "#e8f2fb" }} />

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        maxHeight: "450px",
        overflowY: "auto",
        paddingRight: "4px",
        scrollbarWidth: "thin",
      }}>
        {ownedVolumes.map((vol) => {
          const d = getDetail(vol);
          const c = volumeFormatConfig[d.format];
          return (
            <div key={vol} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 12,
              background: "#fff",
              border: `1.5px solid ${d.format !== "none" ? c.activeBorder : "#e8f2fb"}`,
              boxShadow: d.format !== "none" ? `0 2px 8px ${c.activeBorder}33` : "0 1px 3px #b8d9f518",
              transition: "all 0.2s ease",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: d.format !== "none" ? c.activeBg : "#f0f8ff",
                fontSize: 12, fontWeight: 800,
                color: d.format !== "none" ? c.activeColor : "#5b9bd5",
                border: `1.5px solid ${d.format !== "none" ? c.activeBorder : "#d8edf8"}`,
              }}>
                {vol}
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", gap: 5 }}>
                {(["physical", "ebook", "none"] as VolumeFormat[]).map((f) => {
                  const fc = volumeFormatConfig[f];
                  const active = d.format === f;
                  return (
                    <button
                      key={f}
                      onClick={() => updateDetail(vol, { format: f })}
                      title={fc.label}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        justifyContent: "center", gap: 2,
                        width: 52, height: 42, borderRadius: 10, cursor: "pointer",
                        border: `1.5px solid ${active ? fc.activeBorder : fc.border}`,
                        background: active ? fc.activeBg : fc.bg,
                        color: active ? fc.activeColor : fc.color,
                        transition: "all 0.15s ease",
                        transform: active ? "scale(1.05)" : "scale(1)",
                        boxShadow: active ? `0 3px 10px ${fc.activeBorder}55` : "none",
                      }}
                    >
                      <span style={{ fontSize: 15, lineHeight: 1 }}>{fc.icon}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.02em" }}>{fc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Volume Details View (read-only) ───────────────────────────────────────────
function VolumeDetailsView({ total, details, missing }: {
  total?: number;
  details: VolumeDetail[];
  missing: number[];
}) {
  if (!total || total <= 0) return null;

  const ownedVols = Array.from({ length: total }, (_, i) => i + 1)
    .filter((v) => !missing.includes(v));

  const counts = { physical: 0, ebook: 0 };
  ownedVols.forEach((vol) => {
    const fmt = details.find((x) => x.volume === vol)?.format ?? "none";
    if (fmt === "physical") counts.physical++;
    if (fmt === "ebook") counts.ebook++;
  });

  const displayFormats: VolumeFormat[] = ["physical", "ebook"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: "8px 12px",
        alignItems: "center",
        padding: "12px 16px",
        borderRadius: 12,
        background: "#f8fbff",
        border: "1.5px solid #e8f2fb",
      }}>
        {displayFormats.map((fmt) => {
          const c = volumeFormatConfig[fmt];
          const count = fmt === "physical" ? counts.physical : counts.ebook;
          return [
            <span key={`dot-${fmt}`} style={{
              width: 10, height: 10, borderRadius: "50%",
              background: c.activeBorder, display: "inline-block",
            }} />,
            <span key={`label-${fmt}`} style={{ fontSize: 13, color: "#5b9bd5", fontWeight: 600 }}>
              {c.label}
            </span>,
            <span key={`count-${fmt}`} style={{ fontSize: 13, color: "#1a5fa8", fontWeight: 700 }}>
              {count} เล่ม
            </span>,
          ];
        })}
      </div>

      {/* Responsive grid: จอเล็กแสดง 3-4 ต่อแถว, จอกลางขึ้นไป 5 ต่อแถว */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
        gap: 8,
      }}>
        {ownedVols.map((vol) => {
          const fmt = details.find((x) => x.volume === vol)?.format ?? "none";
          const c = volumeFormatConfig[fmt];
          return (
            <div key={vol} style={{
              height: 72,
              borderRadius: 12,
              overflow: "hidden",
              border: `1.5px solid ${fmt !== "none" ? c.activeBorder : "#e0eef8"}`,
              background: fmt !== "none" ? c.activeBg : "#f0f6fc",
              boxShadow: fmt !== "none" ? `0 2px 8px ${c.activeBorder}33` : "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transition: "transform 0.2s ease",
            }}>
              <div style={{
                width: "100%", height: 4,
                background: fmt !== "none" ? c.activeBorder : "#d0e8f5",
              }} />
              <div style={{ padding: "6px 4px 8px", textAlign: "center" }}>
                <div style={{
                  fontSize: 10, fontWeight: 800,
                  color: fmt !== "none" ? c.activeColor : "#5b9bd5"
                }}>
                  เล่ม {vol}
                </div>
                <div style={{ fontSize: 15, marginTop: 3 }}>
                  {fmt === "physical" ? "📚" : fmt === "ebook" ? "📱" : "—"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function BookDetailModal({ book, onClose, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Book>(book);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "volumes">("info");
  const isMobile = useIsMobile(640);

  const isMissingVisible =
    form.total_volumes !== undefined &&
    form.owned_volumes !== undefined &&
    form.owned_volumes < form.total_volumes;

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

  function set<K extends keyof Book>(key: K, value: Book[K]) {
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

  return (
    <div
      style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.25)",
        display: "flex", alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        zIndex: 1000, backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: isMobile ? "24px 24px 0 0" : 28,
          border: "2px solid #d8edf8",
          width: isMobile ? "100%" : "95%",
          maxWidth: isMobile ? "100%" : 950,
          maxHeight: isMobile ? "95vh" : "90vh",
          // จอเล็ก: column (รูปบน, ข้อมูลล่าง) / จอใหญ่: row เหมือนเดิม
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 0 : 28,
          padding: isMobile ? "20px 16px 24px" : 30,
          position: "relative",
          boxShadow: "0 32px 64px -12px rgba(124,194,240,0.25), 0 0 0 1px #e8f2fb",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── รูปปก ── */}
        {isMobile ? (
          // มือถือ: รูปเล็กๆ แนวนอน ไม่กินพื้นที่มาก
          <div style={{
            display: "flex", gap: 14, alignItems: "flex-start",
            marginBottom: 16,
          }}>
            <div style={{
              flex: "0 0 80px", height: 120,
              position: "relative", borderRadius: 14, overflow: "hidden",
              background: "#eef6fd",
              boxShadow: "0 4px 12px rgba(124,194,240,0.2)",
            }}>
              {form.cover_url ? (
                <Image src={form.cover_url} alt={form.title} fill style={{ objectFit: "cover" }} />
              ) : (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  height: "100%", color: "#b8d9f5", fontSize: 11, flexDirection: "column", gap: 4,
                }}>
                  <span style={{ fontSize: 24 }}>📖</span>
                  <span>ไม่มีรูปปก</span>
                </div>
              )}
            </div>
            {/* ชื่อข้างรูปบนมือถือ */}
            <div style={{ flex: 1, paddingTop: 4 }}>
              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <input style={{ ...inputStyle, fontSize: 15, fontWeight: 700 }} value={form.title} onChange={(e) => set("title", e.target.value)} />
                  <input style={inputStyle} value={form.title_en ?? ""} onChange={(e) => set("title_en", e.target.value)} placeholder="ชื่ออังกฤษ/ญี่ปุ่น" />
                </div>
              ) : (
                <div>
                  <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1a5fa8", lineHeight: 1.3 }}>{book.title}</h1>
                  {book.title_en && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#7ab0d4" }}>{book.title_en}</p>}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Desktop: รูปใหญ่ด้านซ้าย
          <div style={{
            flex: "0 0 30%", position: "relative", aspectRatio: "2/3",
            borderRadius: 20, overflow: "hidden", background: "#eef6fd",
            alignSelf: "flex-start",
            boxShadow: "0 8px 24px rgba(124,194,240,0.2)",
          }}>
            {form.cover_url ? (
              <Image src={form.cover_url} alt={form.title} fill style={{ objectFit: "cover" }} />
            ) : (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: "100%", color: "#b8d9f5", fontSize: 13, flexDirection: "column", gap: 8,
              }}>
                <span style={{ fontSize: 32 }}>📖</span>
                <span>ไม่มีรูปปก</span>
              </div>
            )}
          </div>
        )}

        {/* ── Right panel (หรือ bottom panel บนมือถือ) ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", minWidth: 0 }}>

          {/* ชื่อ (desktop only — มือถือแสดงข้างบนแล้ว) */}
          {!isMobile && (
            <>
              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <input style={{ ...inputStyle, fontSize: 18, fontWeight: 700 }} value={form.title} onChange={(e) => set("title", e.target.value)} />
                  <input style={inputStyle} value={form.title_en ?? ""} onChange={(e) => set("title_en", e.target.value)} placeholder="ชื่ออังกฤษ/ญี่ปุ่น" />
                </div>
              ) : (
                <div>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a5fa8", lineHeight: 1.3 }}>{book.title}</h1>
                  {book.title_en && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#7ab0d4" }}>{book.title_en}</p>}
                </div>
              )}
            </>
          )}

          {/* Tab bar */}
          <div style={{
            display: "flex",
            flexDirection: "row",
            gap: 0,
            borderRadius: 14,
            overflow: "hidden",
            border: "1.5px solid #d8edf8",
            alignSelf: isMobile ? "stretch" : "flex-start",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(124,194,240,0.1)",
          }}>
            {(["info", "volumes"] as const).map((tab, i) => {
              const active = activeTab === tab;
              const labels = { info: "📋 ข้อมูล", volumes: "📦 รายเล่ม" };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: "10px 20px",
                    fontWeight: 700, fontSize: 13, cursor: "pointer",
                    border: "none",
                    borderRight: i === 0 ? "1.5px solid #d8edf8" : "none",
                    background: active
                      ? "linear-gradient(135deg, #7ec8f0 0%, #5b9bd5 100%)"
                      : "#f8fbff",
                    color: active ? "#fff" : "#93c5e8",
                    transition: "all 0.2s ease",
                    letterSpacing: "0.01em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {/* ══ TAB: ข้อมูลทั่วไป ══ */}
          {activeTab === "info" && (
            <>
              {/* ข้อมูลหลัก */}
              <div style={{
                ...infoBlock,
                display: "grid",
                // จอเล็ก: 1 คอลัมน์ / จอใหญ่: 2 คอลัมน์
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 10,
              }}>
                {editing ? (
                  <>
                    <div>
                      <label style={labelStyle}>ประเภท</label>
                      <select style={selectStyle} value={form.type} onChange={(e) => set("type", e.target.value as BookType)}>
                        <option value="manga">มังงะ/การ์ตูน</option>
                        <option value="novel">นิยาย/หนังสือ</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>สำนักพิมพ์</label>
                      <input style={inputStyle} value={form.publisher ?? ""} onChange={(e) => set("publisher", e.target.value)} />
                    </div>
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
                    <div>
                      <label style={labelStyle}>แนวเรื่อง</label>
                      <input style={inputStyle} value={form.genre ?? ""} onChange={(e) => set("genre", e.target.value)} />
                    </div>
                    <div style={{ gridColumn: isMobile ? "1" : "1 / -1" }}>
                      <label style={labelStyle}>รูปปก</label>
                      <label style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "7px 16px", borderRadius: 9,
                        background: "#f0f8ff", color: uploading ? "#93c5e8" : "#5b9bd5",
                        border: "1.5px solid #d8edf8", cursor: uploading ? "wait" : "pointer",
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {uploading ? "⏳ กำลังอัปโหลด..." : "📁 เปลี่ยนรูปปก"}
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} disabled={uploading} />
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, fontSize: 13 }}><span style={{ color: "#93c5e8", fontWeight: 600 }}>ประเภท</span><br /><strong style={{ color: "#1a5fa8" }}>{book.type === "manga" ? "มังงะ/การ์ตูน" : "นิยาย/หนังสือ"}</strong></p>
                    <p style={{ margin: 0, fontSize: 13 }}><span style={{ color: "#93c5e8", fontWeight: 600 }}>สำนักพิมพ์</span><br /><strong style={{ color: "#1a5fa8" }}>{book.publisher || "—"}</strong></p>
                    <p style={{ margin: 0, fontSize: 13 }}><span style={{ color: "#93c5e8", fontWeight: 600 }}>สถานะเรื่อง</span><br /><strong style={{ color: "#1a5fa8" }}>{seriesStatusLabel[book.series_status]}</strong></p>
                    <p style={{ margin: 0, fontSize: 13 }}><span style={{ color: "#93c5e8", fontWeight: 600 }}>รูปแบบ</span><br /><strong style={{ color: "#1a5fa8" }}>{formatLabel[book.format]}</strong></p>
                    <p style={{ margin: 0, fontSize: 13 }}><span style={{ color: "#93c5e8", fontWeight: 600 }}>แนวเรื่อง</span><br /><strong style={{ color: "#1a5fa8" }}>{book.genre || "—"}</strong></p>
                  </>
                )}
              </div>

              {/* จำนวนเล่ม */}
              <div style={{ ...infoBlock, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {editing ? (
                  <>
                    <div>
                      <label style={labelStyle}>เล่มทั้งหมด</label>
                      <input style={inputStyle} type="number" value={form.total_volumes ?? ""} onChange={(e) => set("total_volumes", e.target.value ? Number(e.target.value) : undefined)} />
                    </div>
                    <div>
                      <label style={labelStyle}>เล่มที่มี</label>
                      <input style={inputStyle} type="number" value={form.owned_volumes ?? ""} onChange={(e) => set("owned_volumes", e.target.value ? Number(e.target.value) : undefined)} />
                    </div>
                    <div>
                      <label style={labelStyle}>อ่านถึงเล่ม</label>
                      <input style={inputStyle} type="number" value={form.read_volume ?? ""} onChange={(e) => set("read_volume", e.target.value ? Number(e.target.value) : undefined)} />
                    </div>
                  </>
                ) : (
                  <>
                    {[
                      { val: book.total_volumes, label: "เล่มทั้งหมด", color: "#1a5fa8" },
                      { val: book.owned_volumes, label: "เล่มที่มี", color: "#5b9bd5" },
                      { val: book.read_volume, label: "อ่านถึงเล่ม", color: "#7ec8f0" },
                    ].map(({ val, label, color }) => (
                      <div key={label} style={{
                        textAlign: "center", padding: "6px 0",
                        borderRadius: 10, background: "#fff",
                        border: "1.5px solid #e8f2fb",
                      }}>
                        <p style={{ margin: 0, fontSize: isMobile ? 20 : 26, fontWeight: 800, color }}>{val ?? "—"}</p>
                        <p style={{ margin: "2px 0 0", fontSize: isMobile ? 9 : 11, color: "#93c5e8", fontWeight: 600 }}>{label}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* ขาดเล่มไหน */}
              {isMissingVisible && (
                <div style={{ ...infoBlock, borderColor: "#fca5a5", background: "#fff8f8" }}>
                  <label style={{ ...labelStyle, color: "#dc2626" }}>
                    📦 เล่มที่ขาด — {form.total_volumes! - form.owned_volumes!} เล่ม
                  </label>
                  {editing ? (
                    <MissingVolumesEditor
                      total={form.total_volumes}
                      missing={form.missing_volumes ?? []}
                      extraNote={form.missing_notes ?? ""}
                      onChange={(m, n) => { set("missing_volumes", m); set("missing_notes", n); }}
                    />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {book.missing_volumes && book.missing_volumes.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {book.missing_volumes.map((vol) => (
                            <span key={vol} style={{
                              fontSize: 12, padding: "3px 10px", borderRadius: 20,
                              background: "#fee2e2", color: "#b91c1c", fontWeight: 700,
                              border: "1px solid #fca5a5",
                            }}>
                              เล่ม {vol}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: 13, color: "#aaa" }}>ยังไม่ได้ระบุ</p>
                      )}
                      {book.missing_notes && (
                        <p style={{ margin: 0, fontSize: 12, color: "#888" }}>💬 {book.missing_notes}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* สถานะอ่าน + rating */}
              <div style={{ ...infoBlock, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
                {editing ? (
                  <>
                    <div style={{ flex: "1 1 140px" }}>
                      <label style={labelStyle}>สถานะการอ่าน</label>
                      <select style={selectStyle} value={form.read_status} onChange={(e) => set("read_status", e.target.value as ReadStatus)}>
                        <option value="planned">ยังไม่อ่าน</option>
                        <option value="reading">กำลังอ่าน</option>
                        <option value="completed">อ่านจบแล้ว</option>
                        <option value="dropped">หยุดอ่าน</option>
                      </select>
                    </div>
                    <div style={{ flex: "1 1 100px" }}>
                      <label style={labelStyle}>คะแนน (1–10)</label>
                      <input style={inputStyle} type="number" min={1} max={10} value={form.rating ?? ""} onChange={(e) => set("rating", e.target.value ? Number(e.target.value) : undefined)} />
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{
                      fontSize: 13, fontWeight: 700, color: "#5b9bd5",
                      background: "#f0f8ff", padding: "5px 12px",
                      borderRadius: 20, border: "1.5px solid #d8edf8",
                    }}>
                      📖 {readStatusLabel[book.read_status]}
                    </span>
                    {book.rating && (
                      <span style={{
                        fontSize: 13, fontWeight: 700, color: "#b45309",
                        background: "#fffbeb", padding: "5px 12px",
                        borderRadius: 20, border: "1.5px solid #fde68a",
                      }}>
                        ⭐ {book.rating}/10
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* หมายเหตุ */}
              {(editing || book.notes) && (
                <div style={infoBlock}>
                  <label style={labelStyle}>หมายเหตุ</label>
                  {editing ? (
                    <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
                  ) : (
                    <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>{book.notes}</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ══ TAB: รายละเอียดรายเล่ม ══ */}
          {activeTab === "volumes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(["physical", "ebook"] as VolumeFormat[]).map((f) => {
                  const c = volumeFormatConfig[f];
                  return (
                    <span key={f} style={{
                      fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700,
                      background: c.activeBg, color: c.activeColor,
                      border: `1.5px solid ${c.activeBorder}`,
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      {c.icon} {c.label}
                    </span>
                  );
                })}
              </div>

              {editing ? (
                <VolumeDetailsEditor
                  total={form.total_volumes}
                  missing={form.missing_volumes ?? []}
                  details={form.volume_details ?? []}
                  onChange={(d) => set("volume_details", d)}
                />
              ) : (
                <VolumeDetailsView
                  total={book.total_volumes}
                  details={book.volume_details ?? []}
                  missing={book.missing_volumes ?? []}
                />
              )}
            </div>
          )}

          {/* ── Actions ── */}
          <div style={{
            display: "flex", gap: 10,
            justifyContent: isMobile ? "stretch" : "flex-end",
            marginTop: "auto", paddingTop: 4,
          }}>
            {editing ? (
              <>
                <button
                  onClick={() => { setEditing(false); setForm(book); }}
                  style={{
                    flex: isMobile ? 1 : undefined,
                    padding: "9px 20px", borderRadius: 22, fontWeight: 700, fontSize: 13,
                    background: "#f0f8ff", color: "#5b9bd5",
                    border: "1.5px solid #d8edf8", cursor: "pointer",
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    flex: isMobile ? 2 : undefined,
                    padding: "9px 24px", borderRadius: 22, fontWeight: 700, fontSize: 13,
                    background: saving ? "#b8d9f5" : "linear-gradient(135deg, #7ec8f0, #5b9bd5)",
                    color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer",
                    boxShadow: saving ? "none" : "0 4px 12px #7ec8f055",
                    transition: "all 0.2s",
                  }}
                >
                  {saving ? "กำลังบันทึก..." : "💾 บันทึก"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { if (confirm("ลบเรื่องนี้จริงๆ เหรอ?")) { onDelete(book.id); onClose(); } }}
                  style={{
                    flex: isMobile ? 1 : undefined,
                    padding: "9px 20px", borderRadius: 22, fontWeight: 700, fontSize: 13,
                    background: "#fff5f5", color: "#dc2626",
                    border: "1.5px solid #fca5a5", cursor: "pointer",
                  }}
                >
                  ลบ
                </button>
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    flex: isMobile ? 2 : undefined,
                    padding: "9px 24px", borderRadius: 22, fontWeight: 700, fontSize: 13,
                    background: "linear-gradient(135deg, #7ec8f0, #5b9bd5)",
                    color: "#fff", border: "none", cursor: "pointer",
                    boxShadow: "0 4px 12px #7ec8f055",
                  }}
                >
                  ✏️ แก้ไข
                </button>
              </>
            )}
          </div>
        </div>

        {/* ปุ่มปิด */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14,
            background: "#f0f8ff", border: "1.5px solid #d8edf8",
            borderRadius: "50%", width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, cursor: "pointer", color: "#93c5e8",
            lineHeight: 1, zIndex: 10,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}