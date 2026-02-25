import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { novelId, chapterId } = await request.json();

  if (!novelId || !chapterId) {
    return NextResponse.json({ error: "パラメータが不足しています" }, { status: 400 });
  }

  await prisma.readingHistory.upsert({
    where: { userId_novelId: { userId: session.user.id, novelId } },
    update: { chapterId, readAt: new Date() },
    create: { userId: session.user.id, novelId, chapterId },
  });

  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10");
  const novelId = searchParams.get("novelId") || "";

  const where: Record<string, unknown> = { userId: session.user.id };
  if (novelId) {
    where.novelId = novelId;
  }

  const histories = await prisma.readingHistory.findMany({
    where,
    include: {
      novel: {
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { chapters: true } },
        },
      },
      chapter: {
        select: { id: true, title: true, chapterNum: true },
      },
    },
    orderBy: { readAt: "desc" },
    take: limit,
  });

  return NextResponse.json(histories);
}
