# 運動打卡 LINE Bot 🏃‍♂️💪

一個基於 Firebase Functions 和 LINE Bot SDK 開發的運動打卡機器人，幫助用戶記錄每日運動並與朋友互動競爭。

## 🌟 功能特色

### 📱 核心功能
- **運動打卡記錄**：用戶可以輸入「完成」來記錄當日運動
- **排名系統**：查看今日運動排名，激勵用戶持續運動
- **多語言支援**：支援繁體中文和日文介面
- **LINE通知提醒**：當有人完成運動時，會提醒其他尚未運動的用戶
- **用戶管理**：自動記錄用戶加入/離開狀態

### 🎯 互動指令
- `完成` / `完了` - 記錄今日運動完成
- `排名` / `ランキング` - 查看今日運動排名
- `中文` / `TW` - 切換為繁體中文介面
- `日本語` / `JP` - 切換為日文介面

### 🏆 排名系統
- 🥇 第一名：金牌圖示
- 🥈 第二名：銀牌圖示  
- 🥉 第三名：銅牌圖示
- 🔺 其他名次：三角形圖示
- 顯示完成時間和排名資訊

## 🛠️ 技術架構

### 後端技術
- **Firebase Functions v2**：無伺服器雲端函數
- **Firebase Realtime Database**：即時資料庫
- **TypeScript**：型別安全的開發語言
- **LINE Bot SDK**：LINE 官方機器人開發套件

### 開發工具
- **ESLint**：程式碼品質檢查
- **Google Code Style**：遵循 Google 程式碼風格
- **Firebase CLI**：部署和本地開發工具

## 📦 安裝與設定

### 前置需求
- Node.js 22+
- Firebase CLI
- LINE Developer Account

### 1. clone專案
```bash
git clone <repository-url>
cd <project-directory>
npm install
```

### 2. Firebase 設定
```bash
# 安裝 Firebase CLI
npm install -g firebase-tools

# 登入 Firebase
firebase login

# 初始化專案
firebase init
```

### 3. 環境變數設定
設定 Firebase Functions 環境變數：

```bash
# 設定 LINE Bot Channel Access Token
firebase functions:config:set line.token="YOUR_CHANNEL_ACCESS_TOKEN"

# 設定 LINE Bot Channel Secret  
firebase functions:config:set line.secret="YOUR_CHANNEL_SECRET"
```

或使用 Firebase Functions v2 的參數設定：
```bash
# 部署時會提示輸入這些參數
# LINE_TOKEN: LINE Bot Channel Access Token
# LINE_SECRET: LINE Bot Channel Secret
```

### 4. LINE Bot 設定
1. 在 [LINE Developers Console](https://developers.line.biz/) 建立 Messaging API 頻道
2. 取得 Channel Access Token 和 Channel Secret
3. 設定 Webhook URL：`https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/lineWebhook`
4. 啟用 Webhook 並關閉自動回覆訊息

## 🚀 開發與部署

### 本地開發
```bash
# 程式碼檢查
npm run lint

# 自動修復程式碼風格
npm run lint:fix

# 編譯 TypeScript
npm run build

# 監聽模式編譯
npm run build:watch

# 本地模擬器
npm run serve
```

### 部署到 Firebase
```bash
# 部署 Functions
npm run deploy

# 或使用 Firebase CLI
firebase deploy --only functions
```

### 查看日誌
```bash
# 查看 Functions 日誌
npm run logs

# 或使用 Firebase CLI
firebase functions:log
```

## 📊 資料庫結構

### 用戶資料 (`/users/{userId}`)
```json
{
  "lineUserId": "string",
  "displayName": "string", 
  "pictureUrl": "string",
  "statusMessage": "string",
  "joinedAt": "ISO string",
  "lastActiveAt": "ISO string",
  "isActive": boolean,
  "language": "zh-TW" | "ja-JP"
}
```

### 運動記錄 (`/records/{date}/{userId}`)
```json
{
  "userId": "string",
  "displayName": "string",
  "finishTime": "HH:mm",
  "timestamp": "ISO string",
  "ranking": number
}
```

## 🔧 API 端點

### LINE Webhook
- **URL**: `/lineWebhook`
- **Method**: POST
- **功能**: 處理 LINE Bot 的 Webhook 事件

支援的事件類型：
- `follow` - 用戶加入機器人
- `unfollow` - 用戶封鎖機器人  
- `message` - 用戶發送訊息

## 🌍 多語言支援

專案支援以下語言：
- **繁體中文** (`zh-TW`) - 預設語言
- **日文** (`ja-JP`)

用戶可以隨時透過指令切換語言，設定會儲存在資料庫中。

## 📱 使用流程

1. **加入機器人**：掃描 QR Code 或搜尋 LINE ID 加入
2. **查看說明**：機器人會自動發送使用說明
3. **記錄運動**：完成運動後輸入「完成」
4. **查看排名**：輸入「排名」查看今日運動狀況
5. **語言切換**：可隨時切換中文/日文介面

## 🔒 安全性

- **簽名驗證**：所有 Webhook 請求都會驗證 LINE 簽名
- **環境變數**：敏感資訊使用 Firebase Functions 參數管理
- **錯誤處理**：完整的錯誤捕獲和日誌記錄

## 📈 監控與日誌

- **Firebase Console**：監控 Functions 執行狀況
- **詳細日誌**：記錄所有重要操作和錯誤
- **效能監控**：追蹤回應時間和錯誤率

## 📄 授權條款

此專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

## 🆘 常見問題

### Q: Webhook 驗證失敗怎麼辦？
A: 檢查 Channel Secret 是否正確設定，確保 Webhook URL 正確。

### Q: 機器人沒有回應？
A: 檢查 Firebase Functions 日誌，確認 Channel Access Token 是否有效。

### Q: 如何重置用戶資料？
A: 可以直接在 Firebase Console 中刪除對應的資料庫節點。


**讓我們一起養成運動習慣！** 🏃‍♀️🏃‍♂️💪