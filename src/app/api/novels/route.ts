import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const sort = searchParams.get("sort") || "recent";
  const genre = searchParams.get("genre") || "";
  const tag = searchParams.get("tag") || "";
  const q = searchParams.get("q") || "";
  const authorId = searchParams.get("authorId") || "";

  const where: Record<string, unknown> = {};

  if (authorId) {
    where.authorId = authorId;
  }

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { author: { name: { contains: q } } },
    ];
  }

  if (genre) {
    where.genres = { some: { genre: { slug: genre } } };
  }

  if (tag) {
    where.tags = { some: { tag: { name: tag } } };
  }

  const orderBy: Record<string, string> = {};
  switch (sort) {
    case "likes":
      orderBy.likes = "desc";
      break;
    case "views":
      orderBy.viewCount = "desc";
      break;
    default:
      orderBy.createdAt = "desc";
  }

  const [novels, total] = await Promise.all([
    prisma.novel.findMany({
      where,
      include: {
        author: { select: { id: true, name: true } },
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
        _count: { select: { likes: true, chapters: true, comments: true } },
      },
      orderBy: sort === "likes"
        ? { likes: { _count: "desc" } }
        : orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.novel.count({ where }),
  ]);

  return NextResponse.json({
    novels,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { title, synopsis, genreIds, tags, seriesId } = await request.json();

  if (!title || !synopsis) {
    return NextResponse.json({ error: "タイトルとあらすじは必須です" }, { status: 400 });
  }

  // タグ名からupsertしてIDを取得
  let tagIds: string[] = [];
  if (tags?.length) {
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

  // シリーズの並び順を計算
  let seriesOrder: number | undefined;
  if (seriesId) {
    const lastInSeries = await prisma.novel.findFirst({
      where: { seriesId },
      orderBy: { seriesOrder: "desc" },
    });
    seriesOrder = (lastInSeries?.seriesOrder || 0) + 1;
  }

  const novel = await prisma.novel.create({
    data: {
      title,
      synopsis,
      authorId: session.user.id,
      seriesId: seriesId || null,
      seriesOrder: seriesOrder ?? null,
      genres: genreIds?.length
        ? { create: genreIds.map((genreId: string) => ({ genreId })) }
        : undefined,
      tags: tagIds.length
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    include: {
      author: { select: { id: true, name: true } },
      genres: { include: { genre: true } },
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json(novel, { status: 201 });
}
