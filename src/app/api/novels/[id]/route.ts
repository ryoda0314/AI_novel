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
      chapters: {
        where: { publishedAt: { not: null } },
        orderBy: { chapterNum: "asc" },
        select: { id: true, title: true, chapterNum: true, publishedAt: true },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!novel) {
    return NextResponse.json({ error: "作品が見つかりません" }, { status: 404 });
  }

  return NextResponse.json(novel);
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

  const { title, synopsis, status, genreIds } = await request.json();

  // Update genres: delete existing and create new
  if (genreIds) {
    await prisma.novelGenre.deleteMany({ where: { novelId: id } });
  }

  const updated = await prisma.novel.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(synopsis && { synopsis }),
      ...(status && { status }),
      ...(genreIds && {
        genres: { create: genreIds.map((genreId: string) => ({ genreId })) },
      }),
    },
    include: {
      author: { select: { id: true, name: true } },
      genres: { include: { genre: true } },
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
