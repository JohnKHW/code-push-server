import axios from 'axios';

export const http = axios.create({
  // 在開發模式使用代理路徑，生產模式使用實際 API URL
  baseURL: import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:3000'),
  headers: {
    Accept: 'application/vnd.code-push.v2+json',
  },
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessKey');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    // 處理 401 未授權錯誤
    if (error.response?.status === 401) {
      localStorage.removeItem('accessKey');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);
