"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, TrendingUp, Sparkles, ChevronRight, History } from "lucide-react";
import { useSession } from "next-auth/react";
import { NovelCard } from "@/components/novels/novel-card";
import { NovelInlineText } from "@/components/novel/novel-inline-text";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { formatRelativeTime } from "@/lib/utils";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface ReadingHistoryItem {
  id: string;
  readAt: string;
  novel: {
    id: string;
    title: string;
    author: { id: string; name: string };
    _count: { chapters: number };
  };
  chapter: {
    id: string;
    title: string;
    chapterNum: number;
  };
}

export default function HomePage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentNovels, setRecentNovels] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [popularNovels, setPopularNovels] = useState<any[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/novels?sort=recent&limit=6").then(r => r.json()),
      fetch("/api/ranking?type=likes&limit=6").then(r => r.json()),
      fetch("/api/genres").then(r => r.json()),
    ]).then(([recent, popular, genresData]) => {
      setRecentNovels(recent.novels || []);
      setPopularNovels(popular || []);
      setGenres(genresData || []);
      setLoading(false);
    });
  }, []);

  // ログインユーザーの読書履歴を取得
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/reading-history?limit=6")
      .then(r => r.json())
      .then((data) => setReadingHistory(data || []))
      .catch(() => {});
  }, [session]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900">
        <div className="container mx-auto px-4 py-20 text-center text-white">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen size={40} />
            <h1 className="text-4xl md:text-5xl font-bold">AI小説広場</h1>
          </div>
          <p className="text-xl md:text-2xl opacity-90 mb-8">
            AIが紡ぐ、無限の物語
          </p>
          <p className="text-sm opacity-75 mb-8 max-w-xl mx-auto">
            AIが作成した小説を投稿・閲覧できるプラットフォーム。
            ファンタジーからSF、恋愛まで、多彩なジャンルの作品をお楽しみください。
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/novels"
              className="px-6 py-3 rounded-lg bg-white text-purple-600 font-medium hover:bg-opacity-90 transition-all"
            >
              作品を読む
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 rounded-lg border-2 border-white text-white font-medium hover:bg-white/10 transition-all"
            >
              投稿する
            </Link>
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-12">
        {loading ? (
          <div className="space-y-12">
            {[...Array(2)].map((_, i) => (
              <div key={i}>
                <div className="h-8 bg-[var(--color-muted)] rounded w-1/4 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-48 bg-[var(--color-muted)] rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Continue Reading */}
            {readingHistory.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 text-xl font-bold">
                    <History size={24} className="text-green-500" />
                    続きを読む
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {readingHistory.map((item) => (
                    <Link
                      key={item.id}
                      href={`/novels/${item.novel.id}/chapters/${item.chapter.id}`}
                      className="block p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-bold mb-1 line-clamp-1">
                        <NovelInlineText text={item.novel.title} />
                      </h3>
                      <p className="text-sm text-[var(--color-primary)] mb-2">
                        第{item.chapter.chapterNum}話: <NovelInlineText text={item.chapter.title} />
                      </p>
                      <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
                        <span>{item.novel.author.name}</span>
                        <span>{formatRelativeTime(item.readAt)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Popular Novels */}
            {popularNovels.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 text-xl font-bold">
                    <TrendingUp size={24} className="text-orange-500" />
                    人気の作品
                  </h2>
                  <Link href="/ranking" className="flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline">
                    もっと見る <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {popularNovels.slice(0, 6).map(novel => (
                    <NovelCard key={novel.id} novel={novel} />
                  ))}
                </div>
              </section>
            )}

            {/* Recent Novels */}
            {recentNovels.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 text-xl font-bold">
                    <Sparkles size={24} className="text-blue-500" />
                    新着作品
                  </h2>
                  <Link href="/novels" className="flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline">
                    もっと見る <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentNovels.slice(0, 6).map(novel => (
                    <NovelCard key={novel.id} novel={novel} />
                  ))}
                </div>
              </section>
            )}

            {/* Genres */}
            {genres.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">ジャンルから探す</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {genres.map(genre => (
                    <Link
                      key={genre.slug}
                      href={`/novels?genre=${genre.slug}`}
                      className="p-4 text-center rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:shadow-md hover:border-[var(--color-primary)] transition-all"
                    >
                      <span className="text-sm font-medium">{genre.name}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {popularNovels.length === 0 && recentNovels.length === 0 && (
              <div className="text-center py-16">
                <BookOpen size={64} className="mx-auto mb-4 text-[var(--color-muted-foreground)] opacity-50" />
                <h2 className="text-xl font-bold mb-2">まだ作品がありません</h2>
                <p className="text-[var(--color-muted-foreground)] mb-6">
                  最初の作品を投稿してみましょう！
                </p>
                <Link
                  href="/register"
                  className="inline-flex px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90"
                >
                  新規登録して投稿する
                </Link>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
