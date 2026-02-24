import type { NovelMetadata, PreprocessorResult } from "./types";
import type {
  NovelBlock,
  SystemType,
  SystemIcon,
  MessageType,
} from "./block-types";
import {
  parseCharacters,
  parseGlossary,
  parseTimeline,
  parseRelationships,
} from "./metadata-parser";

const METADATA_TYPES = new Set([
  "characters",
  "glossary",
  "timeline",
  "relationships",
]);

const INLINE_BLOCK_TYPES = new Set(["system", "message", "code"]);

const VALID_SYSTEM_TYPES = new Set<SystemType>([
  "default",
  "info",
  "warning",
  "error",
  "success",
]);

const VALID_SYSTEM_ICONS = new Set<SystemIcon>([
  "terminal",
  "shield",
  "sword",
  "scroll",
  "spark",
  "skull",
  "none",
]);

const VALID_MESSAGE_TYPES = new Set<MessageType>([
  "chat",
  "email",
  "telepathy",
  "letter",
]);

/**
 * 属性文字列をパースする
 * key="value", key=value, key（boolean）に対応
 */
function parseBlockAttributes(
  attrString: string
): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /(\w+)(?:=(?:"([^"]*)"|(\S+)))?/g;
  let match;
  while ((match = regex.exec(attrString)) !== null) {
    const key = match[1];
    const value = match[2] ?? match[3] ?? "true";
    attrs[key] = value;
  }
  return attrs;
}

/**
 * ハイライト行指定をパースする ("1,3-5" → [1,3,4,5])
 */
function parseHighlightRanges(spec: string): number[] {
  const result: number[] = [];
  for (const part of spec.split(",")) {
    const trimmed = part.trim();
    const rangeMatch = trimmed.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let i = start; i <= end; i++) {
        result.push(i);
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num)) {
        result.push(num);
      }
    }
  }
  return result;
}

/**
 * ブロック種別と属性からNovelBlockを構築する
 */
function createBlock(
  type: string,
  attrs: Record<string, string>,
  content: string
): NovelBlock {
  switch (type) {
    case "system": {
      const sysType = VALID_SYSTEM_TYPES.has(attrs.type as SystemType)
        ? (attrs.type as SystemType)
        : "default";
      const sysIcon = VALID_SYSTEM_ICONS.has(attrs.icon as SystemIcon)
        ? (attrs.icon as SystemIcon)
        : "terminal";
      return {
        kind: "system",
        name: attrs.name,
        type: sysType,
        icon: sysIcon,
        content,
      };
    }
    case "message": {
      const msgType = VALID_MESSAGE_TYPES.has(attrs.type as MessageType)
        ? (attrs.type as MessageType)
        : "chat";
      return {
        kind: "message",
        type: msgType,
        app: attrs.app,
        content,
      };
    }
    case "code": {
      return {
        kind: "code",
        lang: attrs.lang || "plain",
        title: attrs.title,
        highlight: attrs.highlight
          ? parseHighlightRanges(attrs.highlight)
          : [],
        numbers: attrs.numbers !== "false",
        content,
      };
    }
    default:
      // 到達しないはず
      return { kind: "system", type: "default", icon: "terminal", content };
  }
}

/**
 * Markdown テキストをブロックレベルで前処理する
 * - :::type ... ::: ブロックを抽出（メタデータ、作者注、またはインラインブロック）
 * - === を場面転換のカスタムHTMLに変換
 */
export function preprocess(content: string): PreprocessorResult {
  const metadata: NovelMetadata = {
    characters: [],
    glossary: [],
    timeline: [],
    relationships: [],
  };
  const notes: string[] = [];
  const blocks: NovelBlock[] = [];

  const lines = content.split("\n");
  const output: string[] = [];

  let inBlock = false;
  let blockType = "";
  let blockAttrs: Record<string, string> = {};
  let blockContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // ブロック終了 :::
    if (inBlock && trimmed === ":::") {
      const rawContent = blockContent.join("\n");

      if (METADATA_TYPES.has(blockType)) {
        // メタデータブロック: パースしてメタデータに格納（出力からは除外）
        switch (blockType) {
          case "characters":
            metadata.characters = parseCharacters(rawContent);
            break;
          case "glossary":
            metadata.glossary = parseGlossary(rawContent);
            break;
          case "timeline":
            metadata.timeline = parseTimeline(rawContent);
            break;
          case "relationships":
            metadata.relationships = parseRelationships(rawContent);
            break;
        }
      } else if (blockType === "note") {
        // 作者注: プレースホルダーを出力し、内容はnotes配列に保存
        const noteIndex = notes.length;
        notes.push(rawContent);
        output.push(`{author-note-${noteIndex}}`);
        output.push("");
      } else if (INLINE_BLOCK_TYPES.has(blockType)) {
        // インラインブロック: プレースホルダーを出力し、ブロックデータをblocks配列に保存
        const blockIndex = blocks.length;
        blocks.push(createBlock(blockType, blockAttrs, rawContent));
        output.push(`{novel-block-${blockIndex}}`);
        output.push("");
      }

      inBlock = false;
      blockType = "";
      blockAttrs = {};
      blockContent = [];
      continue;
    }

    // ブロック内のコンテンツ収集
    if (inBlock) {
      blockContent.push(line);
      continue;
    }

    // ブロック開始 :::type [属性]
    const blockMatch = trimmed.match(/^:::(\w+)(?:\s+(.+))?\s*$/);
    if (blockMatch) {
      inBlock = true;
      blockType = blockMatch[1];
      blockAttrs = blockMatch[2]
        ? parseBlockAttributes(blockMatch[2])
        : {};
      blockContent = [];
      continue;
    }

    // 場面転換 ===（行単独で3つ以上の=）
    if (/^={3,}\s*$/.test(trimmed)) {
      output.push("---");
      output.push("");
      continue;
    }

    // 通常行
    output.push(line);
  }

  // 閉じられなかったブロックがあれば通常テキストとして出力
  if (inBlock) {
    output.push(`:::${blockType}`);
    output.push(...blockContent);
  }

  return {
    processedMarkdown: output.join("\n"),
    metadata,
    notes,
    blocks,
  };
}
