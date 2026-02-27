"use client";

import { useState, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface CoverUploadProps {
  value: string;
  onChange: (url: string) => void;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export function CoverUpload({ value, onChange }: CoverUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setError("");

    if (file.size > MAX_SIZE) {
      setError("ファイルサイズは2MB以下にしてください");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let message = "アップロードに失敗しました";
        try {
          const data = await res.json();
          if (data.error) message = data.error;
        } catch {
          // JSONでないレスポンス（500エラーページなど）
        }
        setError(message);
        return;
      }

      const { url } = await res.json();
      onChange(url);
    } catch {
      setError("アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div>
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="表紙画像"
            className="w-40 h-56 object-cover rounded-lg border border-[var(--color-border)]"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-40 h-56 rounded-lg border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] flex flex-col items-center justify-center gap-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors"
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              <ImagePlus size={24} />
              <span className="text-xs">表紙を追加</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className="hidden"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
