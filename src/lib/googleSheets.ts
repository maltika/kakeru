// src/lib/googleSheets.ts
// Google Sheets API layer

export type SeriesStatus = "ongoing" | "completed" | "hiatus";
export type ReadStatus = "reading" | "completed" | "planned" | "dropped";
export type Format = "physical" | "ebook" | "both";
export type BookType = "manga" | "novel";
export type VolumeFormat = "physical" | "ebook" | "none";

export interface VolumeDetail {
  volume: number;
  format: VolumeFormat;
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
  // ── field ใหม่ (column O, P, Q ใน sheet) ──
  missing_volumes?: number[];   // เก็บใน sheet เป็น "1,3,5"
  missing_notes?: string;
  volume_details?: VolumeDetail[]; // เก็บใน sheet เป็น JSON string
}

export interface WishlistItem {
  id: string;
  title: string;
  type: BookType;
  publisher?: string;
  cover_url?: string;
  priority?: number;
  notes?: string;
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const BASE = "https://sheets.googleapis.com/v4/spreadsheets";

// ── Auth ──────────────────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: process.env.GOOGLE_CLIENT_EMAIL!,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");

  const signingInput = `${encode(header)}.${encode(payload)}`;

  const crypto = await import("crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);

  const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const signature = sign.sign(privateKey, "base64url");

  const jwt = `${signingInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  return data.access_token;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function rowToBook(row: string[], rowIndex: number): Book {
  // parse missing_volumes จาก "1,3,5" → [1, 3, 5]
  const missingRaw = row[14] || "";
  const missing_volumes = missingRaw
    ? missingRaw.split(",").map(Number).filter((n) => !isNaN(n))
    : undefined;

  // parse volume_details จาก JSON string
  let volume_details: VolumeDetail[] | undefined;
  try {
    const raw = row[16] || "";
    volume_details = raw ? JSON.parse(raw) : undefined;
  } catch {
    volume_details = undefined;
  }

  return {
    id: String(rowIndex + 2),
    title: row[0] || "",
    title_en: row[1] || undefined,
    type: (row[2] as BookType) || "manga",
    publisher: row[3] || undefined,
    cover_url: row[4] || undefined,
    series_status: (row[5] as SeriesStatus) || "ongoing",
    format: (row[6] as Format) || "physical",
    total_volumes: row[7] ? Number(row[7]) : undefined,
    owned_volumes: row[8] ? Number(row[8]) : undefined,
    read_volume: row[9] ? Number(row[9]) : undefined,
    read_status: (row[10] as ReadStatus) || "planned",
    rating: row[11] ? Number(row[11]) : undefined,
    genre: row[12] || undefined,
    notes: row[13] || undefined,
    missing_volumes,                      // col O (index 14)
    missing_notes: row[15] || undefined,  // col P (index 15)
    volume_details,                       // col Q (index 16)
  };
}

function bookToRow(book: Omit<Book, "id">): string[] {
  // serialize missing_volumes → "1,3,5"
  const missingStr = book.missing_volumes?.length
    ? book.missing_volumes.join(",")
    : "";

  // serialize volume_details → JSON string
  const volumeDetailsStr = book.volume_details?.length
    ? JSON.stringify(book.volume_details)
    : "";

  return [
    book.title,                              // A
    book.title_en || "",                     // B
    book.type,                               // C
    book.publisher || "",                    // D
    book.cover_url || "",                    // E
    book.series_status,                      // F
    book.format,                             // G
    book.total_volumes?.toString() || "",    // H
    book.owned_volumes?.toString() || "",    // I
    book.read_volume?.toString() || "",      // J
    book.read_status,                        // K
    book.rating?.toString() || "",           // L
    book.genre || "",                        // M
    book.notes || "",                        // N
    missingStr,                              // O — missing_volumes
    book.missing_notes || "",               // P — missing_notes
    volumeDetailsStr,                        // Q — volume_details
  ];
}

function rowToWishlist(row: string[], rowIndex: number): WishlistItem {
  return {
    id: String(rowIndex + 2),
    title: row[0] || "",
    type: (row[1] as BookType) || "manga",
    publisher: row[2] || undefined,
    cover_url: row[3] || undefined,
    priority: row[4] ? Number(row[4]) : undefined,
    notes: row[5] || undefined,
  };
}

function wishlistToRow(item: Omit<WishlistItem, "id">): string[] {
  return [
    item.title,
    item.type,
    item.publisher || "",
    item.cover_url || "",
    item.priority?.toString() || "",
    item.notes || "",
  ];
}

// ── Collection CRUD ───────────────────────────────────────────────────────────

export async function getBooks(): Promise<Book[]> {
  const token = await getAccessToken();
  const res = await fetch(
    `${BASE}/${SHEET_ID}/values/Collection!A2:Q`, // เปลี่ยนจาก N → Q
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  const data = await res.json();
  const rows: string[][] = data.values || [];
  return rows.map((row, i) => rowToBook(row, i));
}

export async function addBook(book: Omit<Book, "id">): Promise<void> {
  const token = await getAccessToken();
  await fetch(
    `${BASE}/${SHEET_ID}/values/Collection!A:Q:append?valueInputOption=RAW`, // N → Q
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [bookToRow(book)] }),
    }
  );
}

export async function updateBook(book: Book): Promise<void> {
  const token = await getAccessToken();
  const range = `Collection!A${book.id}:Q${book.id}`; // N → Q
  await fetch(
    `${BASE}/${SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [bookToRow(book)] }),
    }
  );
}

export async function deleteBook(rowId: string): Promise<void> {
  const token = await getAccessToken();
  const sheetInfo = await fetch(`${BASE}/${SHEET_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  const sheet = sheetInfo.sheets.find(
    (s: { properties: { title: string; sheetId: number } }) =>
      s.properties.title === "Collection"
  );
  const sheetId = sheet?.properties?.sheetId ?? 0;
  const rowIndex = Number(rowId) - 1;

  await fetch(`${BASE}/${SHEET_ID}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    }),
  });
}

// ── Wishlist CRUD ─────────────────────────────────────────────────────────────

export async function getWishlist(): Promise<WishlistItem[]> {
  const token = await getAccessToken();
  const res = await fetch(
    `${BASE}/${SHEET_ID}/values/Wishlist!A2:F`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  const data = await res.json();
  const rows: string[][] = data.values || [];
  return rows.map((row, i) => rowToWishlist(row, i));
}

export async function addWishlistItem(item: Omit<WishlistItem, "id">): Promise<void> {
  const token = await getAccessToken();
  await fetch(
    `${BASE}/${SHEET_ID}/values/Wishlist!A:F:append?valueInputOption=RAW`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [wishlistToRow(item)] }),
    }
  );
}

export async function deleteWishlistItem(rowId: string): Promise<void> {
  const token = await getAccessToken();
  const sheetInfo = await fetch(`${BASE}/${SHEET_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  const sheet = sheetInfo.sheets.find(
    (s: { properties: { title: string; sheetId: number } }) =>
      s.properties.title === "Wishlist"
  );
  const sheetId = sheet?.properties?.sheetId ?? 1;
  const rowIndex = Number(rowId) - 1;

  await fetch(`${BASE}/${SHEET_ID}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    }),
  });
}

// ── Favorites ─────────────────────────────────────────────────────────────────

export async function getMangaFavorites(): Promise<string[]> {
  const token = await getAccessToken();
  const res = await fetch(
    `${BASE}/${SHEET_ID}/values/Favorites!A2:A`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  const data = await res.json();
  const rows: string[][] = data.values || [];
  return rows.map((r) => r[0]).filter(Boolean);
}

export async function saveMangaFavorites(ids: string[]): Promise<void> {
  const token = await getAccessToken();

  // 1. Clear ก่อน (ใช้ endpoint :clear ที่ถูกต้อง)
  await fetch(
    `${BASE}/${SHEET_ID}/values/Favorites!A2:A:clear`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  // 2. ถ้า ids ว่าง จบแค่นี้
  if (ids.length === 0) return;

  // 3. Write ค่าใหม่
  await fetch(
    `${BASE}/${SHEET_ID}/values/Favorites!A2:A?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: ids.map((id) => [id]) }),
    }
  );
}