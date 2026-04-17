"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth } from "@/src/lib/firebaseClient";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailSubmit() {
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "เกิดข้อผิดพลาด";
      if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else if (msg.includes("email-already-in-use")) {
        setError("อีเมลนี้ถูกใช้งานแล้ว");
      } else if (msg.includes("weak-password")) {
        setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      } else {
        setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch {
      setError("เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        backgroundImage: `linear-gradient(rgba(184,217,245,0.5) 1px, transparent 2px), linear-gradient(90deg, rgba(184,217,245,0.5) 1px, transparent 2px)`,
        backgroundSize: "70px 70px",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "2px solid #b8d9f5",
          borderRadius: 24,
          padding: "32px 28px",
          width: "min(380px, 90vw)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0 8px 40px rgba(124,194,240,0.15)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
          <Image
            src="/logo.png"
            alt="Kakeru"
            width={200}
            height={200}
            style={{ width: 180, height: "auto", borderRadius: 12 }}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "#fff0f0",
              border: "1.5px solid #fca5a5",
              borderRadius: 12,
              color: "#dc2626",
              fontSize: 13,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Email */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#5b9bd5" }}>อีเมล</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
            placeholder="example@email.com"
            style={{
              padding: "11px 16px",
              borderRadius: 12,
              border: "1.5px solid #b8d9f5",
              fontSize: 14,
              color: "#1a5fa8",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Password */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#5b9bd5" }}>รหัสผ่าน</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
            placeholder="••••••••"
            style={{
              padding: "11px 16px",
              borderRadius: 12,
              border: "1.5px solid #b8d9f5",
              fontSize: 14,
              color: "#1a5fa8",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleEmailSubmit}
          disabled={loading}
          style={{
            padding: "12px",
            borderRadius: 12,
            background: loading ? "#b8d9f5" : "#7ec8f0",
            color: "#fff",
            border: "none",
            fontSize: 14,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {loading ? "กำลังโหลด..." : isRegister ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: "#e8f3fc" }} />
          <span style={{ fontSize: 12, color: "#93c5e8", fontWeight: 600 }}>หรือ</span>
          <div style={{ flex: 1, height: 1, background: "#e8f3fc" }} />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            padding: "11px",
            borderRadius: 12,
            background: "#f0f7ff",
            border: "1.5px solid #b8d9f5",
            color: "#1a5fa8",
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.3C9.7 35.7 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.2 5.2C42 35.3 44 30 44 24c0-1.2-.1-2.4-.4-3.5z"/>
          </svg>
          เข้าสู่ระบบด้วย Google
        </button>

        {/* Toggle register/login */}
        <p style={{ textAlign: "center", fontSize: 13, color: "#93c5e8", margin: 0 }}>
          {isRegister ? "มีบัญชีอยู่แล้ว?" : "ยังไม่มีบัญชี?"}{" "}
          <button
            onClick={() => { setIsRegister((v) => !v); setError(null); }}
            style={{
              background: "none",
              border: "none",
              color: "#5b9bd5",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {isRegister ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </button>
        </p>
      </div>
    </div>
  );
}