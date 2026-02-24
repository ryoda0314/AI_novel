"use client";

import { useMemo, Fragment } from "react";

/**
 * Lightweight inline markup renderer for titles etc.
 * Supports: {漢字|よみ} → ruby, ..text.. → emphasis dots
 */
export function NovelInlineText({ text }: { text: string }) {
  const elements = useMemo(() => parseInline(text), [text]);
  return <>{elements}</>;
}

type InlineNode =
  | { type: "text"; value: string }
  | { type: "ruby"; base: string; reading: string }
  | { type: "dots"; value: string };

function parseInline(text: string): React.ReactNode[] {
  // Match ruby {base|reading} or emphasis dots ..text..
  const pattern = /\{([^|{}]+)\|([^|}]+)\}|\.\.((?:(?!\.\.).)+?)\.\./g;
  const nodes: InlineNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      nodes.push({ type: "ruby", base: match[1], reading: match[2] });
    } else {
      nodes.push({ type: "dots", value: match[3] });
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", value: text.slice(lastIndex) });
  }

  return nodes.map((node, i) => {
    switch (node.type) {
      case "ruby":
        return (
          <ruby key={i}>
            {node.base}
            <rt>{node.reading}</rt>
          </ruby>
        );
      case "dots":
        return (
          <span key={i} className="novel-emphasis-dots">
            {node.value}
          </span>
        );
      default:
        return <Fragment key={i}>{node.value}</Fragment>;
    }
  });
}
