export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(date) {
  const now = new Date();
  const value = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - value.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return formatDate(date);
}

export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function extractSupabaseErrorMessage(error, fallback) {
  const message =
    error?.message ||
    error?.error_description ||
    error?.details ||
    error?.hint ||
    fallback;
  return message || "Something went wrong.";
}
