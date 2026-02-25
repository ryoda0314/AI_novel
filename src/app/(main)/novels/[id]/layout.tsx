import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  const novel = await prisma.novel.findUnique({
    where: { id },
    select: { title: true, synopsis: true, author: { select: { name: true } } },
  });

  if (!novel) {
    return { title: "作品が見つかりません" };
  }

  const description = novel.synopsis.length > 160
    ? novel.synopsis.slice(0, 160) + "..."
    : novel.synopsis;

  return {
    title: `${novel.title} - ${novel.author.name} | AI小説広場`,
    description,
    openGraph: {
      title: novel.title,
      description,
      type: "article",
      images: [`/novels/${id}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title: novel.title,
      description,
    },
  };
}

export default function NovelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
