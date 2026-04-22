# 臺美貿易戰略圖誌 (Taiwan-US Trade Strategic Atlas)

這是一個互動式的 AI 驅動故事地圖，旨在視覺化全球關稅壁壘、供應鏈轉移以及在地經濟影響。本專案使用 Gemini 3 提供即時的地緣政治洞察。

## 部署與設定規範 (Cloudflare Pages)

本專案已針對 Cloudflare Pages 進行優化，請遵守以下規範：

### API Key 設定

為了安全性考量，本專案**不建議**在環境變數中硬編碼 API Key。請按照以下步驟設定：

1.  開啟部署後的網頁。
2.  點擊標題列右側的 **金鑰圖示 (Key Icon)**。
3.  在彈出的視窗中輸入您的 **Gemini API Key**。
4.  點擊「儲存設定」。

您的 API Key 將會安全地儲存在瀏覽器的 `localStorage` 中，僅供本網頁呼叫 API 使用。

### 技術架構

-   **前端框架**: React 19 + TypeScript
-   **樣式**: Tailwind CSS
-   **數據視覺化**: D3.js
-   **AI 引擎**: Google Gemini 3 (via @google/genai)
-   **部署平台**: Cloudflare Pages

### 專案結構

-   `index.html`: 進入點，包含模組化腳本掛載。
-   `index.tsx`: React 掛載點。
-   `App.tsx`: 主要應用程式邏輯與 UI。
-   `services/geminiService.ts`: 負責與 Gemini API 溝通，優先讀取本地儲存的金鑰。

## 開發指令

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 建立生產版本
npm run build
```

建立後的檔案將位於 `dist` 目錄，可直接部署至 Cloudflare Pages。
