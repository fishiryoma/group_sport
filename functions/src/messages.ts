import { Message } from "@line/bot-sdk";

/**
 * 生成歡迎訊息
 */
export function createGeneralMessage(
  displayName?: string,
  language: string = "zh-TW"
): Message {
  const messages = {
    "zh-TW": `${
      displayName || ""
    }你好！！\n\n大家一起來運動⛷️\n\n每天回報你的運動情況吧👟\n\n請輸入「完成」來記錄今日運動💪\n請輸入「排名」來看看今天大家運動了沒😏\n\n語言切換：\n輸入「日本語」或「JP」切換日文\n輸入「中文」或「TW」切換中文`,
    "ja-JP": `${
      displayName || ""
    }こんにちは！！\n\n一緒に運動しましょう⛷️\n\n運動したあと、みんなに報告しましょう👟\n\n「完了」と入力して記録しましょう💪\n「ランキング」と入力してみんなの調子を確認😏\n\n言語切替：\n「日本語」または「JP」で日本語\n「中文」または「TW」で中国語`,
  };

  return {
    type: "text",
    text: messages[language as keyof typeof messages] || messages["zh-TW"],
  };
}

/**
 * 生成運動完成回覆訊息
 */
export function createRecordReply(
  hasYesterdayRecord: boolean,
  rankingYesterday: number,
  rankingToday: number,
  language: string = "zh-TW"
): Message {
  const messages = {
    "zh-TW": `運動辛苦了🎊💓${
      hasYesterdayRecord ? `\n\n昨天你是第${rankingYesterday}名！` : ""
    }\n\n今天你是第${rankingToday}名！好棒好棒！`,
    "ja-JP": `お疲れさまでした🎊💓${
      hasYesterdayRecord ? `\n\n昨日は${rankingYesterday}位でした！` : ""
    }\n\n今日は${rankingToday}位です！素晴らしい！`,
  };
  return {
    type: "text",
    text: messages[language as keyof typeof messages] || messages["zh-TW"],
  };
}

/**
 * 發出提醒運動訊息
 */
export function createReminderMessage(
  displayName: string,
  language: string = "zh-TW"
): Message {
  const messages = {
    "zh-TW": `${displayName}已經運動完囉！！\n你今天什麼時候才要運動🥺`,
    "ja-JP": `${displayName}もう運動したよ！！\nきみは...?やらないの🥺`,
  };
  return {
    type: "text",
    text: messages[language as keyof typeof messages] || messages["zh-TW"],
  };
}

/**
 * 生成語言切換成功訊息
 */
export function createLanguageChangeMessage(language: string): Message {
  const messages = {
    "zh-TW": "✅ 語言已切換為中文",
    "ja-JP": "✅ 言語が日本語に切り替わりました",
  };

  return {
    type: "text",
    text: messages[language as keyof typeof messages] || messages["zh-TW"],
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
  }>,
  language: string = "zh-TW"
): Message {
  const noUserMessage = {
    "zh-TW": "目前沒有其他用戶耶...🤔",
    "ja-JP": "まだ他のユーザーがいないです...🤔",
  };
  if (usersRecord.length === 0) {
    return {
      type: "text",
      text:
        noUserMessage[language as keyof typeof noUserMessage] ||
        noUserMessage["zh-TW"],
    };
  }

  const messageText = {
    "zh-TW": "📊 今日運動排名：\n",
    "ja-JP": "📊 今日のランキング：\n",
  };

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
      const rankingMessage = {
        "zh-TW": `\n${icon}${user.displayName}: 第${user.ranking}名 (${user.finishTime}完成)`,
        "ja-JP": `\n${icon}${user.displayName}: 第${user.ranking}位 (${user.finishTime}完成)`,
      };
      messageText[language as keyof typeof messageText] +=
        rankingMessage[language as keyof typeof rankingMessage];
    });
  }

  if (unfinishedUsers.length > 0) {
    if (finishedUsers.length > 0) {
      messageText[language as keyof typeof messageText] += "\n";
    }
    unfinishedUsers.forEach((user) => {
      const unfinishedMessage = {
        "zh-TW": `\n${user.displayName}: 今天還沒運動唷🫠`,
        "ja-JP": `\n${user.displayName}: 今日まだ運動していません🫠`,
      };
      messageText[language as keyof typeof messageText] +=
        unfinishedMessage[language as keyof typeof unfinishedMessage];
    });
  }

  return {
    type: "text",
    text: messageText[language as keyof typeof messageText],
  };
}
