"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { NovelCard } from "@/components/novels/novel-card";
import { Search } from "lucide-react";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

export default function NovelsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-[var(--color-muted)] rounded-xl" />}>
      <NovelsContent />
    </Suspense>
  );
}

function NovelsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [novels, setNovels] = useState<any[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") || "1");
  const sort = searchParams.get("sort") || "recent";
  const genre = searchParams.get("genre") || "";
  const q = searchParams.get("q") || "";

  useEffect(() => {
    fetch("/api/genres").then(r => r.json()).then(setGenres);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("sort", sort);
    if (genre) params.set("genre", genre);
    if (q) params.set("q", q);

    fetch(`/api/novels?${params}`)
      .then(r => r.json())
      .then(data => {
        setNovels(data.novels);
        setTotalPages(data.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page, sort, genre, q]);

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.set("page", "1");
    router.push(`/novels?${params}`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">小説一覧</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => updateParams("sort", e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-sm"
        >
          <option value="recent">新着順</option>
          <option value="likes">いいね順</option>
          <option value="views">閲覧数順</option>
        </select>

        {/* Genre chips */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => updateParams("genre", "")}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              !genre ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-muted)] hover:bg-[var(--color-border)]"
            }`}
          >
            すべて
          </button>
          {genres.map((g) => (
            <button
              key={g.slug}
              onClick={() => updateParams("genre", g.slug)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                genre === g.slug ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-muted)] hover:bg-[var(--color-border)]"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Novel Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] animate-pulse" />
          ))}
        </div>
      ) : novels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {novels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[var(--color-muted-foreground)]">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p>作品が見つかりませんでした</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <button
              onClick={() => updateParams("page", (page - 1).toString())}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-sm"
            >
              前へ
            </button>
          )}
          <span className="px-4 py-2 text-sm">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <button
              onClick={() => updateParams("page", (page + 1).toString())}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-sm"
            >
              次へ
            </button>
          )}
        </div>
      )}
    </div>
  );
}
