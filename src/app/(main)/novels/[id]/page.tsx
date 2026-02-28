"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Eye, BookOpen, Clock, PlayCircle, Library, Download } from "lucide-react";
import { useSession } from "next-auth/react";
import { formatDate, getStatusLabel, getStatusColor, estimateReadingTime } from "@/lib/utils";
import { LikeButton } from "@/components/interactions/like-button";
import { BookmarkButton } from "@/components/interactions/bookmark-button";
import { CommentSection } from "@/components/interactions/comment-section";
import { ReviewSection } from "@/components/interactions/review-section";
import { ShareButtons } from "@/components/interactions/share-buttons";
import { ReportButton } from "@/components/interactions/report-button";
import { NovelMarkdown } from "@/components/novel/novel-markdown";
import { NovelInlineText } from "@/components/novel/novel-inline-text";

interface Novel {
  id: string;
  serialNumber: number;
  title: string;
  synopsis: string;
  coverUrl?: string | null;
  status: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; bio?: string };
  genres: { genre: { name: string; slug: string } }[];
  tags?: { tag: { id: string; name: string } }[];
  series?: { id: string; title: string } | null;
  chapters: { id: string; title: string; chapterNum: number; publishedAt: string; charCount: number }[];
  _count: { likes: number; comments: number };
}

interface ReadingProgress {
  chapter: { id: string; title: string; chapterNum: number };
}

export default function NovelDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [likeData, setLikeData] = useState({ liked: false, count: 0 });
  const [bookmarkData, setBookmarkData] = useState({ bookmarked: false, count: 0 });
  const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;

    Promise.all([
      fetch(`/api/novels/${params.id}`).then(r => r.json()),
      fetch(`/api/novels/${params.id}/like`).then(r => r.json()),
      fetch(`/api/novels/${params.id}/bookmark`).then(r => r.json()),
    ]).then(([novelData, like, bookmark]) => {
      setNovel(novelData);
      setLikeData(like);
      setBookmarkData(bookmark);
      setLoading(false);
    });

    // Increment view count
    fetch(`/api/novels/${params.id}/view`, { method: "POST" });
  }, [params.id]);

  // 読書履歴を取得
  useEffect(() => {
    if (!params.id || !session?.user) return;
    fetch(`/api/reading-history?novelId=${params.id}&limit=1`)
      .then(r => r.json())
      .then((data) => {
        if (data?.length > 0) setReadingProgress(data[0]);
      })
      .catch(() => {});
  }, [params.id, session]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-muted)] rounded w-2/3" />
          <div className="h-4 bg-[var(--color-muted)] rounded w-1/4" />
          <div className="h-32 bg-[var(--color-muted)] rounded" />
        </div>
      </div>
    );
  }

  if (!novel) {
    return <div className="text-center py-16">作品が見つかりませんでした</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className={`flex ${novel.coverUrl ? "gap-6" : ""}`}>
          {/* Cover Image - 縦長表紙 */}
          {novel.coverUrl && (
            <div className="w-40 shrink-0">
              <img
                src={novel.coverUrl}
                alt={novel.title}
                className="w-full rounded-lg border border-[var(--color-border)] shadow-sm"
              />
            </div>
          )}

          {/* Meta Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-3xl font-bold">
                <span className="text-lg text-[var(--color-muted-foreground)] font-normal mr-2">#{novel.serialNumber}</span>
                <NovelInlineText text={novel.title} />
              </h1>
              <span className={`shrink-0 text-sm px-3 py-1 rounded-full ${getStatusColor(novel.status)}`}>
                {getStatusLabel(novel.status)}
              </span>
            </div>

            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-muted-foreground)] mb-4">
              <Link href={`/users/${novel.author.id}`} className="hover:text-[var(--color-primary)]">
                作者: {novel.author.name}
              </Link>
              <span className="flex items-center gap-1">
                <Eye size={14} /> {novel.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen size={14} /> {novel.chapters.length}話
              </span>
              {novel.chapters.length > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {estimateReadingTime(novel.chapters.reduce((sum, ch) => sum + ch.charCount, 0))}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={14} /> {formatDate(novel.createdAt)}
              </span>
            </div>

            {/* Genres */}
            {novel.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {novel.genres.map(({ genre }) => (
                  <Link
                    key={genre.slug}
                    href={`/novels?genre=${genre.slug}`}
                    className="text-xs px-3 py-1 rounded-full bg-[var(--color-muted)] hover:bg-[var(--color-border)] transition-colors"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Tags */}
            {novel.tags && novel.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {novel.tags.map(({ tag }) => (
                  <Link
                    key={tag.id}
                    href={`/novels?tag=${encodeURIComponent(tag.name)}`}
                    className="text-xs px-3 py-1 rounded-full border border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Series */}
            {novel.series && (
              <div className="mb-4">
                <Link
                  href={`/series/${novel.series.id}`}
                  className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors"
                >
                  <Library size={14} />
                  シリーズ: {novel.series.title}
                </Link>
              </div>
            )}

            {/* Like & Bookmark & Download buttons */}
            <div className="flex items-center flex-wrap gap-3">
              <LikeButton
                novelId={novel.id}
                initialLiked={likeData.liked}
                initialCount={likeData.count}
              />
              <BookmarkButton
                novelId={novel.id}
                initialBookmarked={bookmarkData.bookmarked}
                initialCount={bookmarkData.count}
              />
              {novel.chapters.length > 0 && (
                <a
                  href={`/api/novels/${novel.id}/export`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
                >
                  <Download size={14} /> EPUB
                </a>
              )}
              <ShareButtons title={novel.title} />
              <ReportButton targetType="novel" targetId={novel.id} />
            </div>
          </div>
        </div>
      </div>

      {/* Synopsis */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">あらすじ</h2>
        <NovelMarkdown
          content={novel.synopsis}
          className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] markdown-body"
          showMetadata={false}
        />
      </section>

      {/* Continue Reading */}
      {readingProgress && (
        <section className="mb-8">
          <Link
            href={`/novels/${novel.id}/chapters/${readingProgress.chapter.id}`}
            className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 transition-colors"
          >
            <PlayCircle size={24} className="text-[var(--color-primary)] shrink-0" />
            <div>
              <p className="text-sm font-medium">続きから読む</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                第{readingProgress.chapter.chapterNum}話: <NovelInlineText text={readingProgress.chapter.title} />
              </p>
            </div>
          </Link>
        </section>
      )}

      {/* Chapters */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">
          目次 ({novel.chapters.length}話)
        </h2>
        {novel.chapters.length > 0 ? (
          <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
            {novel.chapters.map((chapter, i) => (
              <Link
                key={chapter.id}
                href={`/novels/${novel.id}/chapters/${chapter.id}`}
                className={`flex items-center justify-between px-5 py-3 hover:bg-[var(--color-muted)] transition-colors ${
                  i > 0 ? "border-t border-[var(--color-border)]" : ""
                }`}
              >
                <span className="text-sm">
                  <span className="text-[var(--color-muted-foreground)] mr-3">第{chapter.chapterNum}話</span>
                  <NovelInlineText text={chapter.title} />
                </span>
                <span className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] shrink-0">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {estimateReadingTime(chapter.charCount)}
                  </span>
                  <span>{formatDate(chapter.publishedAt)}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-[var(--color-muted-foreground)]">
            まだ話が投稿されていません
          </p>
        )}
      </section>

      {/* Reviews */}
      <section className="mb-8">
        <ReviewSection novelId={novel.id} />
      </section>

      {/* Comments */}
      <section>
        <CommentSection novelId={novel.id} />
      </section>
    </div>
  );
}
