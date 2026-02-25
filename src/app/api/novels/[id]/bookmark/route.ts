import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { incrementDailyBookmarks } from "@/lib/daily-stats";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.bookmark.findUnique({
    where: { userId_novelId: { userId: session.user.id, novelId: id } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
  } else {
    await prisma.bookmark.create({
      data: { userId: session.user.id, novelId: id },
    });
  }

  incrementDailyBookmarks(id, existing ? -1 : 1).catch(() => {});

  const count = await prisma.bookmark.count({ where: { novelId: id } });

  return NextResponse.json({ bookmarked: !existing, count });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  const count = await prisma.bookmark.count({ where: { novelId: id } });
  let bookmarked = false;

  if (session?.user?.id) {
    const existing = await prisma.bookmark.findUnique({
      where: { userId_novelId: { userId: session.user.id, novelId: id } },
    });
    bookmarked = !!existing;
  }

  return NextResponse.json({ bookmarked, count });
}
