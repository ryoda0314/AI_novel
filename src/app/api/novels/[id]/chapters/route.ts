import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { notifyFollowers } from "@/lib/notifications";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const includeDrafts = url.searchParams.get("includeDrafts") === "true";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { novelId: id };

  if (includeDrafts) {
    const session = await auth();
    const novel = await prisma.novel.findUnique({ where: { id } });
    if (!novel || novel.authorId !== session?.user?.id) {
      where.publishedAt = { not: null, lte: new Date() };
    }
  } else {
    where.publishedAt = { not: null, lte: new Date() };
  }

  const chapters = await prisma.chapter.findMany({
    where,
    orderBy: { chapterNum: "asc" },
    select: { id: true, title: true, chapterNum: true, publishedAt: true, createdAt: true, updatedAt: true },
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

  const { title, content, publish, scheduledAt } = await request.json();

  if (!title || !content) {
    return NextResponse.json({ error: "タイトルと本文は必須です" }, { status: 400 });
  }

  // Get next chapter number
  const lastChapter = await prisma.chapter.findFirst({
    where: { novelId: id },
    orderBy: { chapterNum: "desc" },
  });

  const chapterNum = (lastChapter?.chapterNum || 0) + 1;

  let publishedAt: Date | null = null;
  if (scheduledAt) {
    publishedAt = new Date(scheduledAt);
  } else if (publish) {
    publishedAt = new Date();
  }

  const chapter = await prisma.chapter.create({
    data: {
      title,
      content,
      chapterNum,
      novelId: id,
      publishedAt,
    },
  });

  // 公開時にフォロワーへ通知
  if (publishedAt && publishedAt <= new Date()) {
    notifyFollowers(
      session.user.id,
      "new_chapter",
      `「${novel.title}」に第${chapterNum}話「${title}」が公開されました`,
      `/novels/${id}/chapters/${chapter.id}`
    ).catch(() => {});
  }

  return NextResponse.json(chapter, { status: 201 });
}
