import type { Element, ElementContent, Properties } from "hast";
import type { SystemBlock, MessageBlock, CodeBlock, NovelBlock } from "./block-types";
import {
  parseSystemContent,
  parseChatContent,
  parseEmailContent,
  tokenizeSpellLine,
} from "./block-parsers";

// ===== ヘルパー =====

function text(value: string): ElementContent {
  return { type: "text", value };
}

function el(
  tagName: string,
  className: string | string[] | null,
  children: ElementContent[],
  extra?: Properties
): Element {
  const props: Properties = {};
  if (className) {
    props.className = Array.isArray(className) ? className : [className];
  }
  if (extra) Object.assign(props, extra);
  return { type: "element", tagName, properties: props, children };
}

// ===== アイコンマッピング =====

const ICON_MAP: Record<string, string> = {
  terminal: ">_",
  shield: "\u{1F6E1}",  // 🛡
  sword: "\u2694",       // ⚔
  scroll: "\u{1F4DC}",   // 📜
  spark: "\u2726",       // ✦
  skull: "\u{1F480}",    // 💀
};

// ===== System ブロック =====

export function buildSystemNode(block: SystemBlock): Element {
  const entries = parseSystemContent(block.content);
  const children: ElementContent[] = [];

  // ヘッダー（name または icon がある場合）
  if (block.name || block.icon !== "none") {
    const headerChildren: ElementContent[] = [];

    if (block.icon !== "none") {
      const iconText = ICON_MAP[block.icon] || ">_";
      headerChildren.push(
        el("span", "novel-system-icon", [text(iconText)], {
          ariaHidden: "true",
        })
      );
    }

    if (block.name) {
      headerChildren.push(
        el("span", "novel-system-name", [text(block.name)])
      );
    }

    children.push(el("div", "novel-system-header", headerChildren));
  }

  // ボディ
  const bodyChildren: ElementContent[] = [];

  for (const entry of entries) {
    switch (entry.type) {
      case "label":
        bodyChildren.push(
          el("div", "novel-system-label", [text(entry.text)])
        );
        break;
      case "kv":
        bodyChildren.push(
          el("div", "novel-system-kv", [
            el("span", "novel-system-key", [text(entry.text)]),
            el("span", "novel-system-value", [text(entry.value || "")]),
          ])
        );
        break;
      case "arrow": {
        // → をアクセントカラーで装飾
        const parts = entry.text.split("→");
        const arrowChildren: ElementContent[] = [];
        for (let i = 0; i < parts.length; i++) {
          if (i > 0) {
            arrowChildren.push(
              el("span", "novel-system-arrow-mark", [text("→")])
            );
          }
          if (parts[i]) {
            arrowChildren.push(text(parts[i]));
          }
        }
        bodyChildren.push(el("div", "novel-system-arrow", arrowChildren));
        break;
      }
      case "empty":
        bodyChildren.push(
          el("div", "novel-system-spacer", [])
        );
        break;
      case "text":
        bodyChildren.push(
          el("div", "novel-system-text", [text(entry.text)])
        );
        break;
    }
  }

  children.push(el("div", "novel-system-body", bodyChildren));

  const typeClass = `novel-system--${block.type}`;
  return el("aside", ["novel-system", typeClass], children, {
    role: "note",
    ariaLabel: block.name
      ? `${block.name} - システムメッセージ`
      : "システムメッセージ",
  });
}

// ===== Message ブロック: Chat =====

function buildChatNode(block: MessageBlock): Element {
  const messages = parseChatContent(block.content);
  const children: ElementContent[] = [];

  // ヘッダー（app名）
  if (block.app) {
    children.push(
      el("div", "novel-message-header", [text(block.app)])
    );
  }

  // メッセージ本文
  const bodyChildren: ElementContent[] = [];
  let lastSpeaker = "";

  for (const msg of messages) {
    if (msg.align === "center") {
      // システムメッセージ（中央寄せ）
      bodyChildren.push(
        el("div", "novel-chat-line novel-chat-line--center", [
          el("span", "novel-chat-system", [text(msg.text)]),
        ])
      );
      lastSpeaker = "";
      continue;
    }

    const alignClass =
      msg.align === "right"
        ? "novel-chat-line novel-chat-line--right"
        : "novel-chat-line novel-chat-line--left";

    const lineChildren: ElementContent[] = [];

    // 連続メッセージでなければ発言者名を表示
    const showSpeaker = msg.speaker !== lastSpeaker && msg.speaker !== "";
    if (showSpeaker && msg.align !== "right") {
      lineChildren.push(
        el("span", "novel-chat-speaker", [text(msg.speaker)])
      );
    }

    lineChildren.push(
      el("span", "novel-chat-bubble", [text(msg.text)])
    );

    if (showSpeaker && msg.align === "right") {
      lineChildren.push(
        el("span", "novel-chat-speaker", [text(msg.speaker)])
      );
    }

    bodyChildren.push(
      el("div", alignClass, lineChildren, {
        ariaLabel: `${msg.speaker}の発言`,
      })
    );

    lastSpeaker = msg.speaker;
  }

  children.push(el("div", "novel-message-body", bodyChildren));

  return el("section", ["novel-message", "novel-message--chat"], children, {
    role: "log",
    ariaLabel: block.app || "チャット",
  });
}

// ===== Message ブロック: Email =====

function buildEmailNode(block: MessageBlock): Element {
  const { headers, body } = parseEmailContent(block.content);
  const children: ElementContent[] = [];

  // ヘッダー
  if (headers.length > 0) {
    const headerChildren: ElementContent[] = headers.map((h) =>
      el("div", "novel-message-email-field", [
        el("span", "novel-message-email-label", [text(h.key + ":")]),
        el("span", "novel-message-email-value", [text(" " + h.value)]),
      ])
    );
    children.push(
      el("div", "novel-message-email-header", headerChildren)
    );
  }

  // 本文
  const bodyLines = body.split("\n");
  const bodyChildren: ElementContent[] = bodyLines
    .map((line) =>
      el("p", "novel-message-email-text", [
        text(line || "\u00A0"),
      ])
    );

  children.push(
    el("div", "novel-message-email-body", bodyChildren)
  );

  return el("section", ["novel-message", "novel-message--email"], children, {
    role: "log",
    ariaLabel: "メール",
  });
}

// ===== Message ブロック: Letter =====

function buildLetterNode(block: MessageBlock): Element {
  const lines = block.content.split("\n");
  const children: ElementContent[] = lines.map((line) =>
    el("p", "novel-message-letter-text", [text(line || "\u00A0")])
  );

  return el(
    "section",
    ["novel-message", "novel-message--letter"],
    [el("div", "novel-message-letter-body", children)],
    { role: "log", ariaLabel: "手紙" }
  );
}

// ===== Message ブロック: Telepathy =====

function buildTelepathyNode(block: MessageBlock): Element {
  const messages = parseChatContent(block.content);
  const children: ElementContent[] = [];

  const bodyChildren: ElementContent[] = [];
  let lastSpeaker = "";

  for (const msg of messages) {
    const lineChildren: ElementContent[] = [];

    const showSpeaker = msg.speaker !== lastSpeaker && msg.speaker !== "";
    if (showSpeaker) {
      lineChildren.push(
        el("span", "novel-telepathy-speaker", [text(msg.speaker)])
      );
    }

    lineChildren.push(
      el("span", "novel-telepathy-text", [text(msg.text)])
    );

    const alignClass =
      msg.align === "right"
        ? "novel-telepathy-line novel-telepathy-line--right"
        : "novel-telepathy-line novel-telepathy-line--left";

    bodyChildren.push(el("div", alignClass, lineChildren));
    lastSpeaker = msg.speaker;
  }

  children.push(el("div", "novel-message-body", bodyChildren));

  return el(
    "section",
    ["novel-message", "novel-message--telepathy"],
    children,
    { role: "log", ariaLabel: "念話" }
  );
}

// ===== Message ブロック（ディスパッチ） =====

function buildMessageNode(block: MessageBlock): Element {
  switch (block.type) {
    case "chat":
      return buildChatNode(block);
    case "email":
      return buildEmailNode(block);
    case "letter":
      return buildLetterNode(block);
    case "telepathy":
      return buildTelepathyNode(block);
    default:
      return buildChatNode(block);
  }
}

// ===== Code ブロック =====

function buildCodeLine(
  lineText: string,
  lineNum: number,
  lang: string,
  showNumbers: boolean,
  highlightLines: Set<number>
): Element {
  const lineChildren: ElementContent[] = [];

  // 行番号
  if (showNumbers) {
    lineChildren.push(
      el("span", "novel-code-line-number", [text(String(lineNum))], {
        ariaHidden: "true",
      })
    );
  }

  // コード内容
  if (lang === "spell") {
    // spell言語のトークンハイライト
    const tokens = tokenizeSpellLine(lineText);
    const tokenElements: ElementContent[] = tokens.map((t) =>
      t.type === "text"
        ? text(t.value)
        : el("span", `novel-spell-${t.type}`, [text(t.value)])
    );
    lineChildren.push(
      el("span", "novel-code-line-content", tokenElements)
    );
  } else {
    // 標準言語: プレーンテキスト
    lineChildren.push(
      el("span", "novel-code-line-content", [text(lineText || "\u00A0")])
    );
  }

  const classes = ["novel-code-line"];
  if (highlightLines.has(lineNum)) {
    classes.push("novel-code-line--highlight");
  }

  return el("div", classes, lineChildren);
}

function buildCodeNode(block: CodeBlock): Element {
  const children: ElementContent[] = [];
  const highlightSet = new Set(block.highlight);

  // ヘッダー（title または lang がある場合）
  if (block.title || block.lang !== "plain") {
    const captionChildren: ElementContent[] = [];
    if (block.title) {
      captionChildren.push(
        el("span", "novel-code-title-text", [text(block.title)])
      );
    }
    if (block.lang !== "plain") {
      captionChildren.push(
        el("span", "novel-code-lang", [text(block.lang)])
      );
    }
    children.push(el("figcaption", "novel-code-header", captionChildren));
  }

  // コード行
  const lines = block.content.split("\n");
  // 末尾の空行を除去
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }

  const codeLines: ElementContent[] = lines.map((line, i) =>
    buildCodeLine(line, i + 1, block.lang, block.numbers, highlightSet)
  );

  children.push(
    el("pre", "novel-code-pre", [
      el("code", "novel-code-body", codeLines),
    ])
  );

  return el("figure", "novel-code", children, {
    role: "figure",
    ariaLabel: block.title || "コード",
  });
}

// ===== メインディスパッチ =====

export function buildBlockNode(block: NovelBlock): Element {
  switch (block.kind) {
    case "system":
      return buildSystemNode(block);
    case "message":
      return buildMessageNode(block);
    case "code":
      return buildCodeNode(block);
  }
}
