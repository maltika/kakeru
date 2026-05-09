"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Anime, AnimeStatus, RewatchSession, statusConfig } from "./AnimeCard";
import { WatchSourcePicker } from "./WatchSourcePicker";

interface Props {
  anime: Anime;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (anime: Anime) => Promise<void>;
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

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
  marginBottom: 6,
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
};

const selectStyle = { ...inputStyle };

// ── Rewatch Session Editor ────────────────────────────────────────────────────
function RewatchEditor({
  sessions,
  onChange,
}: {
  sessions: RewatchSession[];
  onChange: (s: RewatchSession[]) => void;
}) {
  function update(i: number, patch: Partial<RewatchSession>) {
    const next = sessions.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    onChange(next);
  }

  function add() {
    onChange([...sessions, { start_date: "", end_date: "", note: "" }]);
  }

  function remove(i: number) {
    onChange(sessions.filter((_, idx) => idx !== i));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sessions.map((s, i) => (
        <div
          key={i}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            background: "#fff",
            border: "1.5px solid #d8edf8",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            position: "relative",
          }}
        >
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 2,
          }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#5b9bd5" }}>
              รอบที่ {i + 1}
            </span>
            <button
              onClick={() => remove(i)}
              style={{
                background: "#fff5f5", border: "1px solid #fca5a5",
                borderRadius: 8, padding: "2px 8px",
                fontSize: 11, color: "#dc2626", cursor: "pointer", fontWeight: 700,
              }}
            >
              ลบ
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ ...labelStyle, fontSize: 10 }}>วันเริ่ม</label>
              <input
                style={inputStyle}
                type="date"
                value={s.start_date ?? ""}
                onChange={(e) => update(i, { start_date: e.target.value })}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: 10 }}>วันจบ</label>
              <input
                style={inputStyle}
                type="date"
                value={s.end_date ?? ""}
                onChange={(e) => update(i, { end_date: e.target.value })}
              />
            </div>
          </div>
          <input
            style={inputStyle}
            value={s.note ?? ""}
            onChange={(e) => update(i, { note: e.target.value })}
            placeholder="โน้ต เช่น ดูกับเพื่อน, rewatch เพราะชอบมาก..."
          />
        </div>
      ))}
      <button
        onClick={add}
        style={{
          padding: "9px", borderRadius: 10,
          background: "#f0f8ff", color: "#5b9bd5",
          border: "1.5px dashed #b8d9f5",
          fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}
      >
        + เพิ่มรอบใหม่
      </button>
    </div>
  );
}

// ── Rewatch Session View ──────────────────────────────────────────────────────
function RewatchView({ sessions }: { sessions: RewatchSession[] }) {
  if (sessions.length === 0)
    return <p style={{ margin: 0, fontSize: 13, color: "#b8d9f5" }}>ยังไม่มีประวัติการดู</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {sessions.map((s, i) => {
        const days =
          s.start_date && s.end_date
            ? Math.ceil(
              (new Date(s.end_date).getTime() - new Date(s.start_date).getTime()) /
              (1000 * 60 * 60 * 24)
            )
            : null;
        return (
          <div
            key={i}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "#fff",
              border: "1.5px solid #e8f2fb",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 800, color: "#fff",
                background: "linear-gradient(135deg, #7ec8f0, #5b9bd5)",
                padding: "2px 10px", borderRadius: 20,
              }}>
                รอบ {i + 1}
              </span>
              {days !== null && (
                <span style={{ fontSize: 11, color: "#93c5e8", fontWeight: 600 }}>
                  {days} วัน
                </span>
              )}
            </div>
            {(s.start_date || s.end_date) && (
              <p style={{ margin: 0, fontSize: 12, color: "#5b9bd5", fontWeight: 600 }}>
                {s.start_date ?? "?"} → {s.end_date ?? "?"}
              </p>
            )}
            {s.note && (
              <p style={{ margin: 0, fontSize: 12, color: "#888", lineHeight: 1.5 }}>
                {s.note}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function AnimeDetailModal({ anime, onClose, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Anime>(anime);
  const [saving, setSaving] = useState(false);
  const isMobile = useIsMobile(640);

  function set<K extends keyof Anime>(key: K, value: Anime[K]) {
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

  const status = statusConfig[form.status];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        backgroundColor: "rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        zIndex: 1000, backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#fff",
          borderRadius: isMobile ? "24px 24px 0 0" : 28,
          border: "2px solid #d8edf8",
          width: isMobile ? "100%" : "95%",
          maxWidth: isMobile ? "100%" : 820,
          maxHeight: isMobile ? "95vh" : "90vh",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 0 : 24,
          padding: isMobile ? "20px 16px 24px" : 28,
          position: "relative",
          boxShadow: "0 32px 64px -12px rgba(124,194,240,0.25)",
          overflow: "hidden",
        }}
      >
        {/* ── Cover ── */}
        {isMobile ? (
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16, paddingRight: 36 }}>
            <div style={{
              flex: "0 0 80px", aspectRatio: "2/3",
              position: "relative", borderRadius: 14, overflow: "hidden",
              background: "#eef6fd", boxShadow: "0 4px 12px rgba(124,194,240,0.2)",
            }}>
              {form.cover_url ? (
                <Image src={form.cover_url} alt={form.title} fill style={{ objectFit: "cover" }} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#b8d9f5", fontSize: 24 }}>🎌</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1a5fa8", lineHeight: 1.3 }}>
                {anime.title}
              </h1>
              {anime.title_en && (
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#7ab0d4" }}>{anime.title_en}</p>
              )}
              <div style={{
                marginTop: 8, display: "inline-flex", alignItems: "center",
                padding: "4px 12px", borderRadius: 20,
                background: status.bg, border: `1.5px solid ${status.border}`,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: status.color }}>{status.label}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            flex: "0 0 26%", position: "relative", aspectRatio: "2/3",
            borderRadius: 20, overflow: "hidden", background: "#eef6fd",
            alignSelf: "flex-start", boxShadow: "0 8px 24px rgba(124,194,240,0.2)",
          }}>
            {form.cover_url ? (
              <Image src={form.cover_url} alt={form.title} fill style={{ objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#b8d9f5", fontSize: 32, flexDirection: "column", gap: 8 }}>
                <span>🎌</span>
                <span style={{ fontSize: 13 }}>ไม่มีรูปปก</span>
              </div>
            )}
          </div>
        )}

        {/* ── Right panel ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", minWidth: 0 }}>

          {/* ชื่อ (desktop) */}
          {!isMobile && (
            editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input style={{ ...inputStyle, fontSize: 18, fontWeight: 700 }} value={form.title} onChange={(e) => set("title", e.target.value)} />
                <input style={inputStyle} value={form.title_en ?? ""} onChange={(e) => set("title_en", e.target.value)} placeholder="ชื่ออังกฤษ/ญี่ปุ่น" />
              </div>
            ) : (
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a5fa8" }}>{anime.title}</h1>
                {anime.title_en && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#7ab0d4" }}>{anime.title_en}</p>}
                <div style={{
                  marginTop: 8, display: "inline-flex",
                  padding: "4px 14px", borderRadius: 20,
                  background: status.bg, border: `1.5px solid ${status.border}`,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: status.color }}>{status.label}</span>
                </div>
              </div>
            )
          )}

          {/* ── Info block ── */}
          {editing ? (
            <div style={{ ...infoBlock, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={labelStyle}>จำนวนตอนทั้งหมด</label>
                <input style={inputStyle} type="number" min={0} value={form.total_episodes ?? ""} onChange={(e) => set("total_episodes", e.target.value ? Number(e.target.value) : undefined)} placeholder="-" />
              </div>
              <div>
                <label style={labelStyle}>แหล่งที่ดู</label>
                <WatchSourcePicker
                  value={form.watch_source ?? ""}
                  onChange={(v) => set("watch_source", v)}
                />
              </div>
            </div>
          ) : (
            <div style={{ ...infoBlock, display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { label: "ประเภท", value: form.type === "movie" ? "🎬 Movie" : "📺 Series" },
                { label: "Studio", value: form.studio },
                { label: "Genre", value: form.genre },
                { label: "Season", value: form.season },
                { label: "ตอนทั้งหมด", value: form.total_episodes ? `${form.total_episodes} ตอน` : undefined },
                { label: "แหล่งที่ดู", value: form.watch_source },
              ]
                .filter((i) => i.value)
                .map(({ label, value }, idx, arr) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0",
                    borderBottom: idx < arr.length - 1 ? "1px solid #f0f6fb" : "none",
                  }}>
                    <span style={{ fontSize: 12, color: "#93c5e8", fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 13, color: "#1a5fa8", fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
            </div>
          )}

          {/* Stats row 1 */}
          {editing ? (
            <div style={{ ...infoBlock, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>สถานะการดู</label>
                <select style={selectStyle} value={form.status} onChange={(e) => set("status", e.target.value as AnimeStatus)}>
                  <option value="planned">ยังไม่ดู</option>
                  <option value="watching">กำลังดู</option>
                  <option value="completed">ดูจบแล้ว</option>
                  <option value="dropped">หยุดดู</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>ดูถึงตอนที่</label>
                <input style={inputStyle} type="number" min={0} value={form.watched_episodes ?? ""} onChange={(e) => set("watched_episodes", e.target.value ? Number(e.target.value) : undefined)} placeholder="-" />
              </div>
              <div>
                <label style={labelStyle}>วันที่เริ่มดู</label>
                <input style={inputStyle} type="date" value={form.start_date ?? ""} onChange={(e) => set("start_date", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>วันที่ดูจบ</label>
                <input style={inputStyle} type="date" value={form.end_date ?? ""} onChange={(e) => set("end_date", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>คะแนน (1-10)</label>
                <input style={inputStyle} type="number" min={1} max={10} value={form.rating ?? ""} onChange={(e) => set("rating", e.target.value ? Number(e.target.value) : undefined)} placeholder="-" />
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { val: form.watched_episodes, label: "ดูถึงตอน", color: "#1a5fa8" },
                  { val: form.start_date ? form.start_date.slice(0, 7) : undefined, label: "เริ่มดู", color: "#7ec8f0" },
                  { val: form.end_date ? form.end_date.slice(0, 7) : undefined, label: "ดูจบ", color: "#34d399" },
                ].map(({ val, label, color }) => (
                  <div key={label} style={{
                    textAlign: "center", padding: "10px 4px",
                    borderRadius: 10, background: "#f8fbff", border: "1.5px solid #e8f2fb",
                  }}>
                    <p style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 800, color }}>{val ?? "—"}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 10, color: "#93c5e8", fontWeight: 600 }}>{label}</p>
                  </div>
                ))}
              </div>

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, padding: "12px 16px",
                borderRadius: 10, background: "#fffbeb", border: "1.5px solid #fde68a",
              }}>
                <span style={{ fontSize: 22 }}>⭐</span>
                <span style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: "#b45309" }}>
                  {form.rating ?? "—"}
                </span>
                <span style={{ fontSize: 13, color: "#d97706", fontWeight: 600 }}>/10</span>
              </div>
            </>
          )}

          {/* ── Rewatch sessions ── */}
          <div style={infoBlock}>
            <label style={labelStyle}>
              ประวัติการดู — {form.rewatch_sessions?.length ?? 0} รอบ
            </label>
            {editing ? (
              <RewatchEditor
                sessions={form.rewatch_sessions ?? []}
                onChange={(s) => set("rewatch_sessions", s)}
              />
            ) : (
              <RewatchView sessions={form.rewatch_sessions ?? []} />
            )}
          </div>

          {/* ── Notes ── */}
          {(editing || anime.notes) && (
            <div style={infoBlock}>
              <label style={labelStyle}>หมายเหตุ</label>
              {editing ? (
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>{anime.notes}</p>
              )}
            </div>
          )}

          {/* ── Actions ── */}
          <div style={{ display: "flex", gap: 10, justifyContent: isMobile ? "stretch" : "flex-end", marginTop: "auto", paddingTop: 4 }}>
            {editing ? (
              <>
                <button onClick={() => { setEditing(false); setForm(anime); }} style={{ flex: isMobile ? 1 : undefined, padding: "9px 20px", borderRadius: 22, fontWeight: 700, fontSize: 13, background: "#f0f8ff", color: "#5b9bd5", border: "1.5px solid #d8edf8", cursor: "pointer" }}>
                  ยกเลิก
                </button>
                <button onClick={handleSave} disabled={saving} style={{ flex: isMobile ? 2 : undefined, padding: "9px 24px", borderRadius: 22, fontWeight: 700, fontSize: 13, background: saving ? "#b8d9f5" : "linear-gradient(135deg, #7ec8f0, #5b9bd5)", color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer", boxShadow: saving ? "none" : "0 4px 12px #7ec8f055" }}>
                  {saving ? "กำลังบันทึก..." : "💾 บันทึก"}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { if (confirm("ลบอนิเมะนี้จริงๆ เหรอ?")) { onDelete(anime.id); onClose(); } }} style={{ flex: isMobile ? 1 : undefined, padding: "9px 20px", borderRadius: 22, fontWeight: 700, fontSize: 13, background: "#fff5f5", color: "#dc2626", border: "1.5px solid #fca5a5", cursor: "pointer" }}>
                  ลบ
                </button>
                <button onClick={() => setEditing(true)} style={{ flex: isMobile ? 2 : undefined, padding: "9px 24px", borderRadius: 22, fontWeight: 700, fontSize: 13, background: "linear-gradient(135deg, #7ec8f0, #5b9bd5)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 12px #7ec8f055" }}>
                  ✏️ แก้ไข
                </button>
              </>
            )}
          </div>
        </div>

        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "#f0f8ff", border: "1.5px solid #d8edf8", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", color: "#93c5e8", zIndex: 10 }}>
          ×
        </button>
      </div>
    </div>
  );
}