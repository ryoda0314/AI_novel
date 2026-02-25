import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

// GET: プレビュートークンで章を取得（認証不要）
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "トークンが必要です" }, { status: 400 });
  }

  const chapter = await prisma.chapter.findUnique({
    where: { previewToken: token },
    include: {
      novel: {
        select: { id: true, title: true, author: { select: { id: true, name: true } } },
      },
    },
  });

  if (!chapter) {
    return NextResponse.json({ error: "プレビューが見つかりません" }, { status: 404 });
  }

  return NextResponse.json(chapter);
}

// POST: プレビュートークンを生成（作者のみ）
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { chapterId } = await request.json();

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { novel: { select: { authorId: true } } },
  });

  if (!chapter || chapter.novel.authorId !== session.user.id) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  // 既存トークンがあればそれを返す
  if (chapter.previewToken) {
    return NextResponse.json({ token: chapter.previewToken });
  }

  // 新しいトークンを生成
  const token = randomBytes(24).toString("hex");
  await prisma.chapter.update({
    where: { id: chapterId },
    data: { previewToken: token },
  });

  return NextResponse.json({ token }, { status: 201 });
}

// DELETE: プレビュートークンを無効化（作者のみ）
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const chapterId = searchParams.get("chapterId");

  if (!chapterId) {
    return NextResponse.json({ error: "chapterIdが必要です" }, { status: 400 });
  }

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { novel: { select: { authorId: true } } },
  });

  if (!chapter || chapter.novel.authorId !== session.user.id) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  await prisma.chapter.update({
    where: { id: chapterId },
    data: { previewToken: null },
  });

  return NextResponse.json({ success: true });
}
