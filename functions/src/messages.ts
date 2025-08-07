import { Message } from "@line/bot-sdk";

/**
 * 生成歡迎訊息
 */
export function createGeneralMessage(displayName?: string): Message {
  return {
    type: "text",
    text: `🎉 ${
      displayName || ""
    }你好！！\n\n大家一起來運動⛷️\n\n每天回報你的運動情況吧👟\n\n請輸入「完成」來記錄今日運動💪\n請輸入「排名」來看看今天大家運動了沒😏\n\n`,
  };
}

/**
 * 生成運動完成回覆訊息
 */
export function createRecordReply(
  hasYesterdayRecord: boolean,
  rankingYesterday: number,
  rankingToday: number
): Message {
  return {
    type: "text",
    text: `運動辛苦了🎊💓${
      hasYesterdayRecord ? `\n\n昨天你是第${rankingYesterday}名！` : ""
    }\n\n今天你是第${rankingToday}名！`,
  };
}

/**
 * 發出提醒運動訊息
 */
export function createReminderMessage(displayName: string): Message {
  return {
    type: "text",
    text: `${displayName}已經運動完囉！！\n你今天什麼時候才要運動🥺`,
  };
}

/**
 * 生成今日排名查詢回覆訊息
 */
export function createRankingReply(
  usersRecord: Array<{
    userId: string;
    displayName: string;
    hasFinished: boolean;
    finishTime?: string;
    ranking?: number;
  }>
): Message {
  if (usersRecord.length === 0) {
    return {
      type: "text",
      text: "目前沒有其他用戶耶...🤔",
    };
  }

  let messageText = "📊 今日運動排名：\n\n";

  // 已完成的用戶
  const finishedUsers = usersRecord.filter((user) => user.hasFinished);
  const unfinishedUsers = usersRecord.filter((user) => !user.hasFinished);

  if (finishedUsers.length > 0) {
    finishedUsers.forEach((user) => {
      let icon = "🔺";
      if (user.ranking && user.ranking === 1) {
        icon = "🥇";
      } else if (user.ranking && user.ranking === 2) {
        icon = "🥈";
      } else if (user.ranking && user.ranking === 3) {
        icon = "🥉";
      }
      messageText += `${icon}${user.displayName}: 第${user.ranking}名 (${user.finishTime}完成)\n`;
    });
  }

  if (unfinishedUsers.length > 0) {
    if (finishedUsers.length > 0) {
      messageText += "\n";
    }
    unfinishedUsers.forEach((user) => {
      messageText += `${user.displayName}: 今天還沒運動唷🫠\n`;
    });
  }

  return {
    type: "text",
    text: messageText.trim(),
  };
}
