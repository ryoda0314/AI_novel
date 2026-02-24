import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const chapters = await prisma.chapter.findMany({
    where: { novelId: id, publishedAt: { not: null } },
    orderBy: { chapterNum: "asc" },
    select: { id: true, title: true, chapterNum: true, publishedAt: true, createdAt: true },
  });

  return NextResponse.json(chapters);
}

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

  const { title, content, publish } = await request.json();

  if (!title || !content) {
    return NextResponse.json({ error: "タイトルと本文は必須です" }, { status: 400 });
  }

  // Get next chapter number
  const lastChapter = await prisma.chapter.findFirst({
    where: { novelId: id },
    orderBy: { chapterNum: "desc" },
  });

  const chapterNum = (lastChapter?.chapterNum || 0) + 1;

  const chapter = await prisma.chapter.create({
    data: {
      title,
      content,
      chapterNum,
      novelId: id,
      publishedAt: publish ? new Date() : null,
    },
  });

  return NextResponse.json(chapter, { status: 201 });
}
