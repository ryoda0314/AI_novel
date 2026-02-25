"use client";

import { useState } from "react";
import { Flag } from "lucide-react";

interface ReportButtonProps {
  targetType: "novel" | "comment" | "review" | "user";
  targetId: string;
}

const REASONS = [
  "不適切なコンテンツ",
  "スパム・宣伝",
  "著作権侵害",
  "誹謗中傷",
  "その他",
];

export function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);

    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason, detail }),
    });

    if (res.ok) {
      setDone(true);
      setTimeout(() => {
        setShowModal(false);
        setDone(false);
        setReason("");
        setDetail("");
      }, 1500);
    }
    setSubmitting(false);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] hover:text-red-500 transition-colors"
        title="通報する"
      >
        <Flag size={12} />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-[var(--color-card)] rounded-xl p-6 w-full max-w-md border border-[var(--color-border)] shadow-xl">
            {done ? (
              <div className="text-center py-4">
                <p className="text-green-500 font-medium">通報を受け付けました</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-4">通報する</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">理由</label>
                    <div className="space-y-2">
                      {REASONS.map(r => (
                        <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name="reason"
                            value={r}
                            checked={reason === r}
                            onChange={() => setReason(r)}
                            className="accent-[var(--color-primary)]"
                          />
                          {r}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">詳細（任意）</label>
                    <textarea
                      value={detail}
                      onChange={e => setDetail(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm resize-none"
                      placeholder="具体的な内容を記入..."
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={!reason || submitting}
                    className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                  >
                    {submitting ? "送信中..." : "通報する"}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-muted)]"
                  >
                    キャンセル
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
