import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const MAX_BULK_CHAPTERS = 100;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { id } = await params;
  const novel = await prisma.novel.findUnique({ where: { id } });

  if (!novel || novel.authorId !== session.user.id) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { chapters } = await request.json();

  if (!Array.isArray(chapters) || chapters.length === 0) {
    return NextResponse.json({ error: "章データが必要です" }, { status: 400 });
  }

  if (chapters.length > MAX_BULK_CHAPTERS) {
    return NextResponse.json(
      { error: `一度に投稿できるのは${MAX_BULK_CHAPTERS}話までです` },
      { status: 400 }
    );
  }

  // バリデーション
  for (let i = 0; i < chapters.length; i++) {
    if (!chapters[i].title?.trim() || !chapters[i].content?.trim()) {
      return NextResponse.json(
        { error: `${i + 1}番目の章にタイトルまたは本文がありません` },
        { status: 400 }
      );
    }
  }

  // トランザクションで一括作成
  const created = await prisma.$transaction(async (tx) => {
    const lastChapter = await tx.chapter.findFirst({
      where: { novelId: id },
      orderBy: { chapterNum: "desc" },
    });

    const startNum = (lastChapter?.chapterNum || 0) + 1;

    const results = [];
    for (let i = 0; i < chapters.length; i++) {
      const chapter = await tx.chapter.create({
        data: {
          title: chapters[i].title.trim(),
          content: chapters[i].content.trim(),
          chapterNum: startNum + i,
          novelId: id,
          publishedAt: null,
        },
        select: {
          id: true,
          title: true,
          chapterNum: true,
          publishedAt: true,
        },
      });
      results.push(chapter);
    }

    return results;
  });

  return NextResponse.json(
    { created: created.length, chapters: created },
    { status: 201 }
  );
}
