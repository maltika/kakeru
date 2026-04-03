// src/lib/googleSheetsAnime.ts

export type AnimeStatus = "ongoing" | "completed" | "hiatus" | "upcoming";
export type WatchStatus = "watching" | "completed" | "planned" | "dropped";

export interface Anime {
  id: string;
  title: string;
  title_en?: string;
  cover_url?: string;
  series_status: AnimeStatus;
  total_episodes?: number;
  watched_episodes?: number;
  total_seasons?: number;
  current_season?: number;
  watch_status: WatchStatus;
  rating?: number;
  genre?: string;
  notes?: string;
  watch_source?: string; // แหล่งที่ดู เช่น Netflix, Crunchyroll
  anilist_id?: number;
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const BASE = "https://sheets.googleapis.com/v4/spreadsheets";

// ── Auth (เหมือนกัน) ──────────────────────────────────────────────────────────

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
// Sheet columns: A=title, B=title_en, C=cover_url, D=series_status,
// E=total_episodes, F=watched_episodes, G=total_seasons, H=current_season,
// I=watch_status, J=rating, K=genre, L=notes, M=watch_source, N=anilist_id

function rowToAnime(row: string[], rowIndex: number): Anime {
  return {
    id: String(rowIndex + 2),
    title: row[0] || "",
    title_en: row[1] || undefined,
    cover_url: row[2] || undefined,
    series_status: (row[3] as AnimeStatus) || "ongoing",
    total_episodes: row[4] ? Number(row[4]) : undefined,
    watched_episodes: row[5] ? Number(row[5]) : undefined,
    total_seasons: row[6] ? Number(row[6]) : undefined,
    current_season: row[7] ? Number(row[7]) : undefined,
    watch_status: (row[8] as WatchStatus) || "planned",
    rating: row[9] ? Number(row[9]) : undefined,
    genre: row[10] || undefined,
    notes: row[11] || undefined,
    watch_source: row[12] || undefined,
    anilist_id: row[13] ? Number(row[13]) : undefined,
  };
}

function animeToRow(anime: Omit<Anime, "id">): string[] {
  return [
    anime.title,                              // A
    anime.title_en || "",                     // B
    anime.cover_url || "",                    // C
    anime.series_status,                      // D
    anime.total_episodes?.toString() || "",   // E
    anime.watched_episodes?.toString() || "", // F
    anime.total_seasons?.toString() || "",    // G
    anime.current_season?.toString() || "",   // H
    anime.watch_status,                       // I
    anime.rating?.toString() || "",           // J
    anime.genre || "",                        // K
    anime.notes || "",                        // L
    anime.watch_source || "",                 // M
    anime.anilist_id?.toString() || "",       // N
  ];
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function getAnimes(): Promise<Anime[]> {
  const token = await getAccessToken();
  const res = await fetch(
    `${BASE}/${SHEET_ID}/values/Anime!A2:N`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  const data = await res.json();
  const rows: string[][] = data.values || [];
  return rows.map((row, i) => rowToAnime(row, i));
}

export async function addAnime(anime: Omit<Anime, "id">): Promise<void> {
  const token = await getAccessToken();
  await fetch(
    `${BASE}/${SHEET_ID}/values/Anime!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [animeToRow(anime)] }),
    }
  );
}

export async function updateAnime(anime: Anime): Promise<void> {
  const token = await getAccessToken();
  const range = `Anime!A${anime.id}:N${anime.id}`;
  await fetch(
    `${BASE}/${SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [animeToRow(anime)] }),
    }
  );
}

export async function deleteAnime(rowId: string): Promise<void> {
  const token = await getAccessToken();
  const sheetInfo = await fetch(`${BASE}/${SHEET_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  const sheet = sheetInfo.sheets.find(
    (s: { properties: { title: string; sheetId: number } }) =>
      s.properties.title === "Anime"
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
// ── Favorites ─────────────────────────────────────────────────────────────────

export async function getAnimeFavorites(): Promise<string[]> {
  const token = await getAccessToken();
  const res = await fetch(
    `${BASE}/${SHEET_ID}/values/AnimeFavorites!A2:A`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  const data = await res.json();
  const rows: string[][] = data.values || [];
  return rows.map((r) => r[0]).filter(Boolean);
}

export async function saveAnimeFavorites(ids: string[]): Promise<void> {
  const token = await getAccessToken();

  // 1. Clear ก่อน (ใช้ endpoint :clear ที่ถูกต้อง)
  await fetch(
    `${BASE}/${SHEET_ID}/values/AnimeFavorites!A2:A:clear`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  // 2. ถ้า ids ว่าง จบแค่นี้
  if (ids.length === 0) return;

  // 3. Write ค่าใหม่
  await fetch(
    `${BASE}/${SHEET_ID}/values/AnimeFavorites!A2:A?valueInputOption=RAW`,
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