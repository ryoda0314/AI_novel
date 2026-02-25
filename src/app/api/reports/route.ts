import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { targetType, targetId, reason, detail } = await request.json();

  if (!targetType || !targetId || !reason) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  if (!["novel", "comment", "review", "user"].includes(targetType)) {
    return NextResponse.json({ error: "無効な通報対象です" }, { status: 400 });
  }

  const report = await prisma.report.create({
    data: {
      targetType,
      targetId,
      reason,
      detail: detail || null,
      userId: session.user.id,
    },
  });

  return NextResponse.json(report, { status: 201 });
}
