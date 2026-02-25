"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Star, Pencil, Trash2, ChevronDown } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
}

interface ReviewData {
  reviews: Review[];
  total: number;
  averageRating: number;
  ratingCount: number;
  userReview: Review | null;
  hasMore: boolean;
}

function StarRating({
  value,
  onChange,
  size = 20,
  interactive = false,
}: {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
  interactive?: boolean;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`${interactive ? "cursor-pointer" : "cursor-default"} transition-colors`}
        >
          <Star
            size={size}
            className={
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "text-[var(--color-border)]"
            }
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewSection({ novelId }: { novelId: string }) {
  const { data: session } = useSession();
  const [data, setData] = useState<ReviewData | null>(null);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const fetchReviews = useCallback(
    (pageNum: number, append = false) => {
      fetch(`/api/novels/${novelId}/reviews?page=${pageNum}`)
        .then((r) => r.json())
        .then((newData: ReviewData) => {
          if (append && data) {
            setData({
              ...newData,
              reviews: [...data.reviews, ...newData.reviews],
            });
          } else {
            setData(newData);
          }
        });
    },
    [novelId, data]
  );

  useEffect(() => {
    fetchReviews(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novelId]);

  const startEdit = (review: Review) => {
    setFormRating(review.rating);
    setFormTitle(review.title);
    setFormContent(review.content);
    setEditing(true);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (formRating === 0) {
      setError("評価を選択してください");
      return;
    }
    if (!formTitle.trim() || !formContent.trim()) {
      setError("タイトルと本文を入力してください");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/novels/${novelId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: formRating,
          title: formTitle.trim(),
          content: formContent.trim(),
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormRating(0);
        setFormTitle("");
        setFormContent("");
        setEditing(false);
        fetchReviews(1);
      } else {
        const errData = await res.json();
        setError(errData.error || "投稿に失敗しました");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("レビューを削除しますか？")) return;

    const res = await fetch(`/api/novels/${novelId}/reviews`, {
      method: "DELETE",
    });

    if (res.ok) {
      fetchReviews(1);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, true);
  };

  if (!data) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-[var(--color-muted)] rounded w-1/3" />
        <div className="h-20 bg-[var(--color-muted)] rounded" />
      </div>
    );
  }

  return (
    <div>
      {/* ヘッダー: 平均評価 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">レビュー</h2>
          {data.ratingCount > 0 && (
            <div className="flex items-center gap-2">
              <StarRating value={Math.round(data.averageRating)} size={16} />
              <span className="text-sm font-semibold">
                {data.averageRating.toFixed(1)}
              </span>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                ({data.ratingCount}件)
              </span>
            </div>
          )}
        </div>

        {session?.user && !data.userReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Pencil size={14} />
            レビューを書く
          </button>
        )}
      </div>

      {/* 投稿フォーム */}
      {showForm && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <h3 className="text-sm font-semibold mb-3">
            {editing ? "レビューを編集" : "レビューを投稿"}
          </h3>

          {error && (
            <div className="mb-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1">
                評価
              </label>
              <StarRating
                value={formRating}
                onChange={setFormRating}
                size={28}
                interactive
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1">
                タイトル
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="レビューのタイトル"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1">
                本文
              </label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={4}
                placeholder="この作品の感想を書いてください"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "投稿中..." : editing ? "更新する" : "投稿する"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditing(false);
                  setError("");
                }}
                className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-muted)]"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 自分のレビュー */}
      {data.userReview && !showForm && (
        <div className="mb-4 p-4 rounded-xl border-2 border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StarRating value={data.userReview.rating} size={14} />
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  あなたのレビュー
                </span>
              </div>
              <h4 className="font-medium text-sm">{data.userReview.title}</h4>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => startEdit(data.userReview!)}
                className="p-1.5 rounded hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                title="編集"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--color-muted-foreground)] hover:text-red-500"
                title="削除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap">{data.userReview.content}</p>
        </div>
      )}

      {/* レビュー一覧 */}
      {data.reviews.length > 0 ? (
        <div className="space-y-4">
          {data.reviews
            .filter((r) => r.user.id !== session?.user?.id)
            .map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StarRating value={review.rating} size={14} />
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        {review.user.name}
                      </span>
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        {formatRelativeTime(review.createdAt)}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm">{review.title}</h4>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap text-[var(--color-foreground)]/90">
                  {review.content}
                </p>
              </div>
            ))}

          {data.hasMore && (
            <button
              onClick={loadMore}
              className="flex items-center gap-1 mx-auto px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors text-sm"
            >
              <ChevronDown size={14} />
              もっと見る
            </button>
          )}
        </div>
      ) : (
        !data.userReview && (
          <p className="text-center py-8 text-[var(--color-muted-foreground)]">
            まだレビューがありません
          </p>
        )
      )}
    </div>
  );
}
