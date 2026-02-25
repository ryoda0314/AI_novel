"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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

export default function NewNovelPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [seriesId, setSeriesId] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [coverUrl, setCoverUrl] = useState("");
  const [seriesList, setSeriesList] = useState<SeriesOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/genres").then(r => r.json()).then(setGenres);
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/series?authorId=${session.user.id}`)
      .then(r => r.json())
      .then((data: SeriesOption[]) => setSeriesList(data));
  }, [session?.user?.id]);

  const toggleGenre = (id: string) => {
    setSelectedGenres(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !synopsis.trim()) {
      setError("タイトルとあらすじは必須です");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/novels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          synopsis: synopsis.trim(),
          coverUrl: coverUrl || undefined,
          genreIds: selectedGenres,
          tags,
          seriesId: seriesId || undefined,
        }),
      });

      if (res.ok) {
        const novel = await res.json();
        router.push(`/dashboard/novels/${novel.id}/chapters/new`);
      } else {
        const data = await res.json();
        setError(data.error || "作成に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">新しい小説を作成</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">表紙画像（任意）</label>
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
            placeholder="作品のタイトル"
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
            placeholder="作品のあらすじを入力..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">ジャンル（複数選択可）</label>
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
            {loading ? "作成中..." : "作成して第1話を書く"}
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
