"use client";

import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--color-muted)] mb-6">
          <WifiOff size={40} className="text-[var(--color-muted-foreground)]" />
        </div>

        <h1 className="text-2xl font-bold mb-3">オフラインです</h1>

        <p className="text-[var(--color-muted-foreground)] mb-6">
          インターネットに接続できません。接続を確認して、もう一度お試しください。
        </p>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90"
        >
          <RefreshCw size={16} />
          再読み込み
        </button>

        <p className="mt-8 text-sm text-[var(--color-muted-foreground)]">
          キャッシュされたページは引き続き閲覧できる場合があります。
        </p>
      </div>
    </div>
  );
}
