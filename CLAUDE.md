# CLAUDE.md

## プロジェクト概要
AI小説広場 - Next.js 15 + Prisma v7 + PostgreSQL (Supabase) の小説投稿プラットフォーム

## 開発時の注意事項

### Prisma マイグレーション
- `DATABASE_URL` は pgbouncer 経由（port 6543）→ `prisma migrate dev` がハングする
- マイグレーションには `DIRECT_URL`（port 5432）を使うこと
- `prisma.config.ts` で `DIRECT_URL || DATABASE_URL` を設定済み
- `dotenv/config` が `.env` を読み込むため、シェルの環境変数上書きは効かない → config ファイル側で対応する

### React 19 + TypeScript
- `useRef` に初期値が必須: `useRef<T>(undefined)` や `useRef<T>(null)` のように書く
- 引数なしの `useRef<T>()` は型エラーになる

### 日本語で対応
- コミットメッセージ、コメント、UIテキストはすべて日本語
