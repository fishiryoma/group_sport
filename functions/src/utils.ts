import { UserData } from "./types";
import { Message, Client } from "@line/bot-sdk";
import { db } from "./config";
import { createReminderMessage } from "./messages";

// 格式化日期為台灣時區
const formatDateToTaiwan = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
};

const getTodayDate = (): string => {
  return formatDateToTaiwan(new Date());
};

const getYesterdayDate = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateToTaiwan(yesterday);
};

/**
 * 獲取用戶 LINE 資料
 */
export async function getUserProfile(userId: string, accessToken: string) {
  try {
    const lineClient = new Client({ channelAccessToken: accessToken });
    const profile = await lineClient.getProfile(userId);
    console.log(`✅ 獲取用戶 ${userId} 的資料:`, profile);
    return profile;
  } catch (error) {
    console.error(`❌ 獲取用戶 ${userId} 資料失敗:`, error);
    return null;
  }
}

/**
 * 儲存/更新用戶資料
 */
export async function saveUser(userData: UserData): Promise<boolean> {
  try {
    const userRef = db.ref(`users/${userData.lineUserId}`);
    const snapshot = await userRef.get();

    if (snapshot.exists()) {
      await updateUserActivity(userData.lineUserId);
      console.log(`✅ 用戶 ${userData.lineUserId} 資料已更新`);
    } else {
      await userRef.set(userData);
      console.log(`✅ 新用戶 ${userData.lineUserId} 已加入`);
    }
    return true;
  } catch (error) {
    console.error("❌ 儲存用戶資料失敗:", error);
    return false;
  }
}

/**
 * 更新用戶活動狀態
 */
export async function updateUserActivity(
  userId: string,
  isActive: boolean = true
): Promise<boolean> {
  try {
    const userRef = db.ref(`users/${userId}`);
    await userRef.update({
      lastActiveAt: new Date().toISOString(),
      isActive,
    });
    console.log(`✅ 用戶 ${userId} 活動狀態已更新`);
    return true;
  } catch (error) {
    console.error(`❌ 更新用戶活動狀態失敗:`, error);
    return false;
  }
}

/**
 * 設置用戶語言偏好
 */
export async function setUserLanguage(
  userId: string,
  language: string
): Promise<boolean> {
  try {
    const userRef = db.ref(`users/${userId}`);
    await userRef.update({
      language: language,
      lastActiveAt: new Date().toISOString(),
    });
    console.log(`✅ 用戶 ${userId} 語言設置已更新為: ${language}`);
    return true;
  } catch (error) {
    console.error(`❌ 設置用戶語言失敗:`, error);
    return false;
  }
}

/**
 * 獲取用戶語言偏好
 */
export async function getUserLanguage(userId: string): Promise<string> {
  try {
    const userSnapshot = await db.ref(`users/${userId}`).get();
    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      return userData.language || "zh-TW"; // 默認中文
    }
    return "zh-TW"; // 默認中文
  } catch (error) {
    console.error(`❌ 獲取用戶語言失敗:`, error);
    return "zh-TW"; // 默認中文
  }
}

/**
 * 發送回覆訊息
 */
export async function replyMessage(
  replyToken: string,
  message: Message,
  accessToken: string,
  secret: string
): Promise<boolean> {
  try {
    const lineClient = new Client({
      channelAccessToken: accessToken,
      channelSecret: secret,
    });
    await lineClient.replyMessage(replyToken, message);
    console.log("✅ 訊息回覆成功");
    return true;
  } catch (error: any) {
    console.error("❌ 訊息回覆失敗:", error);
    return false;
  }
}

/**
 * 取得單一帳號昨日排名
 */
export async function getYesterdayRanking(
  userId: string
): Promise<{ ranking: number }> {
  try {
    const yesterdayDate = getYesterdayDate();
    const userDataSnapshot = await db
      .ref(`users/${userId}/data/${yesterdayDate}`)
      .get();

    if (userDataSnapshot.exists()) {
      const data = userDataSnapshot.val();
      if (data && data.finish && typeof data.ranking === "number") {
        console.log(`✅ 用戶 ${userId} 昨日排名: ${data.ranking}`);
        return { ranking: data.ranking };
      }
    }

    console.log(`ℹ️ 用戶 ${userId} 昨日未完成或無排名記錄`);
    return { ranking: 0 };
  } catch (error) {
    console.error("❌ 取得昨日排名失敗:", error);
    return { ranking: 0 };
  }
}

/**
 * 計算當前完成人數的排名
 */
const calculateCurrentRanking = async (): Promise<number> => {
  try {
    const todayDate = getTodayDate();
    const usersSnapshot = await db.ref("users").get();

    if (!usersSnapshot.exists()) {
      return 1; // 如果沒有用戶，這是第一名
    }

    const users = usersSnapshot.val();
    let finishedCount = 0;

    // 遍歷所有用戶，檢查今天已完成的人數
    for (const userId in users) {
      if (Object.prototype.hasOwnProperty.call(users, userId)) {
        const userData = users[userId];
        if (
          userData.data &&
          userData.data[todayDate] &&
          userData.data[todayDate].finish
        ) {
          finishedCount++;
        }
      }
    }

    return finishedCount + 1; // 當前用戶的排名是已完成人數 + 1
  } catch (error) {
    console.error("❌ 計算排名失敗:", error);
    return 1; // 發生錯誤時返回第一名
  }
};

/**
 * 寫入今日運動紀錄
 */
export async function writeRecord(
  userId: string
): Promise<{ success: boolean; ranking: number; isFirstTimeToday: boolean }> {
  try {
    const todayDate = getTodayDate();
    const userRecordRef = db.ref(`users/${userId}/data/${todayDate}`);

    // 檢查今日是否已有記錄
    const existingSnapshot = await userRecordRef.get();
    if (existingSnapshot.exists()) {
      const existingData = existingSnapshot.val();
      if (existingData.finish) {
        console.log(
          `ℹ️ 用戶 ${userId} 今日已完成記錄，排名: ${existingData.ranking}`
        );
        return {
          success: true,
          ranking: existingData.ranking,
          isFirstTimeToday: false,
        };
      }
    }

    // 計算當前排名
    const ranking = await calculateCurrentRanking();

    const recordData = {
      finish: true,
      ranking: ranking,
      timestamp: new Date().toISOString(),
    };

    await userRecordRef.set(recordData);
    console.log(`✅ 用戶 ${userId} 今日運動記錄已寫入，排名: ${ranking}`);

    return { success: true, ranking, isFirstTimeToday: true };
  } catch (error) {
    console.error("❌ 寫入今日運動記錄失敗:", error);
    return { success: false, ranking: 0, isFirstTimeToday: false };
  }
}

/**
 * 獲取今日所有用戶的運動記錄
 */
export async function getTodayAllUsersRecord(): Promise<
  Array<{
    userId: string;
    displayName: string;
    hasFinished: boolean;
    finishTime?: string;
    ranking?: number;
  }>
> {
  try {
    const todayDate = getTodayDate();
    const usersSnapshot = await db.ref("users").get();

    const usersRecord: Array<{
      userId: string;
      displayName: string;
      hasFinished: boolean;
      finishTime?: string;
      ranking?: number;
    }> = [];

    if (!usersSnapshot.exists()) {
      return [];
    }

    const users = usersSnapshot.val();
    for (const userId in users) {
      if (Object.prototype.hasOwnProperty.call(users, userId)) {
        const userData = users[userId];

        // 只處理活躍用戶
        if (!userData.isActive) {
          continue;
        }

        const displayName = userData.displayName || "未設定";

        // 檢查今日是否已完成
        if (
          userData.data &&
          userData.data[todayDate] &&
          userData.data[todayDate].finish
        ) {
          // 已完成運動
          const recordData = userData.data[todayDate];
          const finishTime = getFormattedTime(
            recordData.timestamp || new Date().toISOString()
          );

          usersRecord.push({
            userId: userId,
            displayName: displayName,
            hasFinished: true,
            finishTime: finishTime,
            ranking: recordData.ranking || 0,
          });
        } else {
          // 未完成運動
          usersRecord.push({
            userId: userId,
            displayName: displayName,
            hasFinished: false,
          });
        }
      }
    }

    // 按排名排序（已完成的在前，未完成的在後）
    usersRecord.sort((a, b) => {
      if (a.hasFinished && !b.hasFinished) return -1;
      if (!a.hasFinished && b.hasFinished) return 1;
      if (a.hasFinished && b.hasFinished) {
        return (a.ranking || 0) - (b.ranking || 0);
      }
      return a.displayName.localeCompare(b.displayName);
    });

    console.log(`✅ 獲取今日所有用戶運動記錄，共 ${usersRecord.length} 位用戶`);
    return usersRecord;
  } catch (error) {
    console.error("❌ 獲取今日用戶運動記錄失敗:", error);
    return [];
  }
}

/**
 * 格式化時間為上午/下午幾點（台灣時區）
 */
export const getFormattedTime = (
  isoString: string,
  language: string = "zh-TW"
): string => {
  try {
    const date = new Date(isoString);
    const taiwanTime = date.toLocaleString(language, {
      timeZone: "Asia/Taipei",
      hour: "numeric",
      hour12: true,
    });
    const japanTime = date.toLocaleString(language, {
      timeZone: "Asia/Tokyo",
      hour: "numeric",
      hour12: true,
    });
    if (language === "ja-JP") {
      return japanTime;
    }
    return taiwanTime.replace("時", "點");
  } catch (error) {
    console.error("❌ 時間格式化失敗:", error);
    return "時間未知";
  }
};

/**
 * 獲取所有今日未完成運動的活躍用戶
 */
export async function getUnfinishedUsers(): Promise<
  Array<{ userId: string; displayName: string }>
> {
  try {
    const todayDate = getTodayDate();
    const usersSnapshot = await db.ref("users").get();

    if (!usersSnapshot.exists()) {
      return [];
    }

    const users = usersSnapshot.val();
    const unfinishedUsers: Array<{ userId: string; displayName: string }> = [];
    for (const userId in users) {
      if (Object.prototype.hasOwnProperty.call(users, userId)) {
        const userData = users[userId];

        // 檢查用戶是否活躍
        if (!userData.isActive) {
          continue;
        }

        // 檢查今日是否已完成
        const hasFinishedToday =
          userData.data &&
          userData.data[todayDate] &&
          userData.data[todayDate].finish;

        if (!hasFinishedToday) {
          unfinishedUsers.push({
            userId: userId,
            displayName: userData.displayName || "未設定",
          });
        }
      }
    }

    console.log(`✅ 找到 ${unfinishedUsers.length} 位今日未完成運動的用戶`);
    return unfinishedUsers;
  } catch (error) {
    console.error("❌ 獲取未完成用戶列表失敗:", error);
    return [];
  }
}

/**
 * 批量推送提醒訊息給未完成運動的用戶
 */
export async function sendRemindersToUnfinishedUsers(
  finishedUserDisplayName: string,
  accessToken: string,
  secret: string
): Promise<{ success: boolean; sentCount: number }> {
  try {
    const unfinishedUsers = await getUnfinishedUsers();

    if (unfinishedUsers.length === 0) {
      console.log("ℹ️ 沒有需要提醒的用戶");
      return { success: true, sentCount: 0 };
    }

    let sentCount = 0;
    const lineClient = new Client({
      channelAccessToken: accessToken,
      channelSecret: secret,
    });

    // 批量發送提醒
    for (const user of unfinishedUsers) {
      try {
        // 獲取每個用戶的語言偏好
        const userLanguage = await getUserLanguage(user.userId);
        const reminderMessage = createReminderMessage(
          finishedUserDisplayName,
          userLanguage
        );
        await lineClient.pushMessage(user.userId, reminderMessage);
        sentCount++;
        console.log(
          `✅ 提醒訊息已發送給 ${user.displayName} (${user.userId}) 語言: ${userLanguage}`
        );
      } catch (error) {
        console.error(
          `❌ 發送提醒訊息失敗給 ${user.displayName} (${user.userId}):`,
          error
        );
      }
    }

    console.log(
      `✅ 提醒訊息發送完成，成功發送 ${sentCount}/${unfinishedUsers.length} 則訊息`
    );
    return { success: true, sentCount };
  } catch (error) {
    console.error("❌ 批量發送提醒訊息失敗:", error);
    return { success: false, sentCount: 0 };
  }
}
