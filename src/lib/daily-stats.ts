import { prisma } from "@/lib/prisma";

function getToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export async function incrementDailyViews(novelId: string) {
  const today = getToday();
  await prisma.dailyStats.upsert({
    where: { novelId_date: { novelId, date: today } },
    update: { views: { increment: 1 } },
    create: { novelId, date: today, views: 1 },
  });
}

export async function incrementDailyLikes(novelId: string, delta: number) {
  const today = getToday();
  await prisma.dailyStats.upsert({
    where: { novelId_date: { novelId, date: today } },
    update: { likes: { increment: delta } },
    create: { novelId, date: today, likes: Math.max(0, delta) },
  });
}

export async function incrementDailyBookmarks(novelId: string, delta: number) {
  const today = getToday();
  await prisma.dailyStats.upsert({
    where: { novelId_date: { novelId, date: today } },
    update: { bookmarks: { increment: delta } },
    create: { novelId, date: today, bookmarks: Math.max(0, delta) },
  });
}
