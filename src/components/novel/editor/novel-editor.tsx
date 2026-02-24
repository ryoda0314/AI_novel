"use client";

import { useState, useRef } from "react";
import { EditorToolbar } from "./editor-toolbar";
import { EditorPreview } from "./editor-preview";

interface NovelEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function NovelEditor({
  value,
  onChange,
  placeholder = "本文を入力...\n\n独自記法が使えます:\n{漢字|よみ} → ルビ\n..テキスト.. → 傍点\n=== → 場面転換\n:::note ～ ::: → 作者注",
  rows = 20,
}: NovelEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-0">
      <EditorToolbar
        textareaRef={textareaRef}
        value={value}
        onChange={onChange}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
      />

      <div className={showPreview ? "grid grid-cols-2 gap-3" : ""}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none font-mono text-sm leading-relaxed ${
            showPreview ? "rounded-lg" : "rounded-b-lg border-t-0"
          }`}
        />

        {showPreview && <EditorPreview content={value} />}
      </div>

      <div className="text-right text-xs text-[var(--color-muted-foreground)] mt-1">
        {value.length.toLocaleString()} 文字
      </div>
    </div>
  );
}
