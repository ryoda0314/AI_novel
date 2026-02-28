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

  // 各章 — コンテンツから小説タイトルの # 見出し行を除去して連結
  // chapter.title が小説タイトルと同じ場合がある（一括投稿時の仕様）
  // コンテンツ内に # 小説タイトル と # 章タイトル の2つが含まれるケースに対応
  const novelTitlePlain = novel.title
    .replace(/\{([^|}]+)\|[^}]+\}/g, "$1")   // {漢字|ルビ} → 漢字
    .replace(/\|([^|《》\n]+)《[^》]+》/g, "$1"); // |漢字《ルビ》 → 漢字

  for (const chapter of novel.chapters) {
    // 各行を走査し、小説タイトルと一致する # 行を除去
    const contentLines = chapter.content.split("\n");
    const filtered = contentLines.filter((line) => {
      const m = line.match(/^#\s+(.+)$/);
      if (!m) return true;
      const headingPlain = m[1].trim()
        .replace(/\{([^|}]+)\|[^}]+\}/g, "$1")
        .replace(/\|([^|《》\n]+)《[^》]+》/g, "$1");
      return headingPlain !== novelTitlePlain;
    });
    lines.push(filtered.join("\n"));
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
