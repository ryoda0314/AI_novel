"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { NovelCard } from "@/components/novels/novel-card";

export default function GenrePage() {
  const params = useParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [novels, setNovels] = useState<any[]>([]);
  const [genreName, setGenreName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.slug) return;

    // Get genre name
    fetch("/api/genres")
      .then(r => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((genres: any[]) => {
        const genre = genres.find((g) => g.slug === params.slug);
        if (genre) setGenreName(genre.name);
      });

    // Get novels
    fetch(`/api/novels?genre=${params.slug}`)
      .then(r => r.json())
      .then(data => setNovels(data.novels))
      .finally(() => setLoading(false));
  }, [params.slug]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {genreName || "ジャンル"}の作品
      </h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-[var(--color-muted)] animate-pulse" />
          ))}
        </div>
      ) : novels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {novels.map(novel => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      ) : (
        <p className="text-center py-16 text-[var(--color-muted-foreground)]">
          この﻿ジャンルの作品はまだありません
        </p>
      )}
    </div>
  );
}
