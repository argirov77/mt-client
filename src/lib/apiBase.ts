const DEV_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.REACT_APP_API_URL ||
  "http://127.0.0.1:8000";

const rawBase = process.env.NODE_ENV === "production" ? "/api" : DEV_API_BASE;

export const API_BASE = rawBase.replace(/\/$/, "");
