export type SoulmateCategory = "spouse" | "boss" | "colleague" | "friend";

interface SoulmateProfile {
  category: string;
  icon: string;
  traits: string[];
  zodiacs: string[];
  months: string[];
  analysis: string;
}

const CATEGORY_META: Record<SoulmateCategory, { label: string; icon: string }> = {
  spouse: { label: "命定伴侶磁場", icon: "♾" },
  boss:   { label: "事業貴人上司", icon: "⚡" },
  colleague: { label: "職場同事磁場", icon: "◈" },
  friend: { label: "靈魂友人圈", icon: "✧" },
};

const PROFILES: Record<SoulmateCategory, SoulmateProfile[]> = {
  spouse: [
    {
      category: "命定伴侶",
      icon: "♾",
      traits: ["靈魂深度共鳴", "不言而喻的默契", "共建安全避風港"],
      zodiacs: ["巨蟹座", "天蠍座", "金牛座"],
      months: ["5月", "7月", "11月"],
      analysis: "{{NAME}} 的命定伴侶擁有強烈的水元素特質——他們以情感深度取勝，善於在看似普通的日常中製造令你銘記終身的溫柔時刻。在第一次深夜長談中，{{NAME}} 將感受到一種「前世見過」的熟悉感，那便是宇宙對位的信號。此人的出現往往伴隨著某種「意外」的相遇場景，而非刻意安排的約會設定。"
    },
    {
      category: "命定伴侶",
      icon: "♾",
      traits: ["穩定中的驚喜感", "欣賞你的獨特性", "共同成長的意願"],
      zodiacs: ["天秤座", "雙魚座", "射手座"],
      months: ["3月", "9月", "12月"],
      analysis: "{{NAME}} 的靈魂在等待一個既能給予空間、又能在你需要時牢牢守護的伴侶。這個人最顯著的特徵是：他們從不試圖改變 {{NAME}} 的本質，而是用真誠的好奇心去欣賞你所有不被他人理解的稜角。相遇的地點往往與藝術、音樂或某種跨文化的場景有關。"
    }
  ],
  boss: [
    {
      category: "事業貴人上司",
      icon: "⚡",
      traits: ["眼光獨到的伯樂", "願意授權與信任", "資源賦能型領導"],
      zodiacs: ["獅子座", "射手座", "牡羊座"],
      months: ["4月", "8月", "12月"],
      analysis: "{{NAME}} 命中最強的事業貴人，是那種在你還未完全準備好之前就已看見你潛力的獨具慧眼之人。他們的領導風格傾向於「放手讓 {{NAME}} 試飛」，而非過度管控。這位貴人往往在工作場合以外的非正式情境中對 {{NAME}} 留下最深刻的印象，因此私下的品格修煉與真實狀態，往往是打開這道貴人之門的真正密碼。"
    },
    {
      category: "事業貴人上司",
      icon: "⚡",
      traits: ["系統思維", "敢於打破慣例", "對 {{NAME}} 的才能極度認可"],
      zodiacs: ["魔羯座", "天蠍座", "水瓶座"],
      months: ["1月", "6月", "10月"],
      analysis: "{{NAME}} 的貴人上司往往是業界中帶有顛覆性思維的改革者。他們辨識 {{NAME}} 才能的方式，是透過觀察你在壓力下的應對反應，而非你展示出來的成績單。{{NAME}} 在這段關係中最需要做的，是敢於說出自己的想法與直覺，即便那與大眾意見相左——因為這正是貴人對 {{NAME}} 最期待的特質。"
    }
  ],
  colleague: [
    {
      category: "最佳職場夥伴",
      icon: "◈",
      traits: ["執行力完美互補", "情緒穩定的錨點", "幽默感化解壓力"],
      zodiacs: ["魔羯座", "處女座", "天秤座"],
      months: ["1月", "9月", "10月"],
      analysis: "{{NAME}} 在職場中最能激發潛能的同事類型，是那種「你負責創意發散，他們負責落地執行」的完美互補組合。這位夥伴的存在感不強烈但不可或缺，他們習慣用行動代替言語，且從不在背後爭功。當 {{NAME}} 感到能量耗竭時，這類夥伴往往只需一句話或一個眼神，就能讓你重新充電並找回方向感。"
    },
    {
      category: "最佳職場夥伴",
      icon: "◈",
      traits: ["快速建立信任感", "共同願景導向", "互相保護的默契"],
      zodiacs: ["雙子座", "牡羊座", "射手座"],
      months: ["2月", "5月", "11月"],
      analysis: "{{NAME}} 的理想職場夥伴帶有強烈的行動力與冒險氣息。他們對 {{NAME}} 的信任是快速且直覺式的——不需要長時間的考驗期，而是在第一次共同面對挑戰時便迅速建立起深厚的戰友情誼。這段職場關係的最大價值，在於雙方都願意為對方說出那些「別人不敢說的真相」，這種坦誠正是 {{NAME}} 職業突破的最強催化劑。"
    }
  ],
  friend: [
    {
      category: "靈魂友人",
      icon: "✧",
      traits: ["無條件的接納", "靈感持續碰撞", "快樂永不枯竭的源泉"],
      zodiacs: ["雙魚座", "射手座", "雙子座"],
      months: ["3月", "6月", "12月"],
      analysis: "{{NAME}} 最珍貴的靈魂友人，是那種讓你可以完全卸下所有社交面具的存在。在他們面前，{{NAME}} 不需要有趣、不需要成功、不需要表現——你只需要做你自己，就已經足夠。這類友誼往往在一個意想不到的場合裡以「笑話」或「共同鄙視某件事」為開端，然後在歲月中沉澱出純金般的份量。{{NAME}} 的生命中至多出現兩到三個這樣的靈魂，請用心珍惜。"
    },
    {
      category: "靈魂友人",
      icon: "✧",
      traits: ["思想的激盪者", "你成長的見證者", "危機時的堅定後盾"],
      zodiacs: ["水瓶座", "天蠍座", "牡羊座"],
      months: ["1月", "8月", "10月"],
      analysis: "{{NAME}} 的另一種靈魂友人類型，是那些以「挑戰 {{NAME}} 的舒適圈」為愛的表達方式的人。他們不會讓你長期停留在自我感覺良好的泡泡中，而是以近乎不留情面的誠實提醒你還有多少潛能未被開發。與這類友人的關係，需要 {{NAME}} 具備足夠的心理安全感，因為真正的鑽石友誼，往往帶著一些摩擦的溫度。"
    }
  ]
};

export function getSoulmateProfile(month: number, day: number, category: SoulmateCategory): SoulmateProfile {
  const profiles = PROFILES[category];
  const idx = (month + day) % profiles.length;
  return profiles[idx];
}

export function getSoulmateCategories() {
  return (Object.keys(CATEGORY_META) as SoulmateCategory[]).map((key) => ({
    key,
    ...CATEGORY_META[key],
  }));
}

export function getSoulmateProfiles(month: number, day: number) {
  const seed = (month + day) % 5;
  const profiles = [
    { category: "配偶", traits: ["深層安全感", "不言而喻的默契", "共建避風港"], zodiacs: ["巨蟹座", "天蠍座", "金牛座"], months: ["5月", "7月", "11月"] },
    { category: "同事", traits: ["執行力互補", "目標導向", "情緒穩定"], zodiacs: ["魔羯座", "處女座", "天秤座"], months: ["1月", "9月", "10月"] },
    { category: "上司", traits: ["資源賦能", "視野開闊", "權威但不專制"], zodiacs: ["獅子座", "射手座", "牡羊座"], months: ["4月", "8月", "12月"] },
    { category: "創業夥伴", traits: ["風險對沖", "創新思維", "抗壓性強"], zodiacs: ["水瓶座", "雙子座", "天蠍座"], months: ["2月", "6月", "11月"] },
    { category: "朋友", traits: ["無條件接納", "靈感碰撞", "快樂泉源"], zodiacs: ["雙魚座", "射手座", "雙子座"], months: ["3月", "6月", "12月"] }
  ];
  return [...profiles.slice(seed), ...profiles.slice(0, seed)].map((p, i) => ({ ...p, category: profiles[i].category }));
}
