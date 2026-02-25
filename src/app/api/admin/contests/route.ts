import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const { title, description, theme, startDate, endDate } = await request.json();

  if (!title || !description || !theme || !startDate || !endDate) {
    return NextResponse.json({ error: "すべてのフィールドが必要です" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  const status = start <= now ? "active" : "upcoming";

  const contest = await prisma.contest.create({
    data: { title, description, theme, startDate: start, endDate: end, status },
  });

  return NextResponse.json(contest, { status: 201 });
}
