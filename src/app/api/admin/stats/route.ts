import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const [userCount, novelCount, chapterCount, commentCount, reportCount] = await Promise.all([
    prisma.user.count(),
    prisma.novel.count(),
    prisma.chapter.count(),
    prisma.comment.count(),
    prisma.report.count({ where: { status: "pending" } }),
  ]);

  // 直近7日間の新規ユーザー数
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newUsersWeek = await prisma.user.count({
    where: { createdAt: { gte: weekAgo } },
  });

  const newNovelsWeek = await prisma.novel.count({
    where: { createdAt: { gte: weekAgo } },
  });

  return NextResponse.json({
    userCount,
    novelCount,
    chapterCount,
    commentCount,
    reportCount,
    newUsersWeek,
    newNovelsWeek,
  });
}
