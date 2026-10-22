import axios from "axios";
import { resolveCodePushBaseURL } from "./serverUrl";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
  }
}

export const http = axios.create({
  baseURL: resolveCodePushBaseURL(),
  headers: {
    Accept: "application/vnd.code-push.v2+json",
  },
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  config.baseURL = resolveCodePushBaseURL();
  const token = localStorage.getItem("accessKey");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessKey");
      if (!error.config?.skipAuthRedirect) {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);
