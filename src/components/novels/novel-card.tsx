import Link from "next/link";
import { Heart, Eye, BookOpen } from "lucide-react";
import { truncate, formatDate, getStatusLabel, getStatusColor } from "@/lib/utils";
import { NovelInlineText } from "@/components/novel/novel-inline-text";

interface NovelCardProps {
  id: string;
  serialNumber: number;
  title: string;
  synopsis: string;
  coverUrl?: string | null;
  status: string;
  viewCount: number;
  createdAt: string;
  author: { id: string; name: string };
  genres: { genre: { name: string; slug: string } }[];
  tags?: { tag: { id: string; name: string } }[];
  _count: { likes: number; chapters: number };
}

export function NovelCard({ novel }: { novel: NovelCardProps }) {
  return (
    <Link href={`/novels/${novel.id}`} className="block group">
      <div className="h-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:shadow-md transition-shadow overflow-hidden">
        <div className={`flex ${novel.coverUrl ? "flex-row" : "flex-col"}`}>
          {novel.coverUrl && (
            <div className="w-28 shrink-0 overflow-hidden">
              <img src={novel.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
          )}
          <div className="p-4 flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-lg group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
                <span className="text-sm text-[var(--color-muted-foreground)] font-normal mr-1.5">#{novel.serialNumber}</span>
                <NovelInlineText text={novel.title} />
              </h3>
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${getStatusColor(novel.status)}`}>
                {getStatusLabel(novel.status)}
              </span>
            </div>

            <p className="text-sm text-[var(--color-muted-foreground)] mb-3 line-clamp-2">
              {truncate(novel.synopsis, 100)}
            </p>

            {(novel.genres.length > 0 || (novel.tags && novel.tags.length > 0)) && (
              <div className="flex flex-wrap gap-1 mb-3">
                {novel.genres.slice(0, 3).map(({ genre }) => (
                  <span
                    key={genre.slug}
                    className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                  >
                    {genre.name}
                  </span>
                ))}
                {novel.tags?.slice(0, 3).map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="text-xs px-2 py-0.5 rounded-full border border-[var(--color-primary)]/30 text-[var(--color-primary)]"
                  >
                    #{tag.name}
                  </span>
                ))}
                {(novel.tags?.length ?? 0) > 3 && (
                  <span className="text-xs px-2 py-0.5 text-[var(--color-muted-foreground)]">
                    +{(novel.tags?.length ?? 0) - 3}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
              <span>{novel.author.name}</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Heart size={12} /> {novel._count.likes}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={12} /> {novel.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={12} /> {novel._count.chapters}話
                </span>
              </div>
            </div>

            <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
              {formatDate(novel.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
