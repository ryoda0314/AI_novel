"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Eye, BookOpen, Clock } from "lucide-react";
import { formatDate, getStatusLabel, getStatusColor } from "@/lib/utils";
import { LikeButton } from "@/components/interactions/like-button";
import { CommentSection } from "@/components/interactions/comment-section";
import { NovelMarkdown } from "@/components/novel/novel-markdown";
import { NovelInlineText } from "@/components/novel/novel-inline-text";

interface Novel {
  id: string;
  serialNumber: number;
  title: string;
  synopsis: string;
  status: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; bio?: string };
  genres: { genre: { name: string; slug: string } }[];
  chapters: { id: string; title: string; chapterNum: number; publishedAt: string }[];
  _count: { likes: number; comments: number };
}

export default function NovelDetailPage() {
  const params = useParams();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [likeData, setLikeData] = useState({ liked: false, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;

    Promise.all([
      fetch(`/api/novels/${params.id}`).then(r => r.json()),
      fetch(`/api/novels/${params.id}/like`).then(r => r.json()),
    ]).then(([novelData, like]) => {
      setNovel(novelData);
      setLikeData(like);
      setLoading(false);
    });

    // Increment view count
    fetch(`/api/novels/${params.id}/view`, { method: "POST" });
  }, [params.id]);

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
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-3xl font-bold">
            <span className="text-lg text-[var(--color-muted-foreground)] font-normal mr-2">#{novel.serialNumber}</span>
            <NovelInlineText text={novel.title} />
          </h1>
          <span className={`shrink-0 text-sm px-3 py-1 rounded-full ${getStatusColor(novel.status)}`}>
            {getStatusLabel(novel.status)}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-[var(--color-muted-foreground)] mb-4">
          <Link href={`/users/${novel.author.id}`} className="hover:text-[var(--color-primary)]">
            作者: {novel.author.name}
          </Link>
          <span className="flex items-center gap-1">
            <Eye size={14} /> {novel.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen size={14} /> {novel.chapters.length}話
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} /> {formatDate(novel.createdAt)}
          </span>
        </div>

        {/* Genres */}
        {novel.genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
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

        {/* Like button */}
        <LikeButton
          novelId={novel.id}
          initialLiked={likeData.liked}
          initialCount={likeData.count}
        />
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
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {formatDate(chapter.publishedAt)}
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

      {/* Comments */}
      <section>
        <CommentSection novelId={novel.id} />
      </section>
    </div>
  );
}
