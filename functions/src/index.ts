import { onRequest } from "firebase-functions/v2/https";
import { WebhookEvent } from "@line/bot-sdk";
import { channelAccessToken, channelSecret } from "./config";
import { validateSignature } from "./utils";
import {
  handleFollowEvent,
  handleTextMessage,
  handleUnfollowEvent,
} from "./eventHandlers";

// --- LINE Bot Webhook 處理函式 ---
export const lineWebhook = onRequest(
  {
    region: "asia-east1",
    memory: "512MiB",
    timeoutSeconds: 120,
    maxInstances: 5,
    invoker: "public",
  },
  async (req, res): Promise<void> => {
    console.log("=== LINE Webhook 開始處理 ===");

    try {
      // 檢查環境變數
      let tokenValue: string;
      let secretValue: string;

      try {
        tokenValue = channelAccessToken.value();
        secretValue = channelSecret.value();
      } catch (error) {
        console.error("❌ 環境變數讀取失敗:", error);
        res.status(500).send("❌ Server configuration error");
        return;
      }

      // 檢查請求方法
      if (req.method !== "POST") {
        res.status(200).json({
          message: "LINE Bot webhook is ready",
          method: req.method,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 檢查簽名
      const signature = req.headers["x-line-signature"] as string;
      if (!signature) {
        console.warn("❌ 缺少 x-line-signature header");
        res.status(401).send("❌ Missing signature");
        return;
      }

      const requestBody =
        typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      console.log("Req.bod是什麼呢??", req.body);

      // 簽名驗證
      if (!validateSignature(requestBody, signature, secretValue)) {
        console.warn("❌ 簽名驗證失敗");
        res.status(401).send("❌ Invalid signature");
        return;
      }
      console.log("✅ 簽名驗證成功");

      // 處理事件
      const events: WebhookEvent[] = req.body.events || [];
      console.log("✅ 成功接收事件數量:", events.length);

      if (events.length === 0) {
        res.status(200).send("OK - No events");
        return;
      }

      const processResults = await Promise.allSettled(
        events.map(async (event, index) => {
          console.log(
            `處理事件 ${index + 1}/${events.length}, 類型: ${event.type}`
          );

          try {
            switch (event.type) {
              case "follow":
                return await handleFollowEvent(event, tokenValue, secretValue);

              case "unfollow":
                return await handleUnfollowEvent(event);

              case "message":
                return await handleTextMessage(event, tokenValue, secretValue);

              default:
                console.log(`跳過事件類型: ${event.type}`);
                return {
                  success: true,
                  message: "skipped",
                  eventType: event.type,
                };
            }
          } catch (error: any) {
            console.error(`❌ 處理事件 ${index + 1} 失敗:`, error);
            return {
              success: false,
              message: "event_processing_failed",
              eventType: event.type,
              error: error.message || "Unknown error",
            };
          }
        })
      );

      // 統計處理結果
      const successful = processResults.filter(
        (result) => result.status === "fulfilled"
      ).length;
      const failed = processResults.filter(
        (result) => result.status === "rejected"
      ).length;

      console.log(`事件處理完成: 成功 ${successful}, 失敗 ${failed}`);
      console.log("=== LINE Webhook 處理完成 ===");
      res.status(200).send("OK");
    } catch (error: any) {
      console.error("❌ Webhook 處理發生未預期錯誤:", error);

      // 避免拋出未處理的錯誤事件
      try {
        res.status(500).json({
          error: "Internal server error",
          message: error.message || "Unknown error",
          timestamp: new Date().toISOString(),
        });
      } catch (responseError) {
        console.error("❌ 發送錯誤回應時失敗:", responseError);
        // 如果連回應都無法發送，至少記錄錯誤
      }
    }
  }
);
