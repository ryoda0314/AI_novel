import { visit } from "unist-util-visit";
import type { Root, Element, Text, ElementContent } from "hast";
import type { NovelBlock } from "./block-types";
import { buildBlockNode } from "./block-renderers";

// ルビ: {漢字|かんじ}
const RUBY_REGEX = /\{([^|{}]+)\|([^|{}]+)\}/g;
// 傍点: ..テキスト..
const EMPHASIS_DOTS_REGEX = /\.\.([^.\n]+?)\.\./g;

/**
 * テキストノードからルビ・傍点を検出し、HAST要素に変換する
 */
function processInlineMarkup(text: string): ElementContent[] {
  // ルビと傍点を一括で検出するため、統合パターンで位置を特定
  const combined = new RegExp(
    `(${RUBY_REGEX.source})|(${EMPHASIS_DOTS_REGEX.source})`,
    "g"
  );

  const result: ElementContent[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(combined)) {
    const fullMatch = match[0];
    const startIdx = match.index!;

    // マッチ前のテキスト
    if (startIdx > lastIndex) {
      result.push({ type: "text", value: text.slice(lastIndex, startIdx) });
    }

    if (fullMatch.startsWith("{") && fullMatch.includes("|")) {
      // ルビ: {base|reading}
      const rubyMatch = fullMatch.match(/^\{([^|{}]+)\|([^|{}]+)\}$/);
      if (rubyMatch) {
        const [, base, reading] = rubyMatch;
        result.push({
          type: "element",
          tagName: "ruby",
          properties: {},
          children: [
            { type: "text", value: base },
            {
              type: "element",
              tagName: "rp",
              properties: {},
              children: [{ type: "text", value: "(" }],
            },
            {
              type: "element",
              tagName: "rt",
              properties: {},
              children: [{ type: "text", value: reading }],
            },
            {
              type: "element",
              tagName: "rp",
              properties: {},
              children: [{ type: "text", value: ")" }],
            },
          ],
        });
      }
    } else if (fullMatch.startsWith("..")) {
      // 傍点: ..text..
      const dotsMatch = fullMatch.match(/^\.\.([^.\n]+?)\.\.$/);
      if (dotsMatch) {
        result.push({
          type: "element",
          tagName: "span",
          properties: { className: ["novel-emphasis-dots"] },
          children: [{ type: "text", value: dotsMatch[1] }],
        });
      }
    }

    lastIndex = startIdx + fullMatch.length;
  }

  // 残りのテキスト
  if (lastIndex < text.length) {
    result.push({ type: "text", value: text.slice(lastIndex) });
  }

  return result;
}

/**
 * 要素のテキストコンテンツを再帰的に取得
 */
function getTextContent(node: ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") {
    return node.children.map(getTextContent).join("");
  }
  return "";
}

interface NovelMarkupOptions {
  notes?: string[];
  blocks?: NovelBlock[];
}

/**
 * rehype プラグイン: 小説独自記法のインライン変換
 * - {漢字|かんじ} → <ruby>
 * - ..テキスト.. → <span class="novel-emphasis-dots">
 * - 「」で始まる段落 → class="novel-dialogue"
 * - {author-note-N} プレースホルダー → 作者注ブロック
 * - {novel-block-N} プレースホルダー → system/message/code ブロック
 */
export default function rehypeNovelMarkup(options?: NovelMarkupOptions) {
  const notes = options?.notes || [];
  const blocks = options?.blocks || [];

  return (tree: Root) => {
    // Pass 1: テキストノードのインライン変換（ルビ・傍点）
    visit(tree, "text", (node: Text, index: number | undefined, parent: Element | Root | undefined) => {
      if (!parent || index === undefined) return;
      if (!("children" in parent)) return;

      // ルビまたは傍点パターンが含まれているか簡易チェック
      if (!RUBY_REGEX.test(node.value) && !EMPHASIS_DOTS_REGEX.test(node.value)) {
        return;
      }
      // regex lastIndex をリセット
      RUBY_REGEX.lastIndex = 0;
      EMPHASIS_DOTS_REGEX.lastIndex = 0;

      const newChildren = processInlineMarkup(node.value);
      if (newChildren.length === 1 && newChildren[0].type === "text") return;

      (parent.children as ElementContent[]).splice(index, 1, ...newChildren);
      return index + newChildren.length;
    });

    // Pass 2: 台詞検出（「で始まる段落にクラス付与）
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "p") return;

      const textContent = node.children.map(getTextContent).join("");
      if (textContent.trimStart().startsWith("「")) {
        const classes = ((node.properties?.className as string[]) || []).slice();
        classes.push("novel-dialogue");
        node.properties = node.properties || {};
        node.properties.className = classes;
      }
    });

    // Pass 3: 作者注プレースホルダー → aside要素に変換
    if (notes.length > 0) {
      visit(tree, "element", (node: Element, index: number | undefined, parent: Element | Root | undefined) => {
        if (node.tagName !== "p" || !parent || index === undefined) return;
        if (!("children" in parent)) return;
        if (node.children.length !== 1 || node.children[0].type !== "text") return;

        const match = node.children[0].value.match(/^\{author-note-(\d+)\}$/);
        if (!match) return;

        const noteIndex = parseInt(match[1], 10);
        if (noteIndex >= notes.length) return;

        const noteContent = notes[noteIndex];
        const lines = noteContent.split("\n");
        const paragraphs: ElementContent[] = lines.map((line) => ({
          type: "element" as const,
          tagName: "p",
          properties: {},
          children: [{ type: "text" as const, value: line || "\u00A0" }],
        }));

        const aside: Element = {
          type: "element",
          tagName: "aside",
          properties: { className: ["novel-author-note"], role: "note" },
          children: [
            {
              type: "element",
              tagName: "div",
              properties: { className: ["novel-author-note-label"] },
              children: [{ type: "text", value: "作者注" }],
            },
            {
              type: "element",
              tagName: "div",
              properties: { className: ["novel-author-note-content"] },
              children: paragraphs,
            },
          ],
        };

        (parent.children as ElementContent[]).splice(index, 1, aside);
        return index;
      });
    }

    // Pass 4: ブロックプレースホルダー → system/message/code 要素に変換
    if (blocks.length > 0) {
      visit(tree, "element", (node: Element, index: number | undefined, parent: Element | Root | undefined) => {
        if (node.tagName !== "p" || !parent || index === undefined) return;
        if (!("children" in parent)) return;
        if (node.children.length !== 1 || node.children[0].type !== "text") return;

        const match = node.children[0].value.match(/^\{novel-block-(\d+)\}$/);
        if (!match) return;

        const blockIndex = parseInt(match[1], 10);
        if (blockIndex >= blocks.length) return;

        const blockElement = buildBlockNode(blocks[blockIndex]);

        (parent.children as ElementContent[]).splice(index, 1, blockElement);
        return index;
      });
    }
  };
}
