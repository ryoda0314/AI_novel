"use client";

import { useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Upload,
  FolderOpen,
  FileText,
  AlertTriangle,
  BookOpen,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import {
  parseMarkdownChapters,
  parseFolderChapters,
  type ParseResult,
  type FileEntry,
} from "@/lib/markdown-bulk-parser";

const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB

type UploadMode = "file" | "folder";
type Step = "upload" | "preview" | "submitting" | "done";

export default function BulkChapterPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [uploadMode, setUploadMode] = useState<UploadMode>("folder");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);

  // 単一ファイル処理（従来方式）
  const processSingleFile = useCallback((file: File) => {
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseMarkdownChapters(text);
      setParseResult(result);
      setSourceName(file.name);
      if (result.chapters.length > 0) {
        setStep("preview");
      }
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  // 複数ファイル処理（フォルダ方式）
  const processMultipleFiles = useCallback(async (fileList: FileList) => {
    setError("");

    const files = Array.from(fileList).filter(
      (f) =>
        f.name.endsWith(".md") ||
        f.name.endsWith(".txt") ||
        f.name.endsWith(".markdown")
    );

    if (files.length === 0) {
      setError(
        "対応するファイルが見つかりませんでした（.md / .txt のみ対応）"
      );
      return;
    }

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      setError("合計ファイルサイズが50MBを超えています");
      return;
    }

    // 全ファイルを読み込み
    const entries: FileEntry[] = await Promise.all(
      files.map(
        (f) =>
          new Promise<FileEntry>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                name: f.webkitRelativePath || f.name,
                content: e.target?.result as string,
              });
            };
            reader.readAsText(f, "UTF-8");
          })
      )
    );

    const result = parseFolderChapters(entries);
    setParseResult(result);

    // フォルダ名を取得
    const firstPath = files[0].webkitRelativePath;
    const folderName = firstPath
      ? firstPath.split("/")[0]
      : `${files.length}ファイル`;
    setSourceName(folderName);

    if (result.chapters.length > 0) {
      setStep("preview");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (uploadMode === "folder") {
      processMultipleFiles(files);
    } else {
      processSingleFile(files[0]);
    }
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
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    if (files.length === 1 && !files[0].webkitRelativePath) {
      // 単一ファイルドロップ
      processSingleFile(files[0]);
    } else {
      processMultipleFiles(files);
    }
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

  const resetUpload = () => {
    setStep("upload");
    setParseResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
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

      {/* Step 1: アップロード */}
      {step === "upload" && (
        <div>
          {/* モード切替タブ */}
          <div className="flex border-b border-[var(--color-border)] mb-6">
            <button
              onClick={() => setUploadMode("folder")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                uploadMode === "folder"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <FolderOpen size={14} className="inline mr-1.5" />
              フォルダで投稿
            </button>
            <button
              onClick={() => setUploadMode("file")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                uploadMode === "file"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <FileText size={14} className="inline mr-1.5" />
              単一ファイルで投稿
            </button>
          </div>

          {/* アップロードエリア */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() =>
              uploadMode === "folder"
                ? folderInputRef.current?.click()
                : fileInputRef.current?.click()
            }
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
            {uploadMode === "folder" ? (
              <>
                <p className="font-medium mb-1">フォルダを選択</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  目次ファイル（index.md）と各話のファイルを含むフォルダ
                </p>
              </>
            ) : (
              <>
                <p className="font-medium mb-1">
                  Markdownファイルをドラッグ&ドロップ
                </p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  またはクリックしてファイルを選択（.md / .txt）
                </p>
              </>
            )}

            {/* 単一ファイル用input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,.markdown"
              onChange={handleFileSelect}
              className="hidden"
            />
            {/* フォルダ用input */}
            <input
              ref={folderInputRef}
              type="file"
              /* @ts-expect-error webkitdirectory is non-standard */
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* フォーマット説明 */}
          <div className="mt-6 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]">
            {uploadMode === "folder" ? (
              <>
                <h3 className="text-sm font-medium mb-3">
                  フォルダ構成の例
                </h3>
                <pre className="text-xs text-[var(--color-muted-foreground)] font-mono whitespace-pre-wrap mb-3">
                  {`my-novel/
  index.md      ← 目次ファイル（必須）
  chapter01.md  ← 各話の本文
  chapter02.md
  chapter03.md`}
                </pre>
                <h3 className="text-sm font-medium mb-2">
                  目次ファイル（index.md）の書き方
                </h3>
                <pre className="text-xs text-[var(--color-muted-foreground)] font-mono whitespace-pre-wrap">
                  {`chapter01.md 旅立ちの日
chapter02.md 出会い
chapter03.md 森の中で`}
                </pre>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
                  各行に「ファイル名（スペース）タイトル」を記述します。
                  目次の順番がそのまま話数の順番になります。
                </p>
              </>
            ) : (
              <>
                <h3 className="text-sm font-medium mb-2">
                  Markdownフォーマット
                </h3>
                <pre className="text-xs text-[var(--color-muted-foreground)] font-mono whitespace-pre-wrap">
                  {`# 第1話 旅立ちの日

ここに第1話の本文を書く...
独自記法（ルビ・傍点等）もそのまま使えます。

# 第2話 出会い

ここに第2話の本文を書く...`}
                </pre>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
                  「# 」（H1見出し）で各話を区切ります。
                </p>
              </>
            )}
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
                <FolderOpen size={12} className="inline mr-1" />
                {sourceName}
              </p>
            </div>
            <button
              onClick={resetUpload}
              className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              やり直す
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
            <BookOpen
              size={32}
              className="text-green-600 dark:text-green-400"
            />
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
                router.push(`/dashboard/novels/${params.id}/chapters`)
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
