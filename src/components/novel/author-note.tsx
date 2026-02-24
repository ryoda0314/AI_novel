"use client";

import type { ReactNode } from "react";

export function AuthorNote({ children }: { children?: ReactNode }) {
  // preprocessorがHTMLエスケープ済みテキストを挿入するので、
  // childrenは文字列として受け取る
  const text = typeof children === "string" ? children : "";
  const unescaped = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

  return (
    <aside className="novel-author-note" role="note">
      <div className="novel-author-note-label">作者注</div>
      <div className="novel-author-note-content">
        {unescaped.split("\n").map((line, i) => (
          <p key={i}>{line || "\u00A0"}</p>
        ))}
      </div>
    </aside>
  );
}
