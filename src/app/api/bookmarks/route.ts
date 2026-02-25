import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const [bookmarks, total] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId: session.user.id },
      include: {
        novel: {
          include: {
            author: { select: { id: true, name: true } },
            genres: { include: { genre: true } },
            tags: { include: { tag: true } },
            _count: { select: { likes: true, chapters: true, comments: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bookmark.count({ where: { userId: session.user.id } }),
  ]);

  const novels = bookmarks.map((b) => b.novel);

  return NextResponse.json({
    novels,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
