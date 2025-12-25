const resolveDefaultApi = () => {
  const apiFromEnv = process.env.NEXT_PUBLIC_API_URL;
  if (apiFromEnv) {
    return apiFromEnv;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8000";
  }

  return "https://api.38-79-154-248.nip.io";
};

export const API = resolveDefaultApi();
