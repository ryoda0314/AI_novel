"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Library, Eye, Heart, BookOpen } from "lucide-react";
import { NovelCard } from "@/components/novels/novel-card";

interface SeriesNovel {
  id: string;
  serialNumber: number;
  title: string;
  synopsis: string;
  status: string;
  viewCount: number;
  createdAt: string;
  seriesOrder: number | null;
  genres: { genre: { id: string; name: string; slug: string } }[];
  tags: { tag: { id: string; name: string } }[];
  author: { id: string; name: string };
  _count: { chapters: number; likes: number };
}

interface Series {
  id: string;
  title: string;
  description: string | null;
  author: { id: string; name: string };
  novels: SeriesNovel[];
}

export default function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/series/${id}`)
      .then(r => r.json())
      .then(setSeries)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-[var(--color-muted)] rounded w-1/2" />
        <div className="h-4 bg-[var(--color-muted)] rounded w-1/3" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-[var(--color-muted)] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--color-muted-foreground)]">シリーズが見つかりません</p>
      </div>
    );
  }

  const totalViews = series.novels.reduce((s, n) => s + n.viewCount, 0);
  const totalLikes = series.novels.reduce((s, n) => s + n._count.likes, 0);
  const totalChapters = series.novels.reduce((s, n) => s + n._count.chapters, 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Series Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] mb-2">
          <Library size={16} />
          シリーズ
        </div>
        <h1 className="text-2xl font-bold mb-2">{series.title}</h1>
        {series.description && (
          <p className="text-[var(--color-muted-foreground)] mb-3">{series.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-[var(--color-muted-foreground)]">
          <Link
            href={`/users/${series.author.id}`}
            className="hover:text-[var(--color-primary)]"
          >
            {series.author.name}
          </Link>
          <span className="flex items-center gap-1"><BookOpen size={14} /> {series.novels.length}作品 / {totalChapters}話</span>
          <span className="flex items-center gap-1"><Eye size={14} /> {totalViews}</span>
          <span className="flex items-center gap-1"><Heart size={14} /> {totalLikes}</span>
        </div>
      </div>

      {/* Novels List */}
      <div className="space-y-4">
        {series.novels.map((novel, idx) => (
          <div key={novel.id} className="flex gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-muted)] text-sm font-bold shrink-0 mt-4">
              {idx + 1}
            </div>
            <div className="flex-1">
              <NovelCard novel={{ ...novel, author: series.author }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
