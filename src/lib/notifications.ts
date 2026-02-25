import { prisma } from "@/lib/prisma";

/** フォロワー全員に通知を送る */
export async function notifyFollowers(
  authorId: string,
  type: string,
  message: string,
  link?: string
) {
  const followers = await prisma.follow.findMany({
    where: { followingId: authorId },
    select: { followerId: true },
  });

  if (followers.length === 0) return;

  await prisma.notification.createMany({
    data: followers.map((f) => ({
      userId: f.followerId,
      type,
      message,
      link,
    })),
  });
}

/** 特定ユーザーに通知を送る */
export async function notifyUser(
  userId: string,
  type: string,
  message: string,
  link?: string
) {
  await prisma.notification.create({
    data: { userId, type, message, link },
  });
}
