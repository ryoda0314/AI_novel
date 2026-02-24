import { prisma } from "@/lib/prisma";
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

  return NextResponse.json({ success: true });
}
