"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 通知を取得
  const fetchNotifications = () => {
    if (!session?.user) return;
    fetch("/api/notifications?limit=15")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      });
  };

  useEffect(() => {
    fetchNotifications();
    // 30秒ごとにポーリング
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // パネル外クリックで閉じる
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markAsRead = async (ids: string[] | "all") => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    fetchNotifications();
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.read) {
      markAsRead([notif.id]);
    }
    setOpen(false);
  };

  if (!session?.user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
        title="通知"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl shadow-xl z-50 overflow-hidden">
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <span className="text-sm font-semibold">通知</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead("all")}
                className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
              >
                <CheckCheck size={12} />
                すべて既読
              </button>
            )}
          </div>

          {/* 通知リスト */}
          <div className="overflow-y-auto max-h-[320px]">
            {notifications.length > 0 ? (
              notifications.map((notif) => {
                const content = (
                  <div
                    className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--color-border)] last:border-b-0 transition-colors hover:bg-[var(--color-muted)] ${
                      !notif.read ? "bg-[var(--color-primary)]/5" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{notif.message}</p>
                      <p className="text-[10px] text-[var(--color-muted-foreground)] mt-1">
                        {formatRelativeTime(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 mt-1.5" />
                    )}
                  </div>
                );

                if (notif.link) {
                  return (
                    <Link
                      key={notif.id}
                      href={notif.link}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.read) markAsRead([notif.id]);
                    }}
                    className="cursor-pointer"
                  >
                    {content}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
                通知はありません
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
