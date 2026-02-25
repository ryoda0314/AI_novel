import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// POST: コンテストに作品をエントリー
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { id } = await params;
  const { novelId } = await request.json();

  // コンテストの存在と期間チェック
  const contest = await prisma.contest.findUnique({ where: { id } });
  if (!contest) {
    return NextResponse.json({ error: "コンテストが見つかりません" }, { status: 404 });
  }
  if (contest.status !== "active") {
    return NextResponse.json({ error: "このコンテストは現在エントリーを受付していません" }, { status: 400 });
  }

  // 自分の作品かチェック
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { authorId: true },
  });
  if (!novel || novel.authorId !== session.user.id) {
    return NextResponse.json({ error: "自分の作品のみエントリーできます" }, { status: 403 });
  }

  // 重複チェック
  const existing = await prisma.contestEntry.findUnique({
    where: { contestId_novelId: { contestId: id, novelId } },
  });
  if (existing) {
    return NextResponse.json({ error: "この作品は既にエントリー済みです" }, { status: 409 });
  }

  const entry = await prisma.contestEntry.create({
    data: { contestId: id, novelId },
  });

  return NextResponse.json(entry, { status: 201 });
}

// DELETE: エントリー取消
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const novelId = searchParams.get("novelId");

  if (!novelId) {
    return NextResponse.json({ error: "novelIdが必要です" }, { status: 400 });
  }

  // 自分の作品かチェック
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { authorId: true },
  });
  if (!novel || novel.authorId !== session.user.id) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  await prisma.contestEntry.deleteMany({
    where: { contestId: id, novelId },
  });

  return NextResponse.json({ success: true });
}
