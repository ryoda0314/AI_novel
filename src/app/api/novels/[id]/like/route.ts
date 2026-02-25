import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { incrementDailyLikes } from "@/lib/daily-stats";
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

  const existing = await prisma.like.findUnique({
    where: { userId_novelId: { userId: session.user.id, novelId: id } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({
      data: { userId: session.user.id, novelId: id },
    });
  }

  incrementDailyLikes(id, existing ? -1 : 1).catch(() => {});

  const count = await prisma.like.count({ where: { novelId: id } });

  return NextResponse.json({ liked: !existing, count });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  const count = await prisma.like.count({ where: { novelId: id } });
  let liked = false;

  if (session?.user?.id) {
    const existing = await prisma.like.findUnique({
      where: { userId_novelId: { userId: session.user.id, novelId: id } },
    });
    liked = !!existing;
  }

  return NextResponse.json({ liked, count });
}
