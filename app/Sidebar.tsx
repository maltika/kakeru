"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, startTransition } from "react"; // ← เพิ่ม startTransition
import { auth } from "@/src/lib/firebaseClient";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { User as UserIcon, LogOut } from "lucide-react";

const navItems = [
  { label: "My Manga", href: "/" },
  { label: "My Anime", href: "/anime" },
  { label: "Wishlist", href: "/wishlist" },
];

function UserCard({ user, handleLogout }: { user: User | null; handleLogout: () => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
      <div style={{ height: 1, background: "#e8f3fc" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px" }}>

        {/* เช็ค: ถ้ามีรูปและรูปไม่เสีย ให้โชว์ Image | ถ้าไม่มีหรือรูปเสีย ให้โชว์ Icon */}
        {user?.photoURL && !imgError ? (
          <div style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #b8d9f5", overflow: "hidden", position: "relative", flexShrink: 0 }}>
            <Image
              src={user.photoURL}
              alt="avatar"
              fill
              style={{ objectFit: "cover" }}
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "#b8d9f5", color: "#1a5fa8",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0
          }}>
            <UserIcon size={20} strokeWidth={2.5} />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a5fa8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.displayName ?? "ผู้ใช้งาน"}
          </div>
          <div style={{ fontSize: 11, color: "#93c5e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.email}
          </div>
        </div>
      </div>

      <button
        onClick={handleLogout}
        style={{
          width: "100%", padding: "9px", borderRadius: 10,
          background: "#f0f7ff", border: "1.5px solid #b8d9f5",
          color: "#5b9bd5", fontWeight: 600, fontSize: 13,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
        }}
      >
        <LogOut size={16} />
        ออกจากระบบ
      </button>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    startTransition(() => {
      setIsOpen(false);
    });
  }, [pathname]);

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  if (isMobile === null) return null;

  if (!isMobile) {
    return (
      <aside style={{
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

        // เพิ่ม 3 บรรทัดนี้
        position: "sticky",
        top: 16,
        height: "calc(100vh - 32px)",
        overflowY: "auto",
      }}>  <div>
          <Image src="/logo.png" alt="Kakeru Logo" width={300} height={300} style={{ width: "100%", height: "auto", borderRadius: 12 }} />
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} style={{ display: "block", padding: "10px 16px", borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: "none", background: pathname === item.href ? "#b8d9f5" : "transparent", color: pathname === item.href ? "#1a5fa8" : "#7ab0d4" }}>
              {item.label}
            </Link>
          ))}
        </nav>
        {/* ← ส่ง props ครบ */}
        <UserCard user={user} handleLogout={handleLogout} />
      </aside>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{ position: "fixed", top: 16, left: 16, zIndex: 1100, width: 44, height: 44, borderRadius: 14, border: "2px solid #b8d9f5", background: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, boxShadow: "0 4px 16px rgba(124,194,240,0.25)" }}
        aria-label="Toggle menu"
      >
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ display: "block", width: 20, height: 2, borderRadius: 2, background: "#5b9bd5", transition: "all 0.25s ease", transformOrigin: "center", transform: isOpen ? i === 0 ? "translateY(7px) rotate(45deg)" : i === 2 ? "translateY(-7px) rotate(-45deg)" : "scaleX(0)" : "none", opacity: isOpen && i === 1 ? 0 : 1 }} />
        ))}
      </button>

      {isOpen && <div onClick={() => setIsOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", backdropFilter: "blur(3px)", zIndex: 1050 }} />}

      <aside style={{ position: "fixed", top: 0, left: 0, height: "100dvh", width: 260, background: "#fff", borderRight: "2px solid #b8d9f5", borderTopRightRadius: 24, borderBottomRightRadius: 24, padding: "80px 14px 24px", display: "flex", flexDirection: "column", gap: 12, zIndex: 1075, transform: isOpen ? "translateX(0)" : "translateX(-110%)", transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)", boxShadow: isOpen ? "8px 0 32px rgba(124,194,240,0.25)" : "none" }}>
        <div style={{ marginBottom: 8 }}>
          <Image src="/logo.png" alt="Kakeru Logo" width={300} height={300} style={{ width: "100%", height: "auto", borderRadius: 12 }} />
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: "none", background: pathname === item.href ? "#b8d9f5" : "transparent", color: pathname === item.href ? "#1a5fa8" : "#7ab0d4" }}>
              {item.label}
            </Link>
          ))}
        </nav>
        {/* ← ส่ง props ครบ */}
        <UserCard user={user} handleLogout={handleLogout} />
      </aside>
    </>
  );
}