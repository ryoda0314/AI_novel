import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "likes";
  const period = searchParams.get("period") || "all";
  const limit = parseInt(searchParams.get("limit") || "100");

  // 期間フィルター用の日付
  let periodStart: Date | null = null;
  const now = new Date();
  if (period === "weekly") {
    periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "monthly") {
    periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  if (type === "votes" && periodStart) {
    // 期間内のいいね数でランキング
    const novels = await prisma.novel.findMany({
      where: {
        likes: { some: { createdAt: { gte: periodStart } } },
      },
      include: {
        author: { select: { id: true, name: true } },
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
        _count: { select: { likes: true, chapters: true, reviews: true } },
        likes: {
          where: { createdAt: { gte: periodStart } },
          select: { id: true },
        },
      },
      take: limit * 2, // 多めに取得してソート
    });

    // 期間内のいいね数でソート
    const sorted = novels
      .map((n) => ({
        ...n,
        periodLikes: n.likes.length,
        likes: undefined, // likes配列は返さない
      }))
      .sort((a, b) => b.periodLikes - a.periodLikes)
      .slice(0, limit);

    return NextResponse.json(sorted);
  }

  if (type === "rating") {
    // レビュー平均評価ランキング（レビュー3件以上）
    const novels = await prisma.novel.findMany({
      where: {
        reviews: { some: {} },
      },
      include: {
        author: { select: { id: true, name: true } },
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
        _count: { select: { likes: true, chapters: true, reviews: true } },
        reviews: { select: { rating: true } },
      },
      take: limit * 2,
    });

    const sorted = novels
      .filter((n) => n.reviews.length >= 3)
      .map((n) => {
        const avg = n.reviews.reduce((s, r) => s + r.rating, 0) / n.reviews.length;
        return {
          ...n,
          averageRating: Math.round(avg * 10) / 10,
          reviews: undefined,
        };
      })
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);

    return NextResponse.json(sorted);
  }

  // 既存のランキング（全期間）
  let orderBy: Record<string, unknown>;

  switch (type) {
    case "views":
      orderBy = { viewCount: "desc" };
      break;
    case "recent":
      orderBy = { createdAt: "desc" };
      break;
    case "votes":
    default:
      orderBy = { likes: { _count: "desc" } };
  }

  const novels = await prisma.novel.findMany({
    include: {
      author: { select: { id: true, name: true } },
      genres: { include: { genre: true } },
      tags: { include: { tag: true } },
      _count: { select: { likes: true, chapters: true, reviews: true } },
    },
    orderBy,
    take: limit,
  });

  return NextResponse.json(novels);
}
