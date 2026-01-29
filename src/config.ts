const rawApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.38.79.154.248:8000";

export const API = rawApiBaseUrl.replace(/^http:\/\//i, "https://");
