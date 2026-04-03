"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "My Manga", href: "/" },
  { label: "My Anime", href: "/anime" },
  { label: "Light Novel", href: "/novel" },
  { label: "โปรไฟล์", href: "/profile" },
];

export default function Sidebar() {
  const pathname = usePathname();

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