import { createClient } from "@libsql/client";
import path from "path";
import { randomBytes } from "crypto";

const dbPath = path.resolve(process.cwd(), "dev.db");
const db = createClient({ url: `file:${dbPath}` });

function cuid() {
  return randomBytes(16).toString("hex").slice(0, 25);
}

const genres = [
  { name: "ファンタジー", slug: "fantasy" },
  { name: "SF", slug: "sci-fi" },
  { name: "恋愛", slug: "romance" },
  { name: "ミステリー", slug: "mystery" },
  { name: "ホラー", slug: "horror" },
  { name: "歴史", slug: "historical" },
  { name: "現代ドラマ", slug: "modern-drama" },
  { name: "コメディ", slug: "comedy" },
  { name: "アクション", slug: "action" },
  { name: "異世界", slug: "isekai" },
  { name: "文学", slug: "literature" },
  { name: "その他", slug: "other" },
];

async function main() {
  for (const genre of genres) {
    const existing = await db.execute({
      sql: "SELECT id FROM genres WHERE slug = ?",
      args: [genre.slug],
    });
    if (existing.rows.length === 0) {
      await db.execute({
        sql: "INSERT INTO genres (id, name, slug, createdAt) VALUES (?, ?, ?, datetime('now'))",
        args: [cuid(), genre.name, genre.slug],
      });
    }
  }
  console.log("ジャンルのシードデータを投入しました");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.close());
