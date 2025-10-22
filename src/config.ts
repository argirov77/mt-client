const REMOTE_API_URL = "http://38.79.154.248:8000";
const LOCAL_API_URL = "http://localhost:8000";

const resolveDefaultApiUrl = (): string => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return LOCAL_API_URL;
    }
  }

  return REMOTE_API_URL;
};

export const API = process.env.NEXT_PUBLIC_API_URL ?? resolveDefaultApiUrl();

