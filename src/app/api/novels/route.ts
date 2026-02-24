import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const sort = searchParams.get("sort") || "recent";
  const genre = searchParams.get("genre") || "";
  const q = searchParams.get("q") || "";

  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { author: { name: { contains: q } } },
    ];
  }

  if (genre) {
    where.genres = { some: { genre: { slug: genre } } };
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

  const { title, synopsis, genreIds } = await request.json();

  if (!title || !synopsis) {
    return NextResponse.json({ error: "タイトルとあらすじは必須です" }, { status: 400 });
  }

  const novel = await prisma.novel.create({
    data: {
      title,
      synopsis,
      authorId: session.user.id,
      genres: genreIds?.length
        ? { create: genreIds.map((genreId: string) => ({ genreId })) }
        : undefined,
    },
    include: {
      author: { select: { id: true, name: true } },
      genres: { include: { genre: true } },
    },
  });

  return NextResponse.json(novel, { status: 201 });
}
