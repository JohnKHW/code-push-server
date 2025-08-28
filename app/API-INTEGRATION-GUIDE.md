# 🔗 API 整合完整指南

您的 React 應用程式現在已經完整配置，可以顯示來自 CodePush API 的真實數據。

## ✅ 已實現的改進

### 1. **智能 API 響應處理**
- **多格式支援**: 自動處理數組和物件格式的 API 響應
- **容錯處理**: 即使 API 格式改變也能正常運作
- **詳細日誌**: 在瀏覽器控制台中查看完整的 API 調用過程

### 2. **增強的錯誤處理**
- **具體錯誤訊息**: 不同錯誤狀態碼的專門處理
- **用戶友好提示**: 清楚的錯誤說明和解決建議
- **調試信息**: 開發者可以看到詳細的錯誤內容

### 3. **API 調試工具** 🛠️
- **內建調試器**: 新增 "Debug Tools" 頁面
- **多種測試方法**: 代理測試、直接測試、健康檢查
- **實時結果**: 查看 API 調用的詳細結果和錯誤

## 🚀 如何使用

### 步驟 1: 啟動應用程式
```bash
cd /Users/user/Documents/GitHub/Tools/code-push-server/app
npm run dev
```
應用程式將在 `http://localhost:4000` 啟動

### 步驟 2: 登入驗證
1. 訪問 `http://localhost:4000`
2. 輸入您的 CodePush Access Key
3. 系統會自動驗證並顯示詳細的調試信息

### 步驟 3: 查看應用程式數據
- **Applications 頁面**: 顯示所有應用程式列表
- **Deployments 頁面**: 顯示每個應用的部署環境
- **Debug Tools**: 診斷 API 連接問題

## 🔍 API 調試功能

### 內建調試工具
在左側導航點擊 "Debug Tools" 訪問：

1. **測試不同端點**: 輸入 API 路徑測試連接
2. **代理 vs 直接**: 比較兩種連接方式的結果
3. **健康檢查**: 測試基本連接
4. **詳細結果**: 查看完整的請求/響應數據

### 瀏覽器控制台調試
開啟瀏覽器開發工具（F12），在 Console 標籤中查看：
- API 請求詳細過程
- 服務器響應內容
- 錯誤堆疊信息
- 數據處理過程

## 📊 API 響應格式處理

### Apps API (`/apps`)
支援以下響應格式：

**格式 1 - 物件格式**:
```json
{
  "MyApp1": {
    "collaborators": {...},
    "deployments": ["Production", "Staging"]
  },
  "MyApp2": {...}
}
```

**格式 2 - 陣列格式**:
```json
[
  {
    "name": "MyApp1",
    "collaborators": {...},
    "deployments": [...]
  }
]
```

### Deployments API (`/apps/{app}/deployments`)
自動處理類似的多種格式，確保數據正確顯示。

## 🐛 常見問題排查

### 問題 1: 應用程式列表為空
**症狀**: 載入完成但沒有顯示應用程式

**排查步驟**:
1. 開啟瀏覽器控制台檢查錯誤
2. 前往 Debug Tools 頁面測試 `/apps` 端點
3. 檢查 Access Key 是否有效
4. 確認服務器 URL 配置正確

### 問題 2: 401 認證錯誤
**症狀**: "Authentication failed" 錯誤訊息

**解決方案**:
1. 確認 Access Key 正確
2. 檢查 Access Key 是否過期
3. 確認服務器允許該 Access Key

### 問題 3: CORS 錯誤
**症狀**: 網路請求被阻擋

**解決方案**:
1. 確認 Vite 代理正常運作（開發環境）
2. 點擊右上角 "CORS Settings" 查看選項
3. 參考 `CORS-BYPASS-GUIDE.md` 的詳細說明

### 問題 4: 404 錯誤
**症狀**: API 端點不存在

**排查步驟**:
1. 確認 CodePush 服務器正常運行
2. 檢查 API 版本是否匹配
3. 使用 Debug Tools 測試不同端點

## 🎯 當前配置

### API 配置
- **開發環境**: 通過 Vite 代理連接
- **目標服務器**: `https://codepush-gammon.gammonconstruction.com/`
- **API 版本**: `application/vnd.code-push.v2+json`
- **認證方式**: Bearer Token (Access Key)

### 代理設定
```typescript
// vite.config.ts
proxy: {
  "/api": {
    target: "https://codepush-gammon.gammonconstruction.com/",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ""),
  }
}
```

## 📈 數據流程

```
前端請求 → Vite 代理 → CodePush 服務器 → 響應處理 → UI 顯示
     ↓
1. /api/apps → 獲取應用列表
2. /api/apps/{app}/deployments → 獲取部署列表  
3. /api/apps/{app}/deployments/{dep}/history → 獲取發佈歷史
```

## 🎉 功能完整度

現在應用程式可以：
- ✅ **顯示真實數據**: 從 API 獲取並顯示應用程式
- ✅ **完整操作**: 建立、編輯、刪除應用和部署
- ✅ **錯誤處理**: 友好的錯誤訊息和調試信息
- ✅ **調試工具**: 內建的 API 測試和診斷功能
- ✅ **CORS 支援**: 多種 CORS 繞過方案

您的 CodePush 管理後台現在完全準備就緒，可以管理真實的應用程式數據！🚀

## 🔧 下一步

1. **測試連接**: 使用您的 Access Key 登入
2. **瀏覽數據**: 查看現有的應用程式和部署
3. **使用調試工具**: 如有問題，使用 Debug Tools 診斷
4. **管理應用**: 開始建立和管理您的 CodePush 應用程式

如需幫助，請查看瀏覽器控制台的詳細日誌或使用內建的調試工具。
