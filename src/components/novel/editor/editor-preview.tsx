"use client";

import { useState, useEffect } from "react";
import { NovelMarkdown } from "../novel-markdown";

interface EditorPreviewProps {
  content: string;
}

export function EditorPreview({ content }: EditorPreviewProps) {
  const [debouncedContent, setDebouncedContent] = useState(content);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContent(content);
    }, 300);
    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div className="border border-[var(--color-border)] rounded-lg p-4 overflow-y-auto bg-[var(--color-card)]">
      <div className="text-xs text-[var(--color-muted-foreground)] mb-3 font-medium">
        プレビュー
      </div>
      {debouncedContent ? (
        <NovelMarkdown
          content={debouncedContent}
          className="reading-content markdown-body"
        />
      ) : (
        <p className="text-[var(--color-muted-foreground)] text-sm">
          本文を入力するとプレビューが表示されます
        </p>
      )}
    </div>
  );
}
