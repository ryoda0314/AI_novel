"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { preprocess, rehypeNovelMarkup } from "@/lib/novel-markup";
import { NovelMetadataPanel } from "./novel-metadata-panel";
import { SceneBreak } from "./scene-break";

interface NovelMarkdownProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
  showMetadata?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const novelComponents: Record<string, any> = {
  hr: SceneBreak,
};

export function NovelMarkdown({
  content,
  className,
  style,
  showMetadata = true,
}: NovelMarkdownProps) {
  const { processedMarkdown, metadata, notes, blocks } = useMemo(
    () => preprocess(content),
    [content]
  );

  const hasMetadata =
    metadata.characters.length > 0 ||
    metadata.glossary.length > 0 ||
    metadata.timeline.length > 0 ||
    metadata.relationships.length > 0;

  return (
    <>
      <div className={className} style={style}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
          rehypePlugins={[rehypeKatex, [rehypeNovelMarkup, { notes, blocks }]]}
          components={novelComponents}
        >
          {processedMarkdown}
        </ReactMarkdown>
      </div>
      {showMetadata && hasMetadata && (
        <NovelMetadataPanel metadata={metadata} />
      )}
    </>
  );
}
