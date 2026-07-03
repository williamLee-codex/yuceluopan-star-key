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
          "重要合約與電子文檔請務必備份並再三確認細節。",
          "溝通容易產生誤亂，對話時請保持耐心並重複確認對方意圖。",
          "舊人舊事可能逆襲而來，這是清理業力的好時機，無需慌張。"
        ]
      };
    }
  }

  return {
    isRetrograde: false,
    statusLabel: "水星順行中",
    tips: [
      "思維軌跡清晰，是推動新計畫與展開重要談判的絕佳窗口。",
      "資訊傳遞暢通，不妨多進行深度交流或學習新知。",
      "星辰能量穩定，適合做長遠的決策與資源佈局。"
    ]
  };
}
