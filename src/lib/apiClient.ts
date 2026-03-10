import axios from "axios";
import { API_BASE } from "./apiBase";

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const method = (config.method ?? "get").toUpperCase();
  const needsCsrf =
    method !== "GET" && method !== "HEAD" && method !== "OPTIONS";

  if (needsCsrf && typeof document !== "undefined") {
    const match = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("mc_csrf="));

    if (match) {
      const token = decodeURIComponent(match.split("=")[1] ?? "");
      if (token) {
        config.headers.set("X-CSRF", token);
      }
    }
  }

  return config;
});

export default apiClient;
