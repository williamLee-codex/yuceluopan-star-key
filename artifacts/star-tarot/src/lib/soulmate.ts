export function getSoulmateProfiles(month: number, day: number) {
  const seed = (month + day) % 5;
  const profiles = [
    {
      category: "配偶",
      traits: ["深層安全感", "不言而喻的默契", "共建避風港"],
      zodiacs: ["巨蟹座", "天蠍座", "金牛座"],
      months: ["5月", "7月", "11月"]
    },
    {
      category: "同事",
      traits: ["執行力互補", "目標導向", "情緒穩定"],
      zodiacs: ["魔羯座", "處女座", "天秤座"],
      months: ["1月", "9月", "10月"]
    },
    {
      category: "上司",
      traits: ["資源賦能", "視野開闊", "權威但不專制"],
      zodiacs: ["獅子座", "射手座", "牡羊座"],
      months: ["4月", "8月", "12月"]
    },
    {
      category: "創業夥伴",
      traits: ["風險對沖", "創新思維", "抗壓性強"],
      zodiacs: ["水瓶座", "雙子座", "天蠍座"],
      months: ["2月", "6月", "11月"]
    },
    {
      category: "朋友",
      traits: ["無條件接納", "靈感碰撞", "快樂泉源"],
      zodiacs: ["雙魚座", "射手座", "雙子座"],
      months: ["3月", "6月", "12月"]
    }
  ];

  // Rotate based on seed
  return [
    ...profiles.slice(seed),
    ...profiles.slice(0, seed)
  ].map((p, i) => ({ ...p, category: profiles[i].category })); // keep categories in order
}
