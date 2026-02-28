import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const novel = await prisma.novel.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
      genres: { include: { genre: { select: { name: true } } } },
      chapters: {
        where: { publishedAt: { not: null, lte: new Date() } },
        orderBy: { chapterNum: "asc" },
        select: { title: true, content: true, chapterNum: true },
      },
    },
  });

  if (!novel) {
    return NextResponse.json({ error: "作品が見つかりません" }, { status: 404 });
  }

  if (novel.chapters.length === 0) {
    return NextResponse.json({ error: "公開されている章がありません" }, { status: 400 });
  }

  // .novel形式を生成
  const genreNames = novel.genres.map((g) => g.genre.name).join(", ");
  const lines: string[] = [];

  // YAML frontmatter
  lines.push("---");
  lines.push(`title: ${novel.title}`);
  lines.push(`author: ${novel.author.name}`);
  if (genreNames) {
    lines.push(`genre: ${genreNames}`);
  }
  if (novel.synopsis) {
    lines.push(`description: ${novel.synopsis.replace(/\n/g, " ").slice(0, 200)}`);
  }
  lines.push("---");
  lines.push("");

  // 各章 — %% 記法で章タイトルを明示（.novel独自の章区切り）
  // chapter.title をそのまま使い、コンテンツは加工せず出力
  for (const chapter of novel.chapters) {
    lines.push(`%% ${chapter.title}`);
    lines.push("");
    lines.push(chapter.content);
    lines.push("");
  }

  const content = lines.join("\n");
  const filename = encodeURIComponent(novel.title) + ".novel";

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
    },
  });
}
