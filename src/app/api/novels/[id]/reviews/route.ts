import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// GET: 作品のレビュー一覧 + 平均評価
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || "1");
  const limit = 10;

  const [reviews, total, aggregate, userReview] = await Promise.all([
    prisma.review.findMany({
      where: { novelId: id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where: { novelId: id } }),
    prisma.review.aggregate({
      where: { novelId: id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    session?.user?.id
      ? prisma.review.findUnique({
          where: { userId_novelId: { userId: session.user.id, novelId: id } },
        })
      : null,
  ]);

  return NextResponse.json({
    reviews,
    total,
    averageRating: aggregate._avg.rating ?? 0,
    ratingCount: aggregate._count.rating,
    userReview,
    hasMore: page * limit < total,
  });
}

// POST: レビューを投稿（1作品につき1レビュー）
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { id } = await params;
  const { rating, title, content } = await request.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "評価は1〜5で指定してください" }, { status: 400 });
  }

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "タイトルと本文は必須です" }, { status: 400 });
  }

  // 自分の作品にはレビューできない
  const novel = await prisma.novel.findUnique({ where: { id }, select: { authorId: true } });
  if (!novel) {
    return NextResponse.json({ error: "作品が見つかりません" }, { status: 404 });
  }
  if (novel.authorId === session.user.id) {
    return NextResponse.json({ error: "自分の作品にはレビューできません" }, { status: 403 });
  }

  // 既存レビューがある場合は更新
  const review = await prisma.review.upsert({
    where: { userId_novelId: { userId: session.user.id, novelId: id } },
    update: {
      rating,
      title: title.trim(),
      content: content.trim(),
    },
    create: {
      rating,
      title: title.trim(),
      content: content.trim(),
      userId: session.user.id,
      novelId: id,
    },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(review, { status: 201 });
}

// DELETE: 自分のレビューを削除
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { id } = await params;

  const review = await prisma.review.findUnique({
    where: { userId_novelId: { userId: session.user.id, novelId: id } },
  });

  if (!review) {
    return NextResponse.json({ error: "レビューが見つかりません" }, { status: 404 });
  }

  await prisma.review.delete({ where: { id: review.id } });

  return NextResponse.json({ success: true });
}
