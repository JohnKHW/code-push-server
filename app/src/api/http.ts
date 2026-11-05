import axios from "axios";
import { readSession, clearSession } from "./session";
declare module "axios" {
  interface AxiosRequestConfig {
    skipSessionRefresh?: boolean;
  }
}
export const http = axios.create({
  baseURL: import.meta.env.DEV ? "/api" : "/",
  headers: { Accept: "application/vnd.code-push.v2+json" },
  timeout: 30000,
});
http.interceptors.request.use((config) => {
  const session = readSession();
  if (session && !config.headers.Authorization)
    config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});
http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.skipSessionRefresh &&
      !error.config?.url?.startsWith("/auth/") &&
      (!readSession(0) ||
        error.config?.headers.Authorization ===
          `Bearer ${readSession(0)?.token}`)
    ) {
      clearSession();
      window.dispatchEvent(new Event("codepush:unauthorized"));
    }
    return Promise.reject(error);
  }
);
