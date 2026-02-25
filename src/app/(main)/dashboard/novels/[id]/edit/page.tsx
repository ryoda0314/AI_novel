"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TagInput } from "@/components/ui/tag-input";
import { CoverUpload } from "@/components/ui/cover-upload";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface SeriesOption {
  id: string;
  title: string;
}

export default function EditNovelPage() {
  const params = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [status, setStatus] = useState("ongoing");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [coverUrl, setCoverUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [seriesId, setSeriesId] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [seriesList, setSeriesList] = useState<SeriesOption[]>([]);
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
      setCoverUrl(novel.coverUrl || "");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSelectedGenres(novel.genres.map((g: any) => g.genre.id || g.genreId));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setTags(novel.tags?.map((t: any) => t.tag.name) || []);
      setSeriesId(novel.seriesId || "");
      setGenres(genresData);

      // 作者のシリーズ一覧を取得
      if (novel.authorId) {
        fetch(`/api/series?authorId=${novel.authorId}`)
          .then(r => r.json())
          .then((data: SeriesOption[]) => setSeriesList(data));
      }
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
        body: JSON.stringify({ title, synopsis, coverUrl, status, genreIds: selectedGenres, tags, seriesId: seriesId || null }),
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
          <label className="block text-sm font-medium mb-2">表紙画像</label>
          <CoverUpload value={coverUrl} onChange={setCoverUrl} />
        </div>

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

        <div>
          <label className="block text-sm font-medium mb-2">タグ（最大10個）</label>
          <TagInput value={tags} onChange={setTags} />
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            異世界転生、チート、ダークファンタジーなど自由に入力できます
          </p>
        </div>

        {seriesList.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">シリーズ（任意）</label>
            <select
              value={seriesId}
              onChange={(e) => setSeriesId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm"
            >
              <option value="">なし</option>
              {seriesList.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
        )}

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
