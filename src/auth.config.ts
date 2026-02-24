import type { NextAuthConfig } from "next-auth";

/**
 * Edge Runtime 互換の認証設定（Prisma等のNode.js依存なし）
 * middleware.ts から安全にインポートできる
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [], // auth.ts で追加
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
};
