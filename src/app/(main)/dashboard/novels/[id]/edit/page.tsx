"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

export default function EditNovelPage() {
  const params = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [status, setStatus] = useState("ongoing");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;

    Promise.all([
      fetch(`/api/novels/${params.id}`).then(r => r.json()),
      fetch("/api/genres").then(r => r.json()),
    ]).then(([novel, genresData]) => {
      setTitle(novel.title);
      setSynopsis(novel.synopsis);
      setStatus(novel.status);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSelectedGenres(novel.genres.map((g: any) => g.genre.id || g.genreId));
      setGenres(genresData);
      setFetching(false);
    });
  }, [params.id]);

  const toggleGenre = (id: string) => {
    setSelectedGenres(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/novels/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, synopsis, status, genreIds: selectedGenres }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "更新に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="max-w-2xl mx-auto animate-pulse space-y-4">
      <div className="h-8 bg-[var(--color-muted)] rounded w-1/3" />
      <div className="h-10 bg-[var(--color-muted)] rounded" />
      <div className="h-32 bg-[var(--color-muted)] rounded" />
    </div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">小説を編集</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">タイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">あらすじ</label>
          <textarea
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            required
            rows={6}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ステータス</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]"
          >
            <option value="ongoing">連載中</option>
            <option value="completed">完結</option>
            <option value="hiatus">休止中</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">ジャンル</label>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                onClick={() => toggleGenre(genre.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedGenres.includes(genre.id)
                    ? "bg-[var(--color-primary)] text-white"
                    : "border border-[var(--color-border)] hover:bg-[var(--color-muted)]"
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "更新中..." : "更新する"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)]"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
