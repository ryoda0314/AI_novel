import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: コンテスト一覧
export async function GET() {
  // ステータスを自動更新
  const now = new Date();
  await prisma.contest.updateMany({
    where: { status: "upcoming", startDate: { lte: now } },
    data: { status: "active" },
  });
  await prisma.contest.updateMany({
    where: { status: "active", endDate: { lte: now } },
    data: { status: "ended" },
  });

  const contests = await prisma.contest.findMany({
    include: { _count: { select: { entries: true } } },
    orderBy: [{ status: "asc" }, { endDate: "asc" }],
  });

  // active → upcoming → ended の順にソート
  const statusOrder: Record<string, number> = { active: 0, upcoming: 1, ended: 2 };
  contests.sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  return NextResponse.json(contests);
}
