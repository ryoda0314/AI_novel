"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, AlertTriangle } from "lucide-react";
import { NovelMarkdown } from "@/components/novel/novel-markdown";
import { NovelInlineText } from "@/components/novel/novel-inline-text";

interface PreviewChapter {
  id: string;
  title: string;
  content: string;
  chapterNum: number;
  publishedAt: string | null;
  novel: {
    id: string;
    title: string;
    author: { id: string; name: string };
  };
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-[var(--color-muted)] rounded w-2/3" />
        <div className="h-64 bg-[var(--color-muted)] rounded" />
      </div>
    }>
      <PreviewContent />
    </Suspense>
  );
}

function PreviewContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [chapter, setChapter] = useState<PreviewChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("プレビュートークンがありません");
      setLoading(false);
      return;
    }

    fetch(`/api/preview?token=${token}`)
      .then(r => {
        if (!r.ok) throw new Error("プレビューが見つかりません");
        return r.json();
      })
      .then(setChapter)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-[var(--color-muted)] rounded w-2/3" />
        <div className="h-64 bg-[var(--color-muted)] rounded" />
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <AlertTriangle size={48} className="mx-auto mb-4 text-[var(--color-muted-foreground)]" />
        <p className="text-[var(--color-muted-foreground)]">{error || "プレビューが見つかりません"}</p>
      </div>
    );
  }

  const isUnpublished = !chapter.publishedAt || new Date(chapter.publishedAt) > new Date();

  return (
    <div className="max-w-3xl mx-auto">
      {/* Preview Banner */}
      <div className="mb-6 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
        <Eye size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-200">
          これはプレビューリンクによる限定公開です。
          {isUnpublished && " この話はまだ公開されていません。"}
        </p>
      </div>

      {/* Chapter Header */}
      <div className="mb-8">
        <p className="text-sm text-[var(--color-muted-foreground)] mb-1">
          <Link href={`/novels/${chapter.novel.id}`} className="hover:text-[var(--color-primary)]">
            {chapter.novel.title}
          </Link>
          {" / "}
          <Link href={`/users/${chapter.novel.author.id}`} className="hover:text-[var(--color-primary)]">
            {chapter.novel.author.name}
          </Link>
        </p>
        <h1 className="text-2xl font-bold">
          <span className="text-[var(--color-muted-foreground)] text-lg font-normal mr-2">
            第{chapter.chapterNum}話
          </span>
          <NovelInlineText text={chapter.title} />
        </h1>
      </div>

      {/* Content */}
      <NovelMarkdown
        content={chapter.content}
        className="novel-content mb-8"
      />
    </div>
  );
}
