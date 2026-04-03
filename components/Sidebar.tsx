"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";


const navItems = [
  { label: "My Manga", href: "/", },
  { label: "My Anime", href: "/anime", },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);


  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setIsOpen(false);
  }, [pathname]);
  if (isMobile === null) return null;
  if (!isMobile) {
    // ── Desktop: แสดงปกติ ──
    return (
      <aside
        style={{
          width: 300,
          flexShrink: 0,
          background: "#fff",
          border: "2px solid #b8d9f5",
          borderRadius: 20,
          margin: "16px 0 16px 16px",
          padding: "20px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div>
          <img
            src="/logo.png"
            alt="Kakeru Logo"
            style={{ width: "100%", height: "auto", borderRadius: 12 }}
          />
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "block",
                padding: "10px 16px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                background: pathname === item.href ? "#b8d9f5" : "transparent",
                color: pathname === item.href ? "#1a5fa8" : "#7ab0d4",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    );
  }

  // ── Mobile/Tablet: Hamburger + Drawer ──
  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 1100,
          width: 44,
          height: 44,
          borderRadius: 14,
          border: "2px solid #b8d9f5",
          background: "#fff",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          boxShadow: "0 4px 16px rgba(124,194,240,0.25)",
          transition: "all 0.2s",
        }}
        aria-label="Toggle menu"
      >
        {/* Animated hamburger → X */}
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: "block",
              width: 20,
              height: 2,
              borderRadius: 2,
              background: "#5b9bd5",
              transition: "all 0.25s ease",
              transformOrigin: "center",
              transform: isOpen
                ? i === 0
                  ? "translateY(7px) rotate(45deg)"
                  : i === 2
                    ? "translateY(-7px) rotate(-45deg)"
                    : "scaleX(0)"
                : "none",
              opacity: isOpen && i === 1 ? 0 : 1,
            }}
          />
        ))}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.2)",
            backdropFilter: "blur(3px)",
            zIndex: 1050,
            transition: "opacity 0.2s",
          }}
        />
      )}

      {/* Drawer */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100dvh",
          width: 260,
          background: "#fff",
          borderRight: "2px solid #b8d9f5",
          borderTopRightRadius: 24,
          borderBottomRightRadius: 24,
          padding: "80px 14px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          zIndex: 1075,
          transform: isOpen ? "translateX(0)" : "translateX(-110%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: isOpen
            ? "8px 0 32px rgba(124,194,240,0.25)"
            : "none",
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <img
            src="/logo.png"
            alt="Kakeru Logo"
            style={{ width: "100%", height: "auto", borderRadius: 12 }}
          />
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                background: pathname === item.href ? "#b8d9f5" : "transparent",
                color: pathname === item.href ? "#1a5fa8" : "#7ab0d4",
                transition: "background 0.15s",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}