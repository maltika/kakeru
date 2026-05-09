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

// ── Wishlist ───────────────────────────────────────────────────────────────────

export type WishlistPriority = "high" | "medium" | "low";

export interface WishlistItem {
  id: string;
  title: string;
  title_en?: string;
  cover_url?: string;
  type: BookType;
  priority: WishlistPriority;
  notes?: string;
  added_at: string; // ISO date string
  publisher?: string;
  store?: string;
  price?: number;
  volumes_total?: number;
  volumes_wanted?: string;
  bought?: boolean;
}

function wishlistCol(uid: string) {
  return getDb().collection("users").doc(uid).collection("wishlist");
}

function docToWishlistItem(id: string, data: FirebaseFirestore.DocumentData): WishlistItem {
  return {
    id,
    title: data.title ?? "",
    title_en: data.title_en || undefined,
    cover_url: data.cover_url || undefined,
    type: data.type ?? "manga",
    priority: data.priority ?? "medium",
    notes: data.notes || undefined,
    added_at: data.added_at ?? new Date().toISOString(),
    publisher: data.publisher || undefined,
    store: data.store || undefined,
    price: data.price ?? undefined,
    volumes_total: data.volumes_total ?? undefined,
    volumes_wanted: data.volumes_wanted || undefined,
    bought: data.bought ?? false,
  };
}

export async function getWishlist(uid: string): Promise<WishlistItem[]> {
  const snap = await wishlistCol(uid).orderBy("added_at", "desc").get();
  return snap.docs.map((doc) => docToWishlistItem(doc.id, doc.data()));
}

export async function addWishlistItem(uid: string, item: Omit<WishlistItem, "id">): Promise<void> {
  await wishlistCol(uid).add(item);
}

export async function updateWishlistItem(uid: string, item: WishlistItem): Promise<void> {
  const { id, ...rest } = item;
  await wishlistCol(uid).doc(id).set(rest);
}

export async function deleteWishlistItem(uid: string, id: string): Promise<void> {
  await wishlistCol(uid).doc(id).delete();
}

// ── Anime ─────────────────────────────────────────────────────────────────────

export type AnimeStatus = "watching" | "completed" | "planned" | "dropped";
export type AnimeType = "series" | "movie";
export interface RewatchSession {
  start_date?: string;
  end_date?: string;
  note?: string;
}

export interface Anime {
  id: string;
  mal_id: number;
  title: string;
  title_en?: string;
  cover_url?: string;
  type: AnimeType;
  status: AnimeStatus;
  genre?: string;
  year?: number;
  season?: string;        // "Winter 2024"
  studio?: string;
  total_episodes?: number;
  watched_episodes?: number;
  watch_source?: string;
  start_date?: string;
  end_date?: string;
  rating?: number;
  rewatch_count?: number;
  notes?: string;
  rewatch_sessions?: RewatchSession[];
}

function animeCol(uid: string) {
  return getDb().collection("users").doc(uid).collection("anime");
}

function docToAnime(id: string, data: FirebaseFirestore.DocumentData): Anime {
  return {
    id,
    mal_id: data.mal_id ?? 0,
    title: data.title ?? "",
    title_en: data.title_en || undefined,
    cover_url: data.cover_url || undefined,
    type: data.type ?? "series",
    status: data.status ?? "planned",
    genre: data.genre || undefined,
    year: data.year ?? undefined,
    season: data.season || undefined,
    studio: data.studio || undefined,
    total_episodes: data.total_episodes ?? undefined,
    watched_episodes: data.watched_episodes ?? undefined,
    watch_source: data.watch_source || undefined,
    start_date: data.start_date || undefined,
    end_date: data.end_date || undefined,
    rating: data.rating ?? undefined,
    rewatch_count: data.rewatch_count ?? undefined,
    notes: data.notes || undefined,
    rewatch_sessions: data.rewatch_sessions ?? undefined,
  };
}

function animeToData(anime: Omit<Anime, "id">): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const keys: (keyof Omit<Anime, "id">)[] = [
    "mal_id", "title", "title_en", "cover_url", "type", "status",
    "genre", "year", "season", "studio", "total_episodes",
    "watched_episodes", "watch_source", "start_date", "end_date",
    "rating", "rewatch_count", "notes","rewatch_sessions",
  ];
  for (const key of keys) {
    if (anime[key] !== undefined) data[key] = anime[key];
  }
  return data;
}

export async function getAnimeList(uid: string): Promise<Anime[]> {
  const snap = await animeCol(uid).orderBy("title").get();
  return snap.docs.map((doc) => docToAnime(doc.id, doc.data()));
}

export async function addAnime(uid: string, anime: Omit<Anime, "id">): Promise<void> {
  await animeCol(uid).add(animeToData(anime));
}

export async function updateAnime(uid: string, anime: Anime): Promise<void> {
  const { id, ...rest } = anime;
  await animeCol(uid).doc(id).set(animeToData(rest));
}

export async function deleteAnime(uid: string, id: string): Promise<void> {
  await animeCol(uid).doc(id).delete();
}

function animeFavoritesDoc(uid: string) {
  return getDb().collection("users").doc(uid).collection("meta").doc("anime-favorites");
}

export async function getAnimeFavorites(uid: string): Promise<string[]> {
  const snap = await animeFavoritesDoc(uid).get();
  if (!snap.exists) return [];
  return snap.data()?.ids ?? [];
}

export async function saveAnimeFavorites(uid: string, ids: string[]): Promise<void> {
  await animeFavoritesDoc(uid).set({ ids });
}