import { initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { defineString } from "firebase-functions/params";

// Firebase Functions v2 的配置
export const channelAccessToken = defineString("LINE_TOKEN", {
  description: "LINE Bot Channel Access Token",
});

export const channelSecret = defineString("LINE_SECRET", {
  description: "LINE Bot Channel Secret",
});

// 初始化 Firebase Admin SDK
initializeApp();

export const db = getDatabase();
