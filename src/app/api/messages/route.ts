import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// メッセージ一覧（会話リスト）
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const withUser = searchParams.get("with");

  if (withUser) {
    // 特定ユーザーとの会話を取得
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: withUser },
          { senderId: withUser, receiverId: session.user.id },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    // 未読メッセージを既読にする
    await prisma.message.updateMany({
      where: {
        senderId: withUser,
        receiverId: session.user.id,
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json(messages);
  }

  // 会話リスト（最新メッセージのある相手一覧）
  const userId = session.user.id;

  // 送受信した全メッセージから相手ユーザーを特定
  const sentMessages = await prisma.message.findMany({
    where: { senderId: userId },
    select: { receiverId: true, createdAt: true, content: true, read: true },
    orderBy: { createdAt: "desc" },
  });

  const receivedMessages = await prisma.message.findMany({
    where: { receiverId: userId },
    select: { senderId: true, createdAt: true, content: true, read: true },
    orderBy: { createdAt: "desc" },
  });

  // 相手ごとに最新メッセージをまとめる
  const conversationMap = new Map<string, { lastMessage: string; lastAt: Date; unread: number }>();

  for (const msg of sentMessages) {
    const existing = conversationMap.get(msg.receiverId);
    if (!existing || msg.createdAt > existing.lastAt) {
      conversationMap.set(msg.receiverId, {
        lastMessage: msg.content,
        lastAt: msg.createdAt,
        unread: existing?.unread || 0,
      });
    }
  }

  for (const msg of receivedMessages) {
    const existing = conversationMap.get(msg.senderId);
    const unread = (existing?.unread || 0) + (msg.read ? 0 : 1);
    if (!existing || msg.createdAt > existing.lastAt) {
      conversationMap.set(msg.senderId, {
        lastMessage: msg.content,
        lastAt: msg.createdAt,
        unread,
      });
    } else if (existing) {
      existing.unread = unread;
    }
  }

  const userIds = Array.from(conversationMap.keys());
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatarUrl: true },
  });

  const conversations = users
    .map(u => {
      const conv = conversationMap.get(u.id)!;
      return { user: u, ...conv };
    })
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());

  return NextResponse.json(conversations);
}

// メッセージ送信
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { receiverId, content } = await request.json();

  if (!receiverId || !content?.trim()) {
    return NextResponse.json({ error: "宛先とメッセージは必須です" }, { status: 400 });
  }

  if (receiverId === session.user.id) {
    return NextResponse.json({ error: "自分にメッセージは送れません" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      content: content.trim(),
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(message, { status: 201 });
}
