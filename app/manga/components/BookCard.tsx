"use client";

import Image from "next/image";

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
  missing_volumes?: number[];
  missing_notes?: string;
  volume_details?: VolumeDetail[];
  rating?: number;
  genre?: string;
  notes?: string;
}

interface BookCardProps {
  book: Book;
  onClick?: (book: Book) => void;
}

export default function BookCard({ book, onClick }: BookCardProps) {
  return (
    <div
      onClick={() => onClick?.(book)}
      style={{
        position: "relative",
        background: "#fff",
        border: "2px solid #b8d9f5",
        borderRadius: 12,
        aspectRatio: "2/3",
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {book.cover_url ? (
        <Image
          src={book.cover_url}
          alt={book.title}
          fill
          style={{ objectFit: "cover" }}
          sizes="(max-width: 768px) 50vw, 200px"
        />
      ) : (
        <span style={{ fontSize: 11, color: "#93c5e8", textAlign: "center", padding: "0 6px" }}>
          {book.title}
        </span>
      )}
    </div>
  );
}