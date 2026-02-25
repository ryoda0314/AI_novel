import { prisma } from "@/lib/prisma";
import { incrementDailyViews } from "@/lib/daily-stats";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.novel.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  incrementDailyViews(id).catch(() => {});

  return NextResponse.json({ success: true });
}
