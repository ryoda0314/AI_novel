export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  if (days < 30) return `${days}日前`;
  return formatDate(date);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function formatNumber(num: number): string {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}千`;
  return num.toString();
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "ongoing":
      return "連載中";
    case "completed":
      return "完結";
    case "hiatus":
      return "休止中";
    default:
      return status;
  }
}

/** 文字数から推定読了時間を返す（日本語: 約500文字/分） */
export function estimateReadingTime(charCount: number): string {
  const minutes = Math.ceil(charCount / 500);
  if (minutes < 1) return "1分未満";
  if (minutes < 60) return `約${minutes}分`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `約${hours}時間`;
  return `約${hours}時間${remaining}分`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "ongoing":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "completed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "hiatus":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}
