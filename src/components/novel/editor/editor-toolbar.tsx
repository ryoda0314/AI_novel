"use client";

import { toolbarActions } from "./toolbar-buttons";
import { Eye, EyeOff, Sparkles } from "lucide-react";

interface EditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  showAi: boolean;
  onToggleAi: () => void;
}

export function EditorToolbar({
  textareaRef,
  value,
  onChange,
  showPreview,
  onTogglePreview,
  showAi,
  onToggleAi,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap px-1 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-muted)]  rounded-t-lg">
      {toolbarActions.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={() => {
            if (textareaRef.current) {
              action.action(textareaRef.current, value, onChange);
            }
          }}
          className="px-2.5 py-1 text-xs font-medium rounded hover:bg-[var(--color-border)] transition-colors"
          title={action.label}
        >
          <span className="mr-1">{action.icon}</span>
          {action.label}
        </button>
      ))}

      <div className="flex-1" />

      <button
        type="button"
        onClick={onToggleAi}
        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
          showAi
            ? "bg-violet-500 text-white"
            : "text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
        }`}
        title="AI執筆支援"
      >
        <Sparkles size={12} />
        AI
      </button>

      <button
        type="button"
        onClick={onTogglePreview}
        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
          showPreview
            ? "bg-[var(--color-primary)] text-white"
            : "hover:bg-[var(--color-border)]"
        }`}
        title="プレビュー"
      >
        {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
        プレビュー
      </button>
    </div>
  );
}
