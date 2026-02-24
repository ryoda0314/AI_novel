import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8 text-2xl font-bold text-[var(--color-primary)]">
        <BookOpen size={28} />
        AI小説広場
      </Link>
      {children}
    </div>
  );
}
