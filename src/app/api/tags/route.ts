import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  const tags = await prisma.tag.findMany({
    where: q
      ? { name: { contains: q, mode: "insensitive" } }
      : undefined,
    orderBy: { novels: { _count: "desc" } },
    take: 20,
    select: {
      id: true,
      name: true,
      _count: { select: { novels: true } },
    },
  });

  return NextResponse.json(tags);
}
