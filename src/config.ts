const apiEnvUrl =
  process.env.REACT_APP_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export const API =
  process.env.NODE_ENV === "production" ? "/api" : apiEnvUrl;
