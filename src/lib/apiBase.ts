const DEV_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.REACT_APP_API_URL ||
  "http://127.0.0.1:8000";

export const API_BASE = process.env.NODE_ENV === "production" ? "/api" : DEV_API_BASE;
