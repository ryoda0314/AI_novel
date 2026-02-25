import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const novel = await prisma.novel.findUnique({
    where: { id },
    select: {
      title: true,
      synopsis: true,
      author: { select: { name: true } },
      genres: { include: { genre: true }, take: 3 },
      _count: { select: { likes: true, chapters: true } },
    },
  });

  if (!novel) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", background: "#6366f1", alignItems: "center", justifyContent: "center", color: "white", fontSize: 40 }}>
          AI小説広場
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const synopsis = novel.synopsis.length > 100
    ? novel.synopsis.slice(0, 100) + "..."
    : novel.synopsis;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* カード */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            background: "white",
            borderRadius: "24px",
            padding: "48px",
            boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
          }}
        >
          {/* ジャンル */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            {novel.genres.map(({ genre }) => (
              <span
                key={genre.slug}
                style={{
                  fontSize: "20px",
                  padding: "4px 16px",
                  borderRadius: "999px",
                  background: "#f0f0ff",
                  color: "#6366f1",
                }}
              >
                {genre.name}
              </span>
            ))}
          </div>

          {/* タイトル */}
          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#171717",
              marginBottom: "16px",
              lineHeight: 1.3,
              overflow: "hidden",
              display: "-webkit-box",
            }}
          >
            {novel.title}
          </div>

          {/* あらすじ */}
          <div
            style={{
              fontSize: "24px",
              color: "#6b7280",
              lineHeight: 1.6,
              flex: 1,
            }}
          >
            {synopsis}
          </div>

          {/* 下部情報 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "2px solid #f0f0f0",
              paddingTop: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "24px", color: "#6b7280" }}>
              作者: {novel.author.name}
            </div>
            <div style={{ display: "flex", gap: "24px", fontSize: "22px", color: "#9ca3af" }}>
              <span>{novel._count.likes} いいね</span>
              <span>{novel._count.chapters} 話</span>
            </div>
            <div style={{ fontSize: "22px", color: "#6366f1", fontWeight: "bold" }}>
              AI小説広場
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
