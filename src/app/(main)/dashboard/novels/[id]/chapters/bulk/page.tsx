"use client";

import { useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  AlertTriangle,
  BookOpen,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import {
  parseMarkdownChapters,
  type ParsedChapter,
  type ParseResult,
} from "@/lib/markdown-bulk-parser";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type Step = "upload" | "preview" | "submitting" | "done";

export default function BulkChapterPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);

  const processFile = useCallback((file: File) => {
    setError("");

    if (file.size > MAX_FILE_SIZE) {
      setError("ファイルサイズが10MBを超えています");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseMarkdownChapters(text);
      setParseResult(result);
      setFileName(file.name);
      if (result.chapters.length > 0) {
        setStep("preview");
      }
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const updateChapterTitle = (index: number, newTitle: string) => {
    if (!parseResult) return;
    const updated = [...parseResult.chapters];
    updated[index] = { ...updated[index], title: newTitle };
    setParseResult({ ...parseResult, chapters: updated });
  };

  const removeChapter = (index: number) => {
    if (!parseResult) return;
    const updated = parseResult.chapters.filter((_, i) => i !== index);
    setParseResult({ ...parseResult, chapters: updated });
    if (updated.length === 0) {
      setStep("upload");
      setParseResult(null);
    }
  };

  const handleBulkSubmit = async () => {
    if (!parseResult || parseResult.chapters.length === 0) return;

    setStep("submitting");
    setError("");

    try {
      const res = await fetch(`/api/novels/${params.id}/chapters/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapters: parseResult.chapters.map((ch) => ({
            title: ch.title,
            content: ch.content,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedCount(data.created);
        setStep("done");
      } else {
        const data = await res.json();
        setError(data.error || "投稿に失敗しました");
        setStep("preview");
      }
    } catch {
      setError("ネットワークエラーが発生しました");
      setStep("preview");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-4"
      >
        <ArrowLeft size={14} />
        戻る
      </button>

      <h1 className="text-2xl font-bold mb-6">一括投稿</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: ファイルアップロード */}
      {step === "upload" && (
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
            }`}
          >
            <Upload
              size={48}
              className="mx-auto mb-4 text-[var(--color-muted-foreground)]"
            />
            <p className="font-medium mb-1">
              Markdownファイルをドラッグ&ドロップ
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              またはクリックしてファイルを選択（.md / .txt）
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,.markdown"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* フォーマット説明 */}
          <div className="mt-6 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]">
            <h3 className="text-sm font-medium mb-2">Markdownフォーマット</h3>
            <pre className="text-xs text-[var(--color-muted-foreground)] font-mono whitespace-pre-wrap">
              {`# 第1話 旅立ちの日

ここに第1話の本文を書く...
独自記法（ルビ・傍点等）もそのまま使えます。

# 第2話 出会い

ここに第2話の本文を書く...

# 森の中で

「第○話」の番号部分は省略可能。
タイトルのみでもOKです。`}
            </pre>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
              「# 」（H1見出し）で各話を区切ります。
            </p>
          </div>
        </div>
      )}

      {/* Step 2: パース結果プレビュー */}
      {step === "preview" && parseResult && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">
                {parseResult.chapters.length}話が見つかりました
              </h2>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                <FileText size={12} className="inline mr-1" />
                {fileName}
              </p>
            </div>
            <button
              onClick={() => {
                setStep("upload");
                setParseResult(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              別のファイルを選択
            </button>
          </div>

          {/* 警告表示 */}
          {parseResult.warnings.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm">
              <AlertTriangle size={14} className="inline mr-1" />
              {parseResult.warnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          )}

          {/* 章一覧 */}
          <div className="space-y-2 mb-6">
            {parseResult.chapters.map((chapter, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"
              >
                <span className="text-sm text-[var(--color-muted-foreground)] w-8 text-center shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={chapter.title}
                    onChange={(e) => updateChapterTitle(index, e.target.value)}
                    className="w-full px-2 py-1 rounded border border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none bg-transparent font-medium text-sm"
                  />
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 px-2">
                    {chapter.charCount.toLocaleString()} 文字
                  </p>
                </div>
                <button
                  onClick={() => removeChapter(index)}
                  className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--color-muted-foreground)] hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* 合計情報 */}
          <div className="mb-6 text-sm text-[var(--color-muted-foreground)]">
            合計{" "}
            {parseResult.chapters
              .reduce((sum, ch) => sum + ch.charCount, 0)
              .toLocaleString()}{" "}
            文字
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3">
            <button
              onClick={handleBulkSubmit}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90"
            >
              <BookOpen size={16} />
              {parseResult.chapters.length}話を下書き保存
            </button>
            <button
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)]"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 投稿中 */}
      {step === "submitting" && (
        <div className="text-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent mb-4" />
          <p className="font-medium">
            {parseResult?.chapters.length}話を保存中...
          </p>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            すべて下書きとして保存されます
          </p>
        </div>
      )}

      {/* 完了 */}
      {step === "done" && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            {createdCount}話を下書き保存しました
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
            章管理ページから個別に編集・公開できます
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() =>
                router.push(
                  `/dashboard/novels/${params.id}/chapters`
                )
              }
              className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90"
            >
              章管理ページへ
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)]"
            >
              ダッシュボードへ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
