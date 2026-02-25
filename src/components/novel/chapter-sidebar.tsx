"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X, BookOpen } from "lucide-react";
import { NovelInlineText } from "./novel-inline-text";

interface SidebarChapter {
  id: string;
  title: string;
  chapterNum: number;
}

interface ChapterSidebarProps {
  novelId: string;
  novelTitle: string;
  chapters: SidebarChapter[];
  currentChapterId: string;
  open: boolean;
  onClose: () => void;
}

export function ChapterSidebar({
  novelId,
  novelTitle,
  chapters,
  currentChapterId,
  open,
  onClose,
}: ChapterSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // 現在の章にスクロール
  useEffect(() => {
    if (open && activeRef.current) {
      activeRef.current.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [open]);

  // Escapeキーで閉じる
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {/* オーバーレイ */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-[var(--color-background)] border-r border-[var(--color-border)] shadow-xl z-50 transform transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen size={16} className="shrink-0 text-[var(--color-primary)]" />
            <Link
              href={`/novels/${novelId}`}
              className="text-sm font-semibold truncate hover:text-[var(--color-primary)]"
              onClick={onClose}
            >
              <NovelInlineText text={novelTitle} />
            </Link>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* 章リスト */}
        <nav className="overflow-y-auto h-[calc(100%-52px)]">
          <ul className="py-2">
            {chapters.map((ch) => {
              const isCurrent = ch.id === currentChapterId;
              return (
                <li key={ch.id}>
                  <Link
                    ref={isCurrent ? activeRef : undefined}
                    href={`/novels/${novelId}/chapters/${ch.id}`}
                    onClick={onClose}
                    className={`flex items-baseline gap-2 px-4 py-2.5 text-sm transition-colors ${
                      isCurrent
                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium border-l-3 border-[var(--color-primary)]"
                        : "text-[var(--color-foreground)] hover:bg-[var(--color-muted)] border-l-3 border-transparent"
                    }`}
                  >
                    <span className={`shrink-0 text-xs ${isCurrent ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]"}`}>
                      {ch.chapterNum}.
                    </span>
                    <span className="truncate">
                      <NovelInlineText text={ch.title} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
