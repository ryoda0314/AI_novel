import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const series = await prisma.series.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      novels: {
        orderBy: { seriesOrder: "asc" },
        include: {
          genres: { include: { genre: true } },
          tags: { include: { tag: true } },
          _count: { select: { chapters: true, likes: true } },
        },
      },
    },
  });

  if (!series) {
    return NextResponse.json({ error: "シリーズが見つかりません" }, { status: 404 });
  }

  return NextResponse.json(series);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { id } = await params;
  const series = await prisma.series.findUnique({ where: { id } });

  if (!series || series.authorId !== session.user.id) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { title, description, novelIds } = await request.json();

  // シリーズ情報を更新
  await prisma.series.update({
    where: { id },
    data: {
      ...(title && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
    },
  });

  // 作品の並び順を更新
  if (novelIds && Array.isArray(novelIds)) {
    // まず既存の作品のseriesIdをクリア
    await prisma.novel.updateMany({
      where: { seriesId: id },
      data: { seriesId: null, seriesOrder: null },
    });

    // 新しい並び順で設定
    await Promise.all(
      novelIds.map((novelId: string, index: number) =>
        prisma.novel.update({
          where: { id: novelId },
          data: { seriesId: id, seriesOrder: index + 1 },
        })
      )
    );
  }

  const result = await prisma.series.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      novels: {
        orderBy: { seriesOrder: "asc" },
        select: { id: true, title: true, seriesOrder: true },
      },
    },
  });

  return NextResponse.json(result);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { id } = await params;
  const series = await prisma.series.findUnique({ where: { id } });

  if (!series || series.authorId !== session.user.id) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  // 作品のseriesIdをクリアしてからシリーズ削除
  await prisma.novel.updateMany({
    where: { seriesId: id },
    data: { seriesId: null, seriesOrder: null },
  });

  await prisma.series.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
