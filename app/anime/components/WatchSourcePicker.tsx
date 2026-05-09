"use client";

const WATCH_SOURCES = [
    "Netflix", "Crunchyroll", "TrueId",
     "Bilibili", "Disney+", "Muse Thailand",
      "AniOne", "อื่นๆ"
];

export function WatchSourcePicker({ value, onChange }: {
    value: string;
    onChange: (v: string) => void;
}) {
    const selected = value ? value.split(", ").filter(Boolean) : [];

    function toggle(source: string) {
        const next = selected.includes(source)
            ? selected.filter((s) => s !== source)
            : [...selected, source];
        onChange(next.join(", "));
    }

    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {WATCH_SOURCES.map((s) => {
                const active = selected.includes(s);
                return (
                    <button
                        key={s}
                        type="button"
                        onClick={() => toggle(s)}
                        style={{
                            padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                            fontSize: 12, fontWeight: 600,
                            border: `1.5px solid ${active ? "#7ec8f0" : "#d8edf8"}`,
                            background: active ? "#e8f7fd" : "#f8fbff",
                            color: active ? "#1a5fa8" : "#93c5e8",
                            transition: "all 0.15s",
                        }}
                    >
                        {active ? "✓ " : ""}{s}
                    </button>
                );
            })}
        </div>
    );
}