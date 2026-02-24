export interface ToolbarAction {
  key: string;
  label: string;
  icon: string;
  action: (
    textarea: HTMLTextAreaElement,
    value: string,
    onChange: (value: string) => void
  ) => void;
}

function insertAroundSelection(
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (v: string) => void,
  before: string,
  after: string,
  placeholderInside?: string
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);
  const inner = selected || placeholderInside || "";
  const newValue = value.slice(0, start) + before + inner + after + value.slice(end);
  onChange(newValue);

  // カーソル位置を調整
  requestAnimationFrame(() => {
    textarea.focus();
    if (selected) {
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + inner.length;
    } else if (placeholderInside) {
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + inner.length;
    } else {
      textarea.selectionStart = textarea.selectionEnd = start + before.length;
    }
  });
}

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (v: string) => void,
  text: string
) {
  const start = textarea.selectionStart;
  const newValue = value.slice(0, start) + text + value.slice(start);
  onChange(newValue);

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
  });
}

export const toolbarActions: ToolbarAction[] = [
  {
    key: "ruby",
    label: "ルビ",
    icon: "文",
    action: (textarea, value, onChange) => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.slice(start, end);

      if (selected) {
        const newText = `{${selected}|よみ}`;
        const newValue = value.slice(0, start) + newText + value.slice(end);
        onChange(newValue);
        requestAnimationFrame(() => {
          textarea.focus();
          // 「よみ」部分を選択
          textarea.selectionStart = start + selected.length + 2;
          textarea.selectionEnd = start + selected.length + 4;
        });
      } else {
        insertAroundSelection(textarea, value, onChange, "{", "|よみ}", "漢字");
      }
    },
  },
  {
    key: "dots",
    label: "傍点",
    icon: "・",
    action: (textarea, value, onChange) => {
      insertAroundSelection(textarea, value, onChange, "..", "..", "強調テキスト");
    },
  },
  {
    key: "scene",
    label: "区切り",
    icon: "―",
    action: (textarea, value, onChange) => {
      insertAtCursor(textarea, value, onChange, "\n\n===\n\n");
    },
  },
  {
    key: "note",
    label: "作者注",
    icon: "注",
    action: (textarea, value, onChange) => {
      insertAtCursor(
        textarea,
        value,
        onChange,
        "\n\n:::note\nここに作者注を記入\n:::\n\n"
      );
    },
  },
  {
    key: "characters",
    label: "人物",
    icon: "人",
    action: (textarea, value, onChange) => {
      insertAtCursor(
        textarea,
        value,
        onChange,
        "\n\n:::characters\n- name: 名前\n  reading: よみ\n  description: 説明\n  traits: 特徴1, 特徴2\n:::\n\n"
      );
    },
  },
  {
    key: "glossary",
    label: "用語",
    icon: "辞",
    action: (textarea, value, onChange) => {
      insertAtCursor(
        textarea,
        value,
        onChange,
        "\n\n:::glossary\n- term: 用語名\n  reading: よみ\n  description: 用語の説明\n:::\n\n"
      );
    },
  },
  {
    key: "system",
    label: "システム",
    icon: "⚙",
    action: (textarea, value, onChange) => {
      insertAtCursor(
        textarea,
        value,
        onChange,
        '\n\n:::system name="SYSTEM" type="info"\nメッセージをここに記入\n:::\n\n'
      );
    },
  },
  {
    key: "message",
    label: "メッセージ",
    icon: "💬",
    action: (textarea, value, onChange) => {
      insertAtCursor(
        textarea,
        value,
        onChange,
        '\n\n:::message type="chat"\n太郎: こんにちは\n自分: やあ\n:::\n\n'
      );
    },
  },
  {
    key: "code",
    label: "コード",
    icon: "{}",
    action: (textarea, value, onChange) => {
      insertAtCursor(
        textarea,
        value,
        onChange,
        '\n\n:::code lang="spell" title="呪文名"\nCAST<Fire>(\n  power: Int = 3\n) -> Execute;\n:::\n\n'
      );
    },
  },
];
