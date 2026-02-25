import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { notifyUser } from "@/lib/notifications";

// GET: フォロー状態とフォロワー数を取得
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  const [followerCount, followingCount, isFollowing] = await Promise.all([
    prisma.follow.count({ where: { followingId: id } }),
    prisma.follow.count({ where: { followerId: id } }),
    session?.user?.id
      ? prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: session.user.id,
              followingId: id,
            },
          },
        })
      : null,
  ]);

  return NextResponse.json({
    followerCount,
    followingCount,
    isFollowing: !!isFollowing,
  });
}

// POST: フォロー/アンフォロー切り替え
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { id } = await params;

  // 自分自身はフォローできない
  if (session.user.id === id) {
    return NextResponse.json({ error: "自分自身はフォローできません" }, { status: 400 });
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: id,
      },
    },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ isFollowing: false });
  }

  await prisma.follow.create({
    data: { followerId: session.user.id, followingId: id },
  });

  // フォロー通知を送る
  const followerName = session.user.name || "ユーザー";
  notifyUser(
    id,
    "new_follower",
    `${followerName}さんがあなたをフォローしました`,
    `/users/${session.user.id}`
  ).catch(() => {});

  return NextResponse.json({ isFollowing: true });
}
