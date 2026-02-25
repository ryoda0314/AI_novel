import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

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
    await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: {},
      create: { name: genre.name, slug: genre.slug },
    });
  }
  console.log("ジャンルのシードデータを投入しました");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
