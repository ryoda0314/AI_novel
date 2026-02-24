"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import { NovelMarkdown } from "@/components/novel/novel-markdown";
import { NovelInlineText } from "@/components/novel/novel-inline-text";
import { ReadingModeToggle } from "@/components/novel/reading-mode-toggle";

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
  const [readingMode, setReadingMode] = useState<"horizontal" | "vertical">("horizontal");
  const handleModeChange = useCallback((mode: "horizontal" | "vertical") => {
    setReadingMode(mode);
  }, []);

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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] mb-6">
        <Link href={`/novels/${chapter.novel.id}`} className="hover:text-[var(--color-primary)]">
          <NovelInlineText text={chapter.novel.title} />
        </Link>
        <span>/</span>
        <span>第{chapter.chapterNum}話</span>
      </div>

      {/* Chapter Header + Reading Mode Toggle */}
      <div className="flex items-start justify-between mb-10">
        <div className="text-center flex-1">
          <p className="text-sm text-[var(--color-muted-foreground)] mb-2">
            第{chapter.chapterNum}話
          </p>
          <h1 className="text-2xl font-bold"><NovelInlineText text={chapter.title} /></h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
            {chapter.novel.author.name}
          </p>
        </div>
        <ReadingModeToggle onChange={handleModeChange} />
      </div>

      {/* Content */}
      <NovelMarkdown
        content={chapter.content}
        className={`reading-content markdown-body mb-12 ${readingMode === "vertical" ? "reading-vertical" : ""}`}
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

          <Link
            href={`/novels/${chapter.novel.id}`}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors text-sm"
          >
            <List size={16} />
            目次
          </Link>

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
    </div>
  );
}
