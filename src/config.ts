const resolveDefaultApi = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // In local development keep requests against the local backend
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:8000";
  }

  // Hosted/staging environments hit the public API domain that supports CORS
  return "https://api.38-79-154-248.nip.io";
};

export const API = resolveDefaultApi();
