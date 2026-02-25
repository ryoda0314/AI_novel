"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, List, Clock } from "lucide-react";
import { NovelMarkdown } from "@/components/novel/novel-markdown";
import { NovelInlineText } from "@/components/novel/novel-inline-text";
import { estimateReadingTime } from "@/lib/utils";
import {
  ReadingSettingsPanel,
  useReadingSettings,
  getReadingStyle,
} from "@/components/novel/reading-settings";
import { ChapterSidebar } from "@/components/novel/chapter-sidebar";
import { CommentSection } from "@/components/interactions/comment-section";

interface Chapter {
  id: string;
  title: string;
  content: string;
  chapterNum: number;
  novel: { id: string; title: string; author: { name: string } };
}

interface NavChapter {
  id: string;
  title: string;
  chapterNum: number;
}

export default function ChapterReadingPage() {
  const params = useParams();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [allChapters, setAllChapters] = useState<NavChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings, setSettings } = useReadingSettings();

  useEffect(() => {
    if (!params.id || !params.chapterId) return;

    Promise.all([
      fetch(`/api/novels/${params.id}/chapters/${params.chapterId}`).then(r => r.json()),
      fetch(`/api/novels/${params.id}/chapters`).then(r => r.json()),
    ]).then(([chapterData, chaptersData]) => {
      setChapter(chapterData);
      setAllChapters(chaptersData);
      setLoading(false);
      window.scrollTo(0, 0);

      // 読書履歴を記録
      fetch("/api/reading-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novelId: params.id, chapterId: params.chapterId }),
      }).catch(() => {});
    });
  }, [params.id, params.chapterId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-6 bg-[var(--color-muted)] rounded w-1/3" />
        <div className="h-4 bg-[var(--color-muted)] rounded w-1/2" />
        <div className="space-y-3 mt-8">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-4 bg-[var(--color-muted)] rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!chapter) {
    return <div className="text-center py-16">話が見つかりませんでした</div>;
  }

  const currentIndex = allChapters.findIndex(c => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* 目次サイドバー */}
      <ChapterSidebar
        novelId={chapter.novel.id}
        novelTitle={chapter.novel.title}
        chapters={allChapters}
        currentChapterId={chapter.id}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] mb-6">
        <Link href={`/novels/${chapter.novel.id}`} className="hover:text-[var(--color-primary)]">
          <NovelInlineText text={chapter.novel.title} />
        </Link>
        <span>/</span>
        <span>第{chapter.chapterNum}話</span>
      </div>

      {/* Chapter Header + Reading Settings */}
      <div className="flex items-start justify-between mb-10">
        <div className="text-center flex-1">
          <p className="text-sm text-[var(--color-muted-foreground)] mb-2">
            第{chapter.chapterNum}話
          </p>
          <h1 className="text-2xl font-bold"><NovelInlineText text={chapter.title} /></h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
            {chapter.novel.author.name}
          </p>
          <p className="flex items-center justify-center gap-1 text-xs text-[var(--color-muted-foreground)] mt-1">
            <Clock size={12} />
            {estimateReadingTime(chapter.content.length)}
            <span className="mx-1">|</span>
            {chapter.content.length.toLocaleString()}文字
          </p>
        </div>
        <ReadingSettingsPanel settings={settings} onChange={setSettings} />
      </div>

      {/* Content */}
      <NovelMarkdown
        content={chapter.content}
        className={`reading-content markdown-body mb-12 ${settings.mode === "vertical" ? "reading-vertical" : ""}`}
        style={getReadingStyle(settings)}
      />

      {/* Navigation */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <div className="flex items-center justify-between gap-4">
          {prevChapter ? (
            <Link
              href={`/novels/${chapter.novel.id}/chapters/${prevChapter.id}`}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors text-sm"
            >
              <ChevronLeft size={16} />
              前の話
            </Link>
          ) : (
            <div />
          )}

          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors text-sm"
          >
            <List size={16} />
            目次
          </button>

          {nextChapter ? (
            <Link
              href={`/novels/${chapter.novel.id}/chapters/${nextChapter.id}`}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors text-sm"
            >
              次の話
              <ChevronRight size={16} />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* Chapter Comments */}
      <section className="mt-8 pt-8 border-t border-[var(--color-border)]">
        <CommentSection novelId={chapter.novel.id} chapterId={chapter.id} />
      </section>
    </div>
  );
}
