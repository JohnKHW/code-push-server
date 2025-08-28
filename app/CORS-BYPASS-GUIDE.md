# 🔓 CORS 繞過完整指南

本指南提供了多種在客戶端繞過 CORS 限制的方法，適用於不同的開發和部署場景。

## 🎯 已實現的解決方案

### 1. 開發環境 - Vite 代理 ✅ (推薦)

**特點**: 自動、透明、無需額外配置

**配置**:
```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    }
  }
}
```

**使用方式**:
- 開發伺服器自動將 `/api/*` 請求代理到 `http://localhost:3000`
- 前端代碼無需修改，自動處理 CORS

**現在運行在**: `http://localhost:4000`

### 2. 智能 API 客戶端 ✅

**特點**: 自動檢測環境並選擇最佳方式

```typescript
// src/api/http.ts
export const http = axios.create({
  // 開發模式使用代理，生產模式使用實際 URL
  baseURL: import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_URL,
  // ...
});
```

### 3. CORS 設定介面 ✅

**特點**: 用戶可以選擇不同的 CORS 繞過方法

- 開發代理模式
- 公共 CORS 代理
- 瀏覽器設定說明

**訪問方式**: 點擊右上角的 "CORS Settings" 按鈕

## 🛠 其他可用方法

### 方法 A: 瀏覽器命令列啟動 (完全禁用 CORS)

**Chrome**:
```bash
# Windows
chrome.exe --user-data-dir=c:/temp/chrome_temp --disable-web-security --disable-features=VizDisplayCompositor

# macOS
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_temp" --disable-web-security --disable-features=VizDisplayCompositor

# Linux
google-chrome --user-data-dir="/tmp/chrome_temp" --disable-web-security --disable-features=VizDisplayCompositor
```

**Firefox**:
1. 在位址列輸入 `about:config`
2. 搜尋並設定: `security.fileuri.strict_origin_policy = false`
3. 重啟瀏覽器

### 方法 B: 瀏覽器擴展

推薦擴展:
- [CORS Unblock](https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino)
- [Disable CORS](https://chrome.google.com/webstore/detail/disable-cors/jcbblnelneacdcbblfgofeiohkpedeigi)

### 方法 C: 公共 CORS 代理 (不推薦生產環境)

```typescript
// 使用公共代理服務
const proxyUrl = `https://cors-anywhere.herokuapp.com/${originalUrl}`;
```

**注意**: 公共代理可能不穩定，且有安全風險。

### 方法 D: 自架 CORS 代理服務器

```javascript
// cors-proxy-server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/proxy', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/proxy': '',
  },
}));

app.listen(8080);
```

## 🚀 快速開始

### 開發環境 (推薦)
```bash
npm run dev
# 訪問 http://localhost:4000
# CORS 自動處理 ✅
```

### 生產環境
```bash
npm run build
npm run preview
# 需要確保後端設定正確的 CORS 標頭
```

## 🔧 後端 CORS 設定 (最終解決方案)

如果您有後端控制權，建議直接在伺服器設定 CORS:

```javascript
// Express.js 範例
app.use(cors({
  origin: ['http://localhost:4000', 'https://your-domain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
```

對於 CodePush 伺服器，設定環境變數:
```bash
CORS_ORIGIN=http://localhost:4000,https://your-domain.com
```

## 📝 環境變數設定

### 開發環境 (.env.development)
```bash
VITE_API_URL=http://localhost:3000
VITE_USE_PROXY=true
VITE_CORS_MODE=proxy
```

### 生產環境 (.env.production)
```bash
VITE_API_URL=https://your-codepush-server.com
VITE_USE_PROXY=false
VITE_CORS_MODE=direct
```

## ⚠️ 安全注意事項

1. **開發環境**: Vite 代理是最安全的選擇
2. **生產環境**: 優先使用後端 CORS 設定
3. **瀏覽器禁用 CORS**: 僅限開發測試使用
4. **公共代理**: 避免在生產環境使用

## 🎉 總結

現在您有多種方式可以繞過 CORS 限制:

1. ✅ **開發環境**: 使用 Vite 代理 (已配置)
2. ✅ **生產環境**: 後端設定 CORS 標頭
3. ✅ **緊急方案**: 瀏覽器擴展或命令列啟動
4. ✅ **自定義**: 使用提供的工具函式

選擇最適合您需求的方法，開始使用 CodePush 管理後台吧！ 🚀
