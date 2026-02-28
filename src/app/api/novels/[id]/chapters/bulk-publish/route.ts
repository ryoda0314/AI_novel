import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { notifyFollowers } from "@/lib/notifications";

export async function PATCH(
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

  const { chapterIds } = await request.json();

  if (!Array.isArray(chapterIds) || chapterIds.length === 0) {
    return NextResponse.json(
      { error: "公開する章を選択してください" },
      { status: 400 }
    );
  }

  const now = new Date();

  const result = await prisma.chapter.updateMany({
    where: {
      id: { in: chapterIds },
      novelId: id,
      publishedAt: null,
    },
    data: {
      publishedAt: now,
    },
  });

  if (result.count > 0) {
    notifyFollowers(
      session.user.id,
      "new_chapter",
      `「${novel.title}」に${result.count}話が一括公開されました`,
      `/novels/${id}`
    ).catch(() => {});
  }

  return NextResponse.json({ published: result.count });
}
