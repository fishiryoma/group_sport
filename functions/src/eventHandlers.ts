import { UserData } from "./types";
import {
  getUserProfile,
  saveUser,
  updateUserActivity,
  replyMessage,
  getYesterdayRanking,
  writeRecord,
  sendRemindersToUnfinishedUsers,
  getTodayAllUsersRecord,
  setUserLanguage,
  getUserLanguage,
} from "./utils";
import {
  createGeneralMessage,
  createRecordReply,
  createRankingReply,
  createLanguageChangeMessage,
} from "./messages";

/**
 * 處理用戶加入事件
 */
export async function handleFollowEvent(
  event: any,
  accessToken: string,
  secret: string
) {
  const userId = event.source.userId;
  console.log(`✅ 用戶 ${userId} 加入了 LINE Bot`);

  try {
    // 獲取用戶資料
    const profile = await getUserProfile(userId, accessToken);

    // 準備用戶資料
    const userData: UserData = {
      lineUserId: userId,
      displayName: profile?.displayName || "未設定",
      pictureUrl: profile?.pictureUrl || "未設定",
      statusMessage: profile?.statusMessage || "未設定",
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isActive: true,
    };

    // 儲存到數據庫
    await saveUser(userData);

    // 發送歡迎訊息
    if (event.replyToken) {
      const welcomeMessage = createGeneralMessage(profile?.displayName);
      await replyMessage(event.replyToken, welcomeMessage, accessToken, secret);
      console.log(`✅ 成功發送歡迎訊息給用戶 ${userId}`);
    }

    return { success: true, userId, message: "user_joined" };
  } catch (error: any) {
    console.error(`❌ 處理 follow 事件時發生未預期錯誤:`, error);
    return {
      success: false,
      userId,
      message: "user_join_failed",
      error: error.message,
    };
  }
}

/**
 * 處理用戶離開事件
 */
export async function handleUnfollowEvent(event: any) {
  const userId = event.source.userId;
  console.log(`❌ 用戶 ${userId} 離開了 LINE Bot`);

  try {
    await updateUserActivity(userId, false);
    return { success: true, userId, message: "user_left" };
  } catch (error: any) {
    console.error(`❌ 處理 unfollow 事件失敗:`, error);
    return {
      success: false,
      userId,
      message: "user_left_failed",
      error: error.message,
    };
  }
}

/**
 * 處理文字訊息事件
 */
export async function handleTextMessage(
  event: any,
  accessToken: string,
  secret: string
) {
  const userId = event.source.userId;
  const userMessage = event.message.text.trim();
  console.log(`✅ 收到來自 ${userId} 的訊息: "${userMessage}"`);

  try {
    // 更新用戶活動時間
    await updateUserActivity(userId, true);

    // 檢查訊息類型
    const isCompleteCommand = userMessage === "完成" || userMessage === "完了";
    const isRankingQuery =
      userMessage === "排名" || userMessage === "ランキング";
    const isLanguageSwitch =
      userMessage === "日本語" ||
      userMessage === "JP" ||
      userMessage === "中文" ||
      userMessage === "TW";

    if (isCompleteCommand) {
      // 處理運動完成邏輯
      return await handleExerciseComplete(event, userId, accessToken, secret);
    } else if (isRankingQuery) {
      // 處理排名查詢邏輯
      return await handleRankingQuery(event, userId, accessToken, secret);
    } else if (isLanguageSwitch) {
      // 處理語言切換邏輯
      return await handleLanguageSwitch(
        event,
        userId,
        userMessage,
        accessToken,
        secret
      );
    } else {
      // 處理一般訊息
      return await handleGeneralMessage(event, userId, accessToken, secret);
    }
  } catch (error: any) {
    console.error(`❌ 處理文字訊息事件失敗:`, error);
    return {
      success: false,
      userId,
      message: "text_message_failed",
      error: error.message,
    };
  }
}

/**
 * 處理運動完成邏輯
 */
async function handleExerciseComplete(
  event: any,
  userId: string,
  accessToken: string,
  secret: string
) {
  try {
    // 獲取用戶資料
    const profile = await getUserProfile(userId, accessToken);
    const displayName = profile?.displayName || "某位朋友";

    // 寫入運動記錄
    const recordResult = await writeRecord(userId);

    if (!recordResult.success) {
      throw new Error("寫入運動記錄失敗");
    }

    // 獲取用戶語言偏好
    const userLanguage = await getUserLanguage(userId);

    // 獲取昨日排名
    const { ranking: yesterdayRanking } = await getYesterdayRanking(userId);
    const hasYesterdayRecord = yesterdayRanking > 0;

    // 準備回覆訊息
    const replyMsg = createRecordReply(
      hasYesterdayRecord,
      yesterdayRanking,
      recordResult.ranking,
      userLanguage
    );

    // 回覆用戶
    if (event.replyToken) {
      await replyMessage(event.replyToken, replyMsg, accessToken, secret);
      console.log(`✅ 成功回覆用戶 ${userId} 運動完成訊息`);
    }

    // 檢查是否需要發送提醒：只有當日第一次記錄時才發送提醒
    console.log(
      `✅ 用戶 ${userId} (${displayName}) 完成運動，排名第 ${recordResult.ranking} 名`
    );

    // 只有當日第一次記錄時才發送提醒給其他用戶
    if (recordResult.isFirstTimeToday) {
      console.log(`📢 ${displayName} 當日第一次記錄運動，發送提醒給其他用戶`);

      // 異步發送提醒訊息，但先檢查是否還有其他未完成的用戶
      sendRemindersToUnfinishedUsers(displayName, accessToken, secret)
        .then((result) => {
          if (result.sentCount > 0) {
            console.log(
              `✅ 提醒訊息發送結果: 成功發送 ${result.sentCount} 則訊息給尚未完成的用戶`
            );
          } else {
            console.log(
              `🎉 ${displayName} 是最後一名完成運動的用戶，所有人都已完成今日運動！`
            );
          }
        })
        .catch((error) => {
          console.error("❌ 發送提醒訊息時發生錯誤:", error);
        });
    } else {
      console.log(`ℹ️ ${displayName} 重複輸入「完成」，不發送提醒訊息`);
    }

    return {
      success: true,
      userId,
      message: "exercise_completed",
      ranking: recordResult.ranking,
    };
  } catch (error: any) {
    console.error(`❌ 處理運動完成事件失敗:`, error);

    // 發送錯誤回覆
    if (event.replyToken) {
      const errorMsg = createGeneralMessage();
      await replyMessage(event.replyToken, errorMsg, accessToken, secret);
    }

    return {
      success: false,
      userId,
      message: "exercise_complete_failed",
      error: error.message,
    };
  }
}

/**
 * 處理排名查詢邏輯
 */
async function handleRankingQuery(
  event: any,
  userId: string,
  accessToken: string,
  secret: string
) {
  try {
    // 獲取用戶語言偏好
    const userLanguage = await getUserLanguage(userId);

    // 獲取今日所有用戶運動記錄
    const usersRecord = await getTodayAllUsersRecord();

    // 生成排名回覆訊息
    const replyMsg = createRankingReply(usersRecord, userLanguage);

    if (event.replyToken) {
      await replyMessage(event.replyToken, replyMsg, accessToken, secret);
      console.log(`✅ 成功回覆用戶 ${userId} 排名查詢 (語言: ${userLanguage})`);
    }

    return { success: true, userId, message: "ranking_query" };
  } catch (error: any) {
    console.error(`❌ 處理排名查詢失敗:`, error);

    // 發送錯誤回覆
    if (event.replyToken) {
      const userLanguage = await getUserLanguage(userId);
      const errorMsg = createGeneralMessage(undefined, userLanguage);
      await replyMessage(event.replyToken, errorMsg, accessToken, secret);
    }

    return {
      success: false,
      userId,
      message: "ranking_query_failed",
      error: error.message,
    };
  }
}

/**
 * 處理語言切換邏輯
 */
async function handleLanguageSwitch(
  event: any,
  userId: string,
  userMessage: string,
  accessToken: string,
  secret: string
) {
  try {
    // 判斷要切換到哪種語言
    let targetLanguage: string;
    if (userMessage === "日本語" || userMessage === "JP") {
      targetLanguage = "ja-JP";
    } else if (userMessage === "中文" || userMessage === "TW") {
      targetLanguage = "zh-TW";
    } else {
      targetLanguage = "zh-TW"; // 默認中文
    }

    // 設置用戶語言
    const success = await setUserLanguage(userId, targetLanguage);

    if (!success) {
      throw new Error("設置語言失敗");
    }

    // 生成語言切換成功訊息
    const replyMsg = createLanguageChangeMessage(targetLanguage);

    if (event.replyToken) {
      await replyMessage(event.replyToken, replyMsg, accessToken, secret);
      console.log(`✅ 成功回覆用戶 ${userId} 語言切換訊息`);
    }

    return {
      success: true,
      userId,
      message: "language_switched",
      language: targetLanguage,
    };
  } catch (error: any) {
    console.error(`❌ 處理語言切換失敗:`, error);

    // 發送錯誤回覆
    if (event.replyToken) {
      const errorMsg = createGeneralMessage();
      await replyMessage(event.replyToken, errorMsg, accessToken, secret);
    }

    return {
      success: false,
      userId,
      message: "language_switch_failed",
      error: error.message,
    };
  }
}

/**
 * 處理一般訊息
 */
async function handleGeneralMessage(
  event: any,
  userId: string,
  accessToken: string,
  secret: string
) {
  try {
    // 獲取用戶語言偏好
    const userLanguage = await getUserLanguage(userId);

    // 回覆一般訊息
    const replyMsg = createGeneralMessage(undefined, userLanguage);

    if (event.replyToken) {
      await replyMessage(event.replyToken, replyMsg, accessToken, secret);
      console.log(`✅ 成功回覆用戶 ${userId} 一般訊息 (語言: ${userLanguage})`);
    }

    return { success: true, userId, message: "general_reply" };
  } catch (error: any) {
    console.error(`❌ 處理一般訊息失敗:`, error);
    return {
      success: false,
      userId,
      message: "general_message_failed",
      error: error.message,
    };
  }
}
