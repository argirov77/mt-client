export const fetchWithInclude = (
  input: RequestInfo | URL,
  init?: RequestInit
) => {
  const headers = new Headers(init?.headers ?? undefined);

  if (init?.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const method = init?.method?.toUpperCase() ?? "GET";
  const needsCsrfHeader = method !== "GET" && method !== "HEAD" && method !== "OPTIONS";

  if (needsCsrfHeader && !headers.has("X-CSRF") && typeof document !== "undefined") {
    const match = document.cookie
      .split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith("mc_csrf="));

    if (match) {
      const token = decodeURIComponent(match.split("=")[1] ?? "");
      if (token) {
        headers.set("X-CSRF", token);
      }
    }
  }

  return fetch(input, {
    ...init,
    credentials: "include",
    headers,
  });
};

