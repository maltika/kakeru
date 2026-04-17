"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/src/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/manga"); // ถ้ามี user แล้ว ไปหน้าชั้นหนังสือ
      } else {
        router.replace("/login"); // ถ้าไม่มี ไปหน้า login
      }
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <p>กำลังนำทาง...</p>
    </div>
  );
}