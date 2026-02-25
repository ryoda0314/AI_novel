import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: コンテスト詳細 + エントリー作品
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const contest = await prisma.contest.findUnique({
    where: { id },
    include: {
      entries: {
        include: {
          novel: {
            include: {
              author: { select: { id: true, name: true } },
              genres: { include: { genre: true } },
              tags: { include: { tag: true } },
              _count: { select: { likes: true, chapters: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!contest) {
    return NextResponse.json({ error: "コンテストが見つかりません" }, { status: 404 });
  }

  return NextResponse.json(contest);
}
