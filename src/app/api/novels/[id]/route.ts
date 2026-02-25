import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const novel = await prisma.novel.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, bio: true } },
      genres: { include: { genre: true } },
      tags: { include: { tag: true } },
      series: { select: { id: true, title: true } },
      chapters: {
        where: { publishedAt: { not: null, lte: new Date() } },
        orderBy: { chapterNum: "asc" },
        select: { id: true, title: true, chapterNum: true, publishedAt: true, content: true },
      },
      _count: { select: { likes: true, comments: true, reviews: true } },
    },
  });

  if (!novel) {
    return NextResponse.json({ error: "作品が見つかりません" }, { status: 404 });
  }

  // content を charCount に変換して返す
  const response = {
    ...novel,
    chapters: novel.chapters.map(({ content, ...ch }) => ({
      ...ch,
      charCount: content.length,
    })),
  };

  return NextResponse.json(response);
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
  const novel = await prisma.novel.findUnique({ where: { id } });

  if (!novel || novel.authorId !== session.user.id) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { title, synopsis, status, genreIds, tags, seriesId } = await request.json();

  // Update genres: delete existing and create new
  if (genreIds) {
    await prisma.novelGenre.deleteMany({ where: { novelId: id } });
  }

  // Update tags: upsert tag names, then replace associations
  let tagIds: string[] | undefined;
  if (tags) {
    await prisma.novelTag.deleteMany({ where: { novelId: id } });
    if ((tags as string[]).length > 0) {
      const tagRecords = await Promise.all(
        (tags as string[]).slice(0, 10).map((name: string) =>
          prisma.tag.upsert({
            where: { name: name.trim() },
            update: {},
            create: { name: name.trim() },
          })
        )
      );
      tagIds = tagRecords.map((t) => t.id);
    }
  }

  // シリーズ更新
  let seriesOrder: number | null | undefined;
  if (seriesId !== undefined) {
    if (seriesId) {
      const lastInSeries = await prisma.novel.findFirst({
        where: { seriesId, id: { not: id } },
        orderBy: { seriesOrder: "desc" },
      });
      seriesOrder = (lastInSeries?.seriesOrder || 0) + 1;
    } else {
      seriesOrder = null;
    }
  }

  const updated = await prisma.novel.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(synopsis && { synopsis }),
      ...(status && { status }),
      ...(seriesId !== undefined && { seriesId: seriesId || null, seriesOrder: seriesOrder ?? null }),
      ...(genreIds && {
        genres: { create: genreIds.map((genreId: string) => ({ genreId })) },
      }),
      ...(tagIds && {
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      }),
    },
    include: {
      author: { select: { id: true, name: true } },
      genres: { include: { genre: true } },
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json(updated);
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
  const novel = await prisma.novel.findUnique({ where: { id } });

  if (!novel || novel.authorId !== session.user.id) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  await prisma.novel.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
