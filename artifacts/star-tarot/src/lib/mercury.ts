export function getMercuryRetrogradeStatus() {
  const now = new Date();
  
  const periods = [
    { start: new Date("2024-04-01"), end: new Date("2024-04-25") },
    { start: new Date("2024-08-05"), end: new Date("2024-08-28") },
    { start: new Date("2024-11-26"), end: new Date("2024-12-15") },
    { start: new Date("2025-03-15"), end: new Date("2025-04-07") },
    { start: new Date("2025-07-18"), end: new Date("2025-08-11") },
    { start: new Date("2025-11-09"), end: new Date("2025-11-29") },
    { start: new Date("2026-02-26"), end: new Date("2026-03-20") },
    { start: new Date("2026-07-01"), end: new Date("2026-07-24") },
    { start: new Date("2026-10-23"), end: new Date("2026-11-12") }
  ];

  for (const period of periods) {
    if (now >= period.start && now <= period.end) {
      return {
        isRetrograde: true,
        statusLabel: "水星逆行中",
        tips: [
          "重要文件先備份，寄出或簽署前再確認內容與日期。",
          "談重要事情時，把意思說清楚，也確認對方是否理解。",
          "舊問題再次出現時，先了解發生了什麼，再決定要不要處理。"
        ]
      };
    }
  }

  return {
    isRetrograde: false,
    statusLabel: "水星順行中",
    tips: [
      "安排新計畫時，先確認時間、費用與需要準備的事情。",
      "想學新事物，可以從一個小目標開始，再看看是否適合自己。",
      "做長期決定前，整理已知資訊，也替不確定的部分留一些餘裕。"
    ]
  };
}
