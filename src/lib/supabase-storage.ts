import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const STORAGE_BUCKET = "uploads";

// サーバーサイド専用（Service Role Key使用でRLSをバイパス）
// ビルド時のモジュール評価でエラーにならないよう遅延初期化
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください"
      );
    }
    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
}
