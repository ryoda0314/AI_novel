import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  const session = await auth();
  const { id, chapterId } = await params;
  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, novelId: id },
    include: {
      novel: {
        select: { id: true, title: true, authorId: true, author: { select: { name: true } } },
      },
    },
  });

  if (!chapter) {
    return NextResponse.json({ error: "話が見つかりません" }, { status: 404 });
  }

  // 予約公開の章は作者のみアクセス可能
  if (chapter.publishedAt && chapter.publishedAt > new Date() && chapter.novel.authorId !== session?.user?.id) {
    return NextResponse.json({ error: "話が見つかりません" }, { status: 404 });
  }

  return NextResponse.json(chapter);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { id, chapterId } = await params;
  const novel = await prisma.novel.findUnique({ where: { id } });

  if (!novel || novel.authorId !== session.user.id) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { title, content, publish, scheduledAt } = await request.json();

  let publishedAtUpdate: Date | null | undefined = undefined;
  if (scheduledAt !== undefined) {
    publishedAtUpdate = scheduledAt ? new Date(scheduledAt) : null;
  } else if (publish !== undefined) {
    publishedAtUpdate = publish ? new Date() : null;
  }

  const chapter = await prisma.chapter.update({
    where: { id: chapterId },
    data: {
      ...(title && { title }),
      ...(content && { content }),
      ...(publishedAtUpdate !== undefined && { publishedAt: publishedAtUpdate }),
    },
  });

  return NextResponse.json(chapter);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { id, chapterId } = await params;
  const novel = await prisma.novel.findUnique({ where: { id } });

  if (!novel || novel.authorId !== session.user.id) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  await prisma.chapter.delete({ where: { id: chapterId } });

  return NextResponse.json({ success: true });
}
