import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ai-novel.example.com";

  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/novels`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/ranking`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/contests`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/search`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/guide`, changeFrequency: "monthly", priority: 0.5 },
  ];

  // 小説ページ
  const novels = await prisma.novel.findMany({
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });

  const novelPages: MetadataRoute.Sitemap = novels.map((novel) => ({
    url: `${baseUrl}/novels/${novel.id}`,
    lastModified: novel.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ユーザーページ
  const users = await prisma.user.findMany({
    select: { id: true, updatedAt: true },
    take: 5000,
  });

  const userPages: MetadataRoute.Sitemap = users.map((user) => ({
    url: `${baseUrl}/users/${user.id}`,
    lastModified: user.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // ジャンルページ
  const genres = await prisma.genre.findMany({
    select: { slug: true },
  });

  const genrePages: MetadataRoute.Sitemap = genres.map((genre) => ({
    url: `${baseUrl}/novels?genre=${genre.slug}`,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...novelPages, ...userPages, ...genrePages];
}
