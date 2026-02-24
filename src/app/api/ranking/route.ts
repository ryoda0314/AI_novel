import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "likes";
  const limit = parseInt(searchParams.get("limit") || "100");

  let orderBy: Record<string, unknown>;

  switch (type) {
    case "views":
      orderBy = { viewCount: "desc" };
      break;
    case "recent":
      orderBy = { createdAt: "desc" };
      break;
    default:
      orderBy = { likes: { _count: "desc" } };
  }

  const novels = await prisma.novel.findMany({
    include: {
      author: { select: { id: true, name: true } },
      genres: { include: { genre: true } },
      _count: { select: { likes: true, chapters: true } },
    },
    orderBy,
    take: limit,
  });

  return NextResponse.json(novels);
}
