import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authorId = searchParams.get("authorId");

  const where: Record<string, unknown> = {};
  if (authorId) where.authorId = authorId;

  const seriesList = await prisma.series.findMany({
    where,
    include: {
      author: { select: { id: true, name: true } },
      novels: {
        orderBy: { seriesOrder: "asc" },
        select: {
          id: true,
          title: true,
          seriesOrder: true,
          viewCount: true,
          status: true,
          _count: { select: { chapters: true, likes: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(seriesList);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { title, description } = await request.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "シリーズ名は必須です" }, { status: 400 });
  }

  const series = await prisma.series.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, name: true } },
      novels: true,
    },
  });

  return NextResponse.json(series, { status: 201 });
}
