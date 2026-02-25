import { auth } from "@/auth";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPTS: Record<string, string> = {
  continue: `あなたは小説の執筆を支援するAIアシスタントです。
与えられた文章の続きを自然に書いてください。
- 文体・語調・視点を維持すること
- ルビ記法 {漢字|よみ} や傍点 ..テキスト.. を適宜使うこと
- 2〜4段落程度の長さで生成すること
- 独自の解釈を加えすぎず、文脈に沿った展開にすること
続きの文章のみを出力してください。説明や前置きは不要です。`,

  improve: `あなたは小説の文章を推敲するAIアシスタントです。
与えられた文章の表現をより魅力的に改善してください。
- 文体・語調・視点は維持すること
- 比喩や描写を豊かにすること
- 冗長な表現を削り、テンポを良くすること
- ルビ記法 {漢字|よみ} や傍点 ..テキスト.. を適宜使うこと
改善後の文章のみを出力してください。説明や前置きは不要です。`,

  summarize: `あなたは小説の要約を行うAIアシスタントです。
与えられた文章を簡潔に要約してください。
- 主要な出来事・人物の行動を中心にまとめること
- 3〜5文程度の長さにすること
- ネタバレ配慮は不要（作者向けの機能のため）
要約のみを出力してください。`,

  dialogue: `あなたは小説のセリフを提案するAIアシスタントです。
与えられた場面の文脈に基づいて、キャラクターの台詞を提案してください。
- 「」で台詞を囲むこと
- キャラクターの性格や関係性が伝わる台詞にすること
- 地の文（動作・表情の描写）も交えること
- 3〜5つの台詞のやりとりを提案すること
台詞のシーンのみを出力してください。`,

  describe: `あなたは小説の情景描写を支援するAIアシスタントです。
与えられた場面の文脈に基づいて、情景描写を生成してください。
- 五感を使った描写を入れること
- 雰囲気や感情を反映した表現にすること
- 2〜3段落程度の長さにすること
- ルビ記法 {漢字|よみ} や傍点 ..テキスト.. を適宜使うこと
情景描写のみを出力してください。`,
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI機能が設定されていません。管理者にお問い合わせください。" },
      { status: 503 }
    );
  }

  const { type, text, context } = await request.json();

  if (!type || !SYSTEM_PROMPTS[type]) {
    return NextResponse.json({ error: "無効なリクエストタイプです" }, { status: 400 });
  }

  if (!text?.trim()) {
    return NextResponse.json({ error: "テキストが必要です" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  let userMessage = "";
  if (type === "continue") {
    userMessage = context
      ? `以下は小説の前の部分です:\n\n${context}\n\n---\n\n以下の文章の続きを書いてください:\n\n${text}`
      : `以下の文章の続きを書いてください:\n\n${text}`;
  } else if (type === "improve") {
    userMessage = `以下の文章を改善してください:\n\n${text}`;
  } else if (type === "summarize") {
    userMessage = `以下の文章を要約してください:\n\n${text}`;
  } else if (type === "dialogue") {
    userMessage = context
      ? `場面の文脈:\n${context}\n\n以下の場面に続く台詞を提案してください:\n\n${text}`
      : `以下の場面に続く台詞を提案してください:\n\n${text}`;
  } else if (type === "describe") {
    userMessage = context
      ? `場面の文脈:\n${context}\n\n以下の場面の情景描写を生成してください:\n\n${text}`
      : `以下の場面の情景描写を生成してください:\n\n${text}`;
  }

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system: SYSTEM_PROMPTS[type],
    messages: [{ role: "user", content: userMessage }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
