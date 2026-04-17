import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

export function getDb() {
  getApp();
  return getFirestore();
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type SeriesStatus = "ongoing" | "completed" | "hiatus";
export type ReadStatus = "reading" | "completed" | "planned" | "dropped";
export type Format = "physical" | "ebook" | "both";
export type BookType = "manga" | "novel";
export type VolumeFormat = "physical" | "ebook" | "none";

export interface VolumeDetail {
  volume: number;
  format: VolumeFormat;
  note?: string;
}

export interface Book {
  id: string;
  title: string;
  title_en?: string;
  type: BookType;
  publisher?: string;
  cover_url?: string;
  series_status: SeriesStatus;
  format: Format;
  total_volumes?: number;
  owned_volumes?: number;
  read_volume?: number;
  read_status: ReadStatus;
  rating?: number;
  genre?: string;
  notes?: string;
  missing_volumes?: number[];
  missing_notes?: string;
  volume_details?: VolumeDetail[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// books อยู่ใต้ users/{uid}/books แทน flat collection
function booksCol(uid: string) {
  return getDb().collection("users").doc(uid).collection("books");
}

function docToBook(id: string, data: FirebaseFirestore.DocumentData): Book {
  return {
    id,
    title: data.title ?? "",
    title_en: data.title_en || undefined,
    type: data.type ?? "manga",
    publisher: data.publisher || undefined,
    cover_url: data.cover_url || undefined,
    series_status: data.series_status ?? "ongoing",
    format: data.format ?? "physical",
    total_volumes: data.total_volumes ?? undefined,
    owned_volumes: data.owned_volumes ?? undefined,
    read_volume: data.read_volume ?? undefined,
    read_status: data.read_status ?? "planned",
    rating: data.rating ?? undefined,
    genre: data.genre || undefined,
    notes: data.notes || undefined,
    missing_volumes: data.missing_volumes ?? undefined,
    missing_notes: data.missing_notes || undefined,
    volume_details: data.volume_details ?? undefined,
  };
}

function bookToData(book: Omit<Book, "id">): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const keys: (keyof Omit<Book, "id">)[] = [
    "title", "title_en", "type", "publisher", "cover_url",
    "series_status", "format", "total_volumes", "owned_volumes",
    "read_volume", "read_status", "rating", "genre", "notes",
    "missing_volumes", "missing_notes", "volume_details",
  ];
  for (const key of keys) {
    if (book[key] !== undefined) data[key] = book[key];
  }
  return data;
}

// ── CRUD (ทุกฟังก์ชันรับ uid) ─────────────────────────────────────────────────

export async function getBooks(uid: string): Promise<Book[]> {
  const snap = await booksCol(uid).orderBy("title").get();
  return snap.docs.map((doc) => docToBook(doc.id, doc.data()));
}

export async function addBook(uid: string, book: Omit<Book, "id">): Promise<void> {
  await booksCol(uid).add(bookToData(book));
}

export async function updateBook(uid: string, book: Book): Promise<void> {
  const { id, ...rest } = book;
  await booksCol(uid).doc(id).set(bookToData(rest));
}

export async function deleteBook(uid: string, id: string): Promise<void> {
  await booksCol(uid).doc(id).delete();
}

// ต่อท้าย firebase.ts

function favoritesDoc(uid: string) {
  return getDb().collection("users").doc(uid).collection("meta").doc("favorites");
}

export async function getMangaFavorites(uid: string): Promise<string[]> {
  const snap = await favoritesDoc(uid).get();
  if (!snap.exists) return [];
  return snap.data()?.ids ?? [];
}

export async function saveMangaFavorites(uid: string, ids: string[]): Promise<void> {
  await favoritesDoc(uid).set({ ids });
}