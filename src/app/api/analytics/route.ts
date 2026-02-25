import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const novelId = searchParams.get("novelId");
  const days = parseInt(searchParams.get("days") || "30");

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  // Get user's novels
  const novels = await prisma.novel.findMany({
    where: { authorId: session.user.id },
    select: { id: true, title: true, viewCount: true, _count: { select: { likes: true, bookmarks: true, chapters: true } } },
    orderBy: { viewCount: "desc" },
  });

  const novelIds = novelId ? [novelId] : novels.map(n => n.id);

  // Verify ownership
  if (novelId && !novels.some(n => n.id === novelId)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  // Get daily stats
  const dailyStats = await prisma.dailyStats.findMany({
    where: {
      novelId: { in: novelIds },
      date: { gte: since },
    },
    orderBy: { date: "asc" },
  });

  // Aggregate by date
  const dateMap: Record<string, { views: number; likes: number; bookmarks: number }> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    dateMap[key] = { views: 0, likes: 0, bookmarks: 0 };
  }

  for (const stat of dailyStats) {
    const key = new Date(stat.date).toISOString().split("T")[0];
    if (dateMap[key]) {
      dateMap[key].views += stat.views;
      dateMap[key].likes += stat.likes;
      dateMap[key].bookmarks += stat.bookmarks;
    }
  }

  const chartData = Object.entries(dateMap).map(([date, stats]) => ({
    date,
    ...stats,
  }));

  // Summary totals
  const totalViews = novels.reduce((sum, n) => sum + n.viewCount, 0);
  const totalLikes = novels.reduce((sum, n) => sum + n._count.likes, 0);
  const totalBookmarks = novels.reduce((sum, n) => sum + n._count.bookmarks, 0);

  // Period totals
  const periodViews = chartData.reduce((sum, d) => sum + d.views, 0);
  const periodLikes = chartData.reduce((sum, d) => sum + d.likes, 0);
  const periodBookmarks = chartData.reduce((sum, d) => sum + d.bookmarks, 0);

  return NextResponse.json({
    novels,
    chartData,
    summary: { totalViews, totalLikes, totalBookmarks },
    period: { views: periodViews, likes: periodLikes, bookmarks: periodBookmarks },
  });
}
