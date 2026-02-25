"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  Wand2,
  FileText,
  MessageSquare,
  Palette,
  X,
  Check,
  RotateCcw,
  Loader2,
} from "lucide-react";

interface AiAction {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  needsSelection: boolean;
}

const AI_ACTIONS: AiAction[] = [
  {
    key: "continue",
    label: "続きを書く",
    description: "文章の続きを自動生成",
    icon: <ArrowRight size={14} />,
    needsSelection: false,
  },
  {
    key: "improve",
    label: "表現を磨く",
    description: "選択した文章を推敲・改善",
    icon: <Wand2 size={14} />,
    needsSelection: true,
  },
  {
    key: "summarize",
    label: "要約する",
    description: "文章の要約を生成",
    icon: <FileText size={14} />,
    needsSelection: false,
  },
  {
    key: "dialogue",
    label: "台詞を提案",
    description: "キャラクターの台詞を生成",
    icon: <MessageSquare size={14} />,
    needsSelection: false,
  },
  {
    key: "describe",
    label: "情景描写",
    description: "場面の情景描写を生成",
    icon: <Palette size={14} />,
    needsSelection: false,
  },
];

interface AiAssistPanelProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

export function AiAssistPanel({
  textareaRef,
  value,
  onChange,
  onClose,
}: AiAssistPanelProps) {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // 選択テキストの取得
  const getSelection = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return { selected: "", before: "", after: "", start: 0, end: 0 };
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    return {
      selected: value.slice(start, end),
      before: value.slice(0, start),
      after: value.slice(end),
      start,
      end,
    };
  }, [textareaRef, value]);

  // 結果を自動スクロール
  useEffect(() => {
    if (resultRef.current && loading) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, [result, loading]);

  const runAction = useCallback(
    async (actionKey: string) => {
      const action = AI_ACTIONS.find((a) => a.key === actionKey);
      if (!action) return;

      const { selected, before } = getSelection();

      // 選択必須のアクションでテキスト未選択
      if (action.needsSelection && !selected) {
        setError("テキストを選択してからこのアクションを使ってください");
        return;
      }

      // テキストの準備
      let text: string;
      let context: string | undefined;

      if (action.needsSelection) {
        text = selected;
        // 選択範囲の前の部分をコンテキストとして渡す（最大1000文字）
        if (before.length > 0) {
          context = before.slice(-1000);
        }
      } else {
        // 続きを書く・要約等はカーソル前のテキストを使う
        const cursorPos = textareaRef.current?.selectionStart ?? value.length;
        text = value.slice(0, cursorPos) || value;
        // 最後の2000文字だけ送る
        if (text.length > 2000) {
          context = text.slice(0, -2000);
          context = context.slice(-1000);
          text = text.slice(-2000);
        }
      }

      if (!text.trim()) {
        setError("テキストを入力してからAIアシストを使ってください");
        return;
      }

      setActiveAction(actionKey);
      setResult("");
      setError("");
      setLoading(true);

      // 前のリクエストをキャンセル
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/ai/assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: actionKey, text, context }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "AI処理に失敗しました");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("ストリームが取得できません");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value: chunk } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(chunk, { stream: true });
          setResult(accumulated);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message);
        }
      } finally {
        setLoading(false);
      }
    },
    [getSelection, textareaRef, value]
  );

  const insertResult = useCallback(() => {
    if (!result || !textareaRef.current) return;

    const ta = textareaRef.current;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;

    if (activeAction === "improve") {
      // 改善の場合、選択テキストを置き換え
      const newValue = value.slice(0, start) + result + value.slice(end);
      onChange(newValue);
    } else {
      // その他は現在のカーソル位置に挿入
      const insertPos = end;
      const prefix = value[insertPos - 1] === "\n" ? "" : "\n\n";
      const newValue =
        value.slice(0, insertPos) + prefix + result + value.slice(insertPos);
      onChange(newValue);
    }

    setResult("");
    setActiveAction(null);
    onClose();
  }, [result, activeAction, textareaRef, value, onChange, onClose]);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setResult("");
    setActiveAction(null);
    setLoading(false);
  }, []);

  return (
    <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] shadow-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-violet-500/10 to-blue-500/10 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-violet-500" />
          <span className="text-sm font-medium">AI執筆支援</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
        >
          <X size={14} />
        </button>
      </div>

      {/* アクション一覧 or 結果表示 */}
      {!activeAction && !result ? (
        <div className="p-2 grid grid-cols-1 gap-1">
          {AI_ACTIONS.map((action) => (
            <button
              key={action.key}
              onClick={() => runAction(action.key)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-[var(--color-muted)] transition-colors group"
            >
              <span className="text-violet-500 group-hover:text-violet-400">
                {action.icon}
              </span>
              <div>
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {action.description}
                  {action.needsSelection && " (要テキスト選択)"}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-3 space-y-3">
          {/* アクション名 */}
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
            {loading && <Loader2 size={12} className="animate-spin" />}
            <span>
              {AI_ACTIONS.find((a) => a.key === activeAction)?.label}
              {loading ? " 生成中..." : " 完了"}
            </span>
          </div>

          {/* エラー */}
          {error && (
            <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* 結果 */}
          {result && (
            <div
              ref={resultRef}
              className="max-h-64 overflow-y-auto p-3 rounded-lg bg-[var(--color-muted)] text-sm leading-relaxed whitespace-pre-wrap font-serif"
            >
              {result}
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex items-center gap-2">
            {result && !loading && (
              <button
                onClick={insertResult}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors"
              >
                <Check size={12} />
                挿入する
              </button>
            )}
            {!loading && (
              <button
                onClick={() => {
                  if (activeAction) runAction(activeAction);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-muted)] transition-colors"
              >
                <RotateCcw size={12} />
                再生成
              </button>
            )}
            <button
              onClick={cancel}
              className="px-3 py-1.5 rounded-lg text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
            >
              {loading ? "中止" : "戻る"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
