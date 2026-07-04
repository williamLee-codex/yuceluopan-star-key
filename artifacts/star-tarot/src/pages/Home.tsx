import React, { useState, useCallback, useRef, useEffect, ReactNode, Component } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";
import type { BirthdayValue } from "@/components/BirthdayWheels";
import { TopupModal } from "@/components/TopupModal";
import { usePoints } from "@/contexts/PointsContext";
import { useNickname } from "@/contexts/NicknameContext";
import { useToast } from "@/hooks/use-toast";
import { getBirthdayProfile, getTripleSignProfile, getBirthdayDestinyReport } from "@/lib/astrology";
import { getPlanetDeconstruction } from "@/lib/planets";
import { getMonthlyForecast, getYearlyOverview, getCareerForecast, getLoveForecast, getWealthForecast } from "@/lib/forecast";
import { getSoulmateProfile, getSoulmateCategories, type SoulmateCategory } from "@/lib/soulmate";
import { getCompatibility } from "@/lib/compatibility";
import { getMercuryRetrogradeStatus } from "@/lib/mercury";

/* ─── localStorage helpers ──────────────────────────────────────── */
const LS_UNLOCK_RECORDS = "starTarot_unlockedRecords";
const LS_PROFILE_INDEX  = "starTarot_profileIndex";

function buildUserKey(nick: string, bd: BirthdayValue): string {
  return `${nick}_${bd.year}_${bd.month}_${bd.day}_${bd.hour}_${bd.minute}`;
}

function loadUnlockedModulesForKey(userKey: string): Record<string, boolean> {
  try {
    const records = JSON.parse(localStorage.getItem(LS_UNLOCK_RECORDS) || "{}") as Record<string, Record<string, boolean>>;
    const result: Record<string, boolean> = {};
    for (const mKey of Object.keys(records)) {
      if (records[mKey]?.[userKey]) result[mKey] = true;
    }
    return result;
  } catch { return {}; }
}

function saveUnlockRecord(moduleKey: string, userKey: string): void {
  try {
    const records = JSON.parse(localStorage.getItem(LS_UNLOCK_RECORDS) || "{}") as Record<string, Record<string, boolean>>;
    if (!records[moduleKey]) records[moduleKey] = {};
    records[moduleKey][userKey] = true;
    localStorage.setItem(LS_UNLOCK_RECORDS, JSON.stringify(records));
  } catch {}
}

type ProfileEntry = { year: number; month: number; day: number; hour: number; minute: number; isUnknownTime: boolean };

function getProfileIndex(): Record<string, ProfileEntry> {
  try { return JSON.parse(localStorage.getItem(LS_PROFILE_INDEX) || "{}"); } catch { return {}; }
}

function saveProfileEntry(nick: string, bd: BirthdayValue, isUnknownTime: boolean): void {
  try {
    const idx = getProfileIndex();
    idx[nick] = { year: bd.year, month: bd.month, day: bd.day, hour: bd.hour, minute: bd.minute, isUnknownTime };
    localStorage.setItem(LS_PROFILE_INDEX, JSON.stringify(idx));
  } catch {}
}

/* ─── Pricing ──────────────────────────────────────────────────── */
const starTarotPricing = {
  astroTriangleRatio: 6,
  tarotDivination: 6,
  allFivePlanets: 12,
  yearlyTotalDestiny: 10,
  birthdayDestiny: 2,
  friendCompatibility: 10,
  spouseMatch: 4,
  bossMatch: 4,
  colleagueMatch: 4,
  friendMatch: 4,
} as const;
type PricingKey = keyof typeof starTarotPricing;

/* ─── Tabs ──────────────────────────────────────────────────────── */
type TabId = "tianguo" | "tarot" | "shikong" | "resonance" | "birthday";
const TABS: { id: TabId; label: string; glyph: string }[] = [
  { id: "tianguo",   label: "星穹天機", glyph: "✦" },
  { id: "tarot",     label: "量子塔羅", glyph: "🔮" },
  { id: "shikong",   label: "時空流轉", glyph: "◎" },
  { id: "resonance", label: "量子共鳴", glyph: "⟡" },
  { id: "birthday",  label: "天命生日", glyph: "🎂" },
];
const SOULMATE_PRICING_KEYS: Record<string, PricingKey> = {
  spouse: "spouseMatch", boss: "bossMatch", colleague: "colleagueMatch", friend: "friendMatch",
};

const SOULMATE_LABELS: Record<string, string> = {
  spouse: "天命配偶歸宿", boss: "提攜貴人上司", colleague: "專案執行同事", friend: "解壓傾聽朋友",
};

/* ─── Major Arcana Database (22 cards, 200+ words each) ─────────── */
interface TarotCard {
  id: number; name: string; enName: string; emoji: string;
  essence: string; blindspot: string; breakthrough: string;
}
const MAJOR_ARCANA: TarotCard[] = [
  {
    id: 0, name: "愚者", enName: "The Fool", emoji: "🌀",
    essence: "{{NAME}}，你抽到了「愚者」——宇宙中最純粹的起點能量。愚者站在懸崖邊緣，行囊輕盈，眼望天空，這不是無知，而是一種進化後的信任：他相信即便跨出那一步，宇宙也會在腳下安排好地面。這張牌告訴你，你正站在一個全新生命章節的邊緣。過去的一切——那些包袱、那些「失敗記錄」、那些讓你自我懷疑的眼光——都與這個新開始無關。宇宙正在邀請你以赤子之心出發，不帶評判、不帶恐懼，只帶著好奇與開放。",
    blindspot: "你的心理盲區在於「未準備好症候群」——你在等待一個完美的時機點，但那個時機點永遠不會自動出現。你對「失敗後無法回頭」的恐懼，比真正的風險本身更具破壞力。你在計算的那些「如果失敗了怎麼辦」，正在消耗你本可以用來出發的能量。愚者的智慧不是魯莽，而是對「剛剛好的準備」的接受——你已經比你認為的更準備好了。",
    breakthrough: "{{NAME}}的宇宙破局建議：在接下來的七天內，做一件你一直告訴自己「等準備好了再做」的事。不需要完整的計畫，只需要第一步。宇宙的路，總是在你開始走之後才真正顯現。放下那個「等我想清楚了再說」的習慣，因為愚者最偉大的行動，往往發生在思考完成之前。讓這張牌成為你今天最重要的一個行動的起點。",
  },
  {
    id: 1, name: "魔術師", enName: "The Magician", emoji: "⚡",
    essence: "{{NAME}}，你抽到了「魔術師」——意志創造現實的終極象徵。魔術師站在祭壇前，一手指天，一手指地，他是「上界能量」流入「現實世界」的導管。他桌上擺著四種元素工具：聖杯（情感）、寶劍（思想）、星幣（物質）、權杖（意志）——代表他已經擁有創造任何想要的現實所需的一切資源。這張牌宣告：{{NAME}}，你現在就擁有你所需要的全部工具。問題從來不是「我有沒有能力」，而是「我是否選擇使用它」。你的意志力，此刻正處於一個少見的高頻狀態。",
    blindspot: "你的心理盲區在於「資源不足的幻象」——你一直在等待更多的錢、更多的時間、更多的認可、更多的支持，才能真正開始。但魔術師從不等待，因為他知道：工具永遠擺在桌上，真正缺席的從來都不是工具，而是那個決定「現在就開始」的意志宣言。你對「我還沒準備好」的執著，正在消耗比任何失敗都更多的你的能量。",
    breakthrough: "{{NAME}}的宇宙破局建議：今天，列出你已經擁有的三個「現成工具」——可以是某個技能、某段關係、某段未被充分使用的時間。然後問自己：如果我今天就用這三樣東西出發，最小化可行的第一步是什麼？魔術師的力量不在於等待更多，而在於深度使用已有的一切。你的魔法，在你決定使用它的那一刻就開始了。",
  },
  {
    id: 2, name: "女祭司", enName: "The High Priestess", emoji: "🌙",
    essence: "{{NAME}}，你抽到了「女祭司」——內在智慧最神秘的守護者。女祭司坐在兩根柱子之間的薄紗之後，她不說話，她聆聽。她代表一種超越邏輯的知識系統：直覺、夢境、潛意識的低語。這張牌出現，意味著你所有需要的答案，都已經存在於你的內在深處——問題是，你是否願意停下來聆聽它。外界的噪音太大，你的理性分析太過繁忙，以至於那個最深層的「你已經知道了」，被壓制在意識的最底層，從未被好好地聽見。",
    blindspot: "你的心理盲區在於「不相信自己的感覺」——你擁有驚人的直覺感知力，但你習慣在直覺浮現的那一刻，立刻召喚邏輯來「驗證」它、「修正」它，甚至「否定」它。你用「可能只是我的想象」和「也許我理解錯了」把最精準的靈性信號過濾掉了。女祭司提醒你：那個你第一個感覺到的答案，往往才是最正確的那個——後來的一切「理性分析」，很多時候只是在為你的恐懼找藉口。",
    breakthrough: "{{NAME}}的宇宙破局建議：在接下來的48小時內，有意識地記錄你的三個「第一直覺」——在做決定之前，在回覆任何信息之前，先閉眼三秒，感受你身體的第一個反應。那個反應，就是女祭司在對你說話。試著跟隨它一次，哪怕只是一次，看看結果如何。讓你的內在智慧，從今天開始有一個被聆聽的空間。",
  },
  {
    id: 3, name: "皇后", enName: "The Empress", emoji: "🌿",
    essence: "{{NAME}}，你抽到了「皇后」——豐盛、滋養與創造力的化身。皇后坐在繁花盛開的大自然中，她是大地之母，是生命力的具體形象。她代表一切豐盛的顯化：愛、美、財富、生育、藝術——一切形式的創造與成長。這張牌出現，是宇宙向你宣告：你正處於一個豐盛種子開始萌芽的時刻。那些你曾經付出過的愛與努力，那些你投入了卻好像沒有回報的善意，此刻正在以你從未預期的形式準備回流。皇后告訴你：你配得上豐盛，你不需要為此道歉。",
    blindspot: "你的心理盲區在於「豐盛恐懼症」——你害怕真的得到你想要的，因為你深層的信念告訴你「好景不長」或「我不值得這麼好的事」。這個信念讓你在豐盛到來的門口，本能地退縮或破壞它，因為等待它消失的焦慮，比享受它的喜悅更熟悉。皇后的最深功課：允許自己接收，不要在好事發生的時候立刻問「但接下來怎麼辦」。",
    breakthrough: "{{NAME}}的宇宙破局建議：今天，為自己做一件純粹的「自我豐盛」儀式——可以是一頓精心準備的美食、一束讓你心動的花、一次不帶任何目的的創作。讓這個行動成為你向宇宙宣告「我接受豐盛」的具體信號。皇后的能量是吸引的，不是追逐的——當你讓自己成為豐盛的容器，豐盛自然向你流入。",
  },
  {
    id: 4, name: "皇帝", enName: "The Emperor", emoji: "🏛",
    essence: "{{NAME}}，你抽到了「皇帝」——結構、秩序與有形力量的象徵。皇帝端坐在石製寶座上，象徵他的權力不依賴情緒，而是建立在紀律、系統與清晰的邊界之上。這張牌出現，是宇宙告訴你：此刻需要的不是更多的感受與流動，而是更清晰的結構與行動框架。你的夢想需要一個可執行的計畫；你的關係需要更清晰的邊界；你的財務需要一個紀律性的管理系統。皇帝不是在限制你，他是在告訴你：真正的自由，建立在自我紀律的基礎上。",
    blindspot: "你的心理盲區在於對「軟性結構」的過度依賴——你習慣「靠感覺」行事，但在需要穩定輸出和長期積累的領域，感覺本身並不足夠。你有時把紀律和規則視為創造力的敵人，但皇帝告訴你：最偉大的藝術家和創業家，都有嚴格的個人紀律系統，正是這個系統，讓他們的靈感有了真正落地的可能。",
    breakthrough: "{{NAME}}的宇宙破局建議：今天，為你生命中最重要的一個領域，設立一條「皇帝規則」——一個你承諾每天都會執行的簡單行動，不依賴情緒，不依賴狀態，無論如何都做。可以小到只是「每天寫三行字」或「每天做五分鐘帳目」。皇帝的力量不在於一次的宏大行動，而在於每天不間斷的小小紀律，最終堆砌出難以撼動的王座。",
  },
  {
    id: 5, name: "教皇", enName: "The Hierophant", emoji: "🕍",
    essence: "{{NAME}}，你抽到了「教皇」——傳統、信仰體系與靈性指引的象徵。教皇坐在兩根柱子之間，頭頂三重冠，代表他同時掌握天、人、地三個維度的智慧橋樑。這張牌出現，可能有兩種不同的召喚：其一，是邀請你尋找一位真正的導師、一個有傳承的學習體系或一段更深的靈性探索；其二，是提醒你檢視那些你「自動遵守」的規則，看看哪些真的服務於你的成長，哪些只是未曾被質疑過的慣性。",
    blindspot: "你的心理盲區在於「規則的服從」或「規則的全盤拒絕」——這兩種極端都是對教皇能量的誤用。過度服從讓你失去了個人意志；全盤拒絕讓你失去了前人智慧的傳承。教皇最深的邀請，是選擇性地繼承：哪些傳統的智慧真的值得珍惜，哪些需要被重新定義——這個辨別力，是你此刻最需要修煉的能力。",
    breakthrough: "{{NAME}}的宇宙破局建議：今天，找出你生命中一個「我從來沒有質疑過，但其實說不出為什麼要這樣做」的規則或習慣，問問它：「你對我的成長還有效嗎？」如果答案是「沒有了」，給自己允許，讓它卸任。如果答案是「有的」，帶著更深的理解和感謝去執行它，而不只是慣性地跟隨。",
  },
  {
    id: 6, name: "戀人", enName: "The Lovers", emoji: "💫",
    essence: "{{NAME}}，你抽到了「戀人」——不只是浪漫的愛情牌，更是「選擇與價值觀對齊」的最深象徵。戀人牌中，兩個人站在天使的見證下，象徵一個由靈魂高我來見證的重要選擇時刻。這張牌的出現，意味著你面前有一個、甚至多個需要做出真實選擇的人生分叉口——可能是關係的選擇，可能是事業的選擇，可能是生活方式的選擇，但它們共同的特質是：這個選擇需要你誠實面對自己最深的價值觀，而不是讓恐懼或他人的期待替你做決定。",
    blindspot: "你的心理盲區在於「選擇恐懼」和「把選擇推遲等同於不選擇」——你害怕做出錯誤的選擇，於是讓兩個選項都懸而未決，但這種懸空狀態本身正在消耗你最寶貴的能量，讓你無法全力投入任何一個方向。戀人牌告訴你：沒有絕對正確的選擇，但有一個「與你的靈魂最對齊的選擇」。找到它，然後全力以赴，比任何「保留退路」都更有力量。",
    breakthrough: "{{NAME}}的宇宙破局建議：今天，把你目前最困擾你的一個選擇，簡化成這一個問題：「哪個選擇，是那個我最尊重的自己會做的？」不是最安全的，不是最讓別人滿意的，而是最讓你內心深處感到完整的。那個答案，你其實已經知道了。戀人牌要你做的只是：有勇氣讓那個答案被聽見。",
  },
  {
    id: 7, name: "戰車", enName: "The Chariot", emoji: "🏹",
    essence: "{{NAME}}，你抽到了「戰車」——意志、征服與在矛盾中前進的象徵。戰車由兩匹顏色相反的獅身人面像拉動，一黑一白，象徵勝利從來不是在「沒有矛盾」的狀態下實現的，而是在控制並駕馭內外在矛盾的能力中贏得的。戰車者不是因為路途平坦而勝利，而是因為他的意志力比任何障礙都更強大。這張牌出現，是宇宙告訴{{NAME}}：你的意志力此刻達到年度峰值，是啟動任何需要強大執行力的計畫的最佳時機。",
    blindspot: "你的心理盲區在於把「控制」與「力量」混淆——你有時試圖控制所有外在變數，以確保勝利，但真正的戰車者知道，你能控制的只有方向盤，而不是整條路。對「路況」的過度控制欲，反而讓你的行動力受到了自我設限。戰車的真正力量，是在不確定中保持前進的方向感，而不是等待所有不確定性消失後再出發。",
    breakthrough: "{{NAME}}的宇宙破局建議：確認你目前最想征服的一個目標，然後問自己：「我今天能為它做的一件最有力的事是什麼？」不是最完整的事，而是最有力的那一件。戰車者的勝利，積累於每一天最高意志力的定向輸出。今天，駕起你的戰車——方向，比速度更重要。",
  },
  {
    id: 8, name: "力量", enName: "Strength", emoji: "🦁",
    essence: "{{NAME}}，你抽到了「力量」——不是蠻力，而是以溫柔馴服一切的深層意志象徵。力量牌的圖像是一個女性以溫柔的雙手輕撫一頭獅子，獅子俯首。這告訴你：真正的力量不是壓制，不是對抗，而是帶著無懼的愛去觸碰最兇猛的部分——包括你自己內在最原始的恐懼、怒火與衝動——並讓它們在你的接納中，慢慢轉化為服務你的能量。",
    blindspot: "你的心理盲區在於對「軟弱」的羞恥感——你把脆弱視為力量的反面，於是你用更強的自我要求、更高的標準來壓制那個渴望喘息的部分。但力量牌告訴你：承認「我今天很累」不是投降，承認「我需要支持」不是失敗——這些恰恰是真正強大者才敢說出口的誠實。你的獅子，需要的不是囚籠，而是理解。",
    breakthrough: "{{NAME}}的宇宙破局建議：今天，找出你內在最抗拒面對的一種情緒——可能是憤怒、嫉妒、或是說不清楚的悲傷——給它五分鐘，不試圖解決它，只是讓它存在，和它坐在一起。力量牌說：當你真正接納它，它就不再是需要被馴服的野獸，而會成為你最忠誠的力量來源。",
  },
  {
    id: 9, name: "隱士", enName: "The Hermit", emoji: "🕯",
    essence: "{{NAME}}，你抽到了「隱士」——向內尋光、以孤獨為修煉的靈性象徵。隱士獨自站在雪山之巔，手持一盞燈，那盞燈照亮的，不是外面的世界，而是他自己腳下的一步。這張牌出現，是宇宙最直接的邀請：你已經在外在世界奔忙了太久，此刻最需要的，是退回內在，找到那個在所有聲音之前就已存在的、安靜的「你」。這不是逃避，而是最深刻的自我收回。",
    blindspot: "你的心理盲區在於對「孤獨」的恐懼——你習慣用忙碌、社交或刺激來填滿那個讓你不安的空白，因為在那個靜止的空間裡，有些問題你還沒有準備好面對。但隱士告訴你：正是在那個你最想逃離的靜默中，你真正需要的答案一直在等你。",
    breakthrough: "{{NAME}}的宇宙破局建議：在接下來的一周內，每天安排30分鐘的「無屏幕靜默時間」——不是冥想，不是運動，只是存在。讓思緒自由流動，不試圖引導它。隱士的燈光，只在靜默中可見。你尋找的那個答案，已經在你心裡了——你只需要夠安靜，才能聽見它在說話。",
  },
  {
    id: 10, name: "命運之輪", enName: "Wheel of Fortune", emoji: "☸",
    essence: "{{NAME}}，你抽到了「命運之輪」——週期、轉機與宇宙大法則的象徵。命運之輪永恆地轉動，有人上升，有人下降，沒有任何狀態是永久的——痛苦不會是永久的，幸福也不會是永久的。這張牌的出現，意味著你正站在一個週期轉換的關鍵節點上：某個舊週期正在結束，某個新週期正在啟動。這不是偶然，而是宇宙精密計算下的精準安排。{{NAME}}，你現在感覺到的「什麼都在變」，是一個巨大機遇的前奏，不是混亂。",
    blindspot: "你的心理盲區在於試圖「阻止輪子轉動」——你對穩定的渴望讓你有時執著於讓某些「過期的現實」繼續存在，消耗大量能量去維持那些已經在自然衰退的東西。命運之輪告訴你：你的能量，用在適應與引導新週期上，遠比用在對抗自然轉化上更有效益。",
    breakthrough: "{{NAME}}的宇宙破局建議：今天，問自己「我生命中哪個週期正在結束？」——可能是一段關係的模式、一種工作方式或一個關於自己的舊信念。試著讓那個結束真正發生，不要用力按住輪子。然後問自己「新的輪子，我希望它把我帶向哪裡？」把那個答案，作為你今天最重要的意圖。",
  },
  {
    id: 11, name: "正義", enName: "Justice", emoji: "⚖",
    essence: "{{NAME}}，你抽到了「正義」——因果法則、公平與誠實面對現實的象徵。正義女神持劍坐於寶座，那把劍切除謊言，而她的天秤衡量真相。這張牌出現，是宇宙在問你一個直接的問題：在你目前最困擾你的那個情況裡，你願意誠實地看見「真相」嗎——包括那些你在其中的責任，以及那些你一直迴避承認的現實？正義牌不評判，它只揭示。",
    blindspot: "你的心理盲區在於「選擇性的誠實」——你能對別人的問題清晰分析，但對自己生命中最核心的幾個議題，你使用了一種巧妙的自我蒙蔽。正義牌讓你最不舒服的地方，往往就是你最需要直視的地方。那個讓你心跳加速的部分，不是因為它令人恐懼，而是因為你已經知道答案了——只是還沒有準備好讓那個答案被執行。",
    breakthrough: "{{NAME}}的宇宙破局建議：今天，選擇生命中一個你一直對自己使用「合理化」的情況，誠實地問：「如果一個我尊重的人看見了我的完整行為與選擇，他們會如何評價？」不是為了自我批評，而是為了看清楚，讓那個清晰的洞見，成為你下一個行動的校正儀。",
  },
  {
    id: 12, name: "倒吊人", enName: "The Hanged Man", emoji: "🔄",
    essence: "{{NAME}}，你抽到了「倒吊人」——以暫停換取頓悟的神聖象徵。倒吊人自願地以倒吊的姿勢停在樹上，他的臉是平靜的——因為他知道，這個反常的視角，正是他能看見平常看不見的真相的唯一方式。這張牌的出現，是宇宙最溫柔的一個命令：停下來。不是永遠停下來，而是讓自己進入一段刻意的暫停期——暫停急於解決、暫停急於行動、暫停急於讓一切恢復正常。在那個暫停裡，正是最深刻的洞見等待著你。",
    blindspot: "你的心理盲區在於「無法允許自己停下來」——你把停頓等同於停滯，把暫停等同於失敗。但倒吊人最深的秘密是：有些清晰，只能在靜止中出現，任何急於解決的行動，反而會讓你一直在同一個循環中繞圈。你現在以為的「問題」，可能只是需要一個不同的視角——而那個視角，需要你先放慢速度才能獲得。",
    breakthrough: "{{NAME}}的宇宙破局建議：今天，給你目前最焦慮想解決的問題，一個「48小時暫停令」——在這48小時內，不採取任何關於它的行動，只是讓自己從不同的角度靜靜觀察它。你可能會在第二天醒來時，發現一個讓你拍額頭的答案，一直等在那裡，只等你停下來才能看見。",
  },
  {
    id: 13, name: "死神", enName: "Death", emoji: "🌑",
    essence: "{{NAME}}，你抽到了象徵絕對終結與新生的「死神牌」。這不是肉體死亡的預告，而是你靈魂深處某個舊體制、舊觀念正在加速腐朽。死神騎馬而來，他的旗幟上是玫瑰——終結的背後，永遠是新生的種子。這張牌出現，意味著你生命中有某個部分，已經用完了它的能量，正在等待你有勇氣讓它真正結束。你可能感覺到了那個「該結束了」的信號已經很久——也許是某段關係的模式、某種工作方式、某個關於自己的限制性信念——死神牌是宇宙的最後提醒：現在，是讓它真正終結的時候了。",
    blindspot: "你的心理盲區在於對「沉沒成本」的病態執著。你害怕放手後迎來虛無——那段你投入了大量時間的關係、那個讓你窒息但「好像還可以」的工作狀態、那個已經不再服務你的自我認知。你告訴自己「我已經為它付出了這麼多，怎麼能就這樣放棄」——但死神牌問你：在那個「不放棄」的堅持裡，你還剩下多少你自己？你的靈魂比你以為的更清楚：那個東西早就死了，你只是在為一具已經停止呼吸的東西繼續輸血。",
    breakthrough: "{{NAME}}的宇宙破局建議：你必須主動結束那段早已名存實亡的關係或消耗你的舊項目。今天，寫下你生命中一個「我知道它已經結束了，但我還沒有讓它結束」的東西，然後為它做一個小小的終結儀式——可以是燒掉一張紙、刪除一個聯繫、發出一封讓事情清晰的信。死神過後便是黎明，唯有親手埋葬過去，你真正的黃金主場才會顯化。那個你一直在等待的新生，正在死神旗幟的玫瑰後面等著你。",
  },
  {
    id: 14, name: "節制", enName: "Temperance", emoji: "🌊",
    essence: "{{NAME}}，你抽到了「節制」——整合、煉金與尋找中間路徑的宇宙智慧象徵。節制天使站在水邊，將水在兩個容器之間來回傾倒，這個動作代表的是一種精微的調和藝術：不是壓制任何一方，而是在兩個看似對立的力量之間找到流動的平衡。這張牌出現，是宇宙邀請你從二元的「非此即彼」思維，進化到一種更複雜、更成熟的整合視角。",
    blindspot: "你的心理盲區在於極端主義的傾向——你傾向在「全力衝刺」和「完全放棄」之間來回，在「完全給出」和「完全封閉」之間切換，很少停留在那個最有力的中間地帶。節制告訴你：那個你最想逃離的「適度」，正是你最需要建立的關係——因為持久的力量，從來不來自於短暫的爆炸，而來自於長期的穩定輸出。",
    breakthrough: "{{NAME}}的宇宙破局建議：在你目前最極端的某個生活習慣或思維模式上，試著刻意尋找一個「中間版本」。如果你一直是全力衝刺或完全休息，試試「70%的持續輸出」；如果你一直是全部給出或完全封閉，試試「有邊界的慷慨」。節制的魔法在於調和，不在於選邊站。",
  },
  {
    id: 15, name: "惡魔", enName: "The Devil", emoji: "⛓",
    essence: "{{NAME}}，你抽到了「惡魔」——覺醒、突破枷鎖與面對陰影的重要象徵。惡魔牌中，兩個人被鬆散的鎖鏈拴在惡魔的基座上——但鎖鏈很鬆，他們只需伸手就能脫開。這張牌最深刻的揭示是：你現在以為在禁錮你的那個「枷鎖」，很可能比你以為的更鬆——問題從來不是枷鎖有多緊，而是你是否相信自己可以走開。那個讓你困在某種模式中的，是你對它的定義，而不是它本身的力量。",
    blindspot: "你的心理盲區在於「受害者視角的舒適圈」——你有時因為保持在困境中而獲得某種隱性的利益：同情、逃避責任、或是不需要面對改變的不確定性。惡魔牌毫不留情地問你：如果你真的可以走，你真的想走嗎？那個最讓你說「我沒有辦法」的情況，其實有多少是「我選擇不改變」？這個誠實，是你破局的鑰匙。",
    breakthrough: "{{NAME}}的宇宙破局建議：今天，識別出一個你生命中「我知道它對我不好，但我還是繼續的」的行為或模式——不論是某種關係動態、消費習慣、還是思維循環。然後問自己：「我從這個模式中得到了什麼隱性的好處？」誠實地看見那個好處，是你真正開始鬆開那條鎖鏈的第一步。",
  },
  {
    id: 16, name: "高塔", enName: "The Tower", emoji: "⚡",
    essence: "{{NAME}}，你抽到了「高塔」——也許是塔羅中最令人震驚、卻最具解放潛力的一張牌。高塔被閃電擊中，塔頂的王冠墜落，人們從窗口跳出——但閃電是從天而來的，它所摧毀的，都是建立在虛假基礎上的東西。高塔出現，意味著你生命中某個你以為穩固的結構，正在或即將經歷一次真相的震動。這不是詛咒，而是宇宙最激烈的愛：它不讓你繼續住在一棟危樓裡，因為它知道那棟樓遲早會以更大的代價倒塌。",
    blindspot: "你的心理盲區在於把「穩定」等同於「真實」——你建造了很多看起來很穩固的東西，但有些是建立在恐懼上的、有些是建立在別人的期待上的、有些是建立在一個你早已知道是謊言的信念上的。高塔告訴你：越是試圖保護那個虛假的塔，閃電越終將到來。與其等待被擊中，不如主動問：「我現在依賴的，哪些是真正的地基，哪些是沙堆？」",
    breakthrough: "{{NAME}}的宇宙破局建議：高塔之後，最重要的不是重建，而是清掃。今天，做一件「主動清除」的事：一段需要結束的關係說清楚、一個假裝正常其實早已不正常的工作情況承認出來、一個你維持的假象讓它真相大白。讓閃電成為一個你選擇的解放，而不是被動承受的打擊——那才是高塔能量最高階的使用方式。",
  },
  {
    id: 17, name: "星星", enName: "The Star", emoji: "⭐",
    essence: "{{NAME}}，你抽到了「星星」——在黑暗中照亮前路的希望之光。星星牌中，一個女性跪在水邊，將水倒入大地與水中，象徵一種流動的給予——不汲取，只付出，而水卻源源不絕。這張牌出現在高塔之後，有著特別深刻的意義：黑暗已經過去，或即將過去，前方有真實的光——不是幻象，是真實的星光。這是宇宙在最直接地告訴你：繼續走，那個你一直在走向的，是真實存在的。",
    blindspot: "你的心理盲區在於對希望的不信任——你曾經太多次在期待中失望，所以你學會了把希望縮小，甚至主動在好事發生前先為失望做準備，以保護自己。但星星告訴你：那種「先失望」的保護機制，正在阻止你向宇宙發出清晰的信號。你的不信任，讓你的顯化能量出現了漏洞——宇宙接收到的，是你的懷疑，而不是你的渴望。",
    breakthrough: "{{NAME}}的宇宙破局建議：今天，做一件你「因為害怕失望而沒有全心期待」的事——讓自己完整地、不設防地渴望它。可以是在心裡對宇宙說：「我真的很想要這個，我值得這個，我準備好接受它了。」讓那份渴望完整地存在，不要立刻用「但萬一不成呢」來削弱它。星星的光，只照向那些敢於讓自己被照亮的人。",
  },
  {
    id: 18, name: "月亮", enName: "The Moon", emoji: "🌙",
    essence: "{{NAME}}，你抽到了「月亮」——幻象、直覺與潛意識深海的象徵。月亮用她的光照亮世界，但月光是反射的光，不是直接的光——她創造陰影，讓事物看起來與白天不同。月亮牌出現，意味著你現在的感知可能受到了情緒或潛意識幻象的過濾——你所「看見」的，可能並非全然是現實，而是你透過恐懼、期待或過去創傷的濾鏡所構建的現實。這不是要你不相信自己，而是要你更細緻地辨識：哪些是真實的，哪些是被恐懼染色的。",
    blindspot: "你的心理盲區在於「不確定性的焦慮」——月亮牌的能量讓你在模糊的狀況中感到特別不安，你的大腦會在缺乏信息的時候，自動填補最壞的可能性。這種「預期性焦慮」往往比真正的問題更具破壞力，它讓你在黑暗中為尚未發生的怪物感到恐懼，消耗了你應對真實挑戰的能量。",
    breakthrough: "{{NAME}}的宇宙破局建議：今天，列出你目前最讓你焦慮的三個「未知」，然後在每個未知旁邊問：「這個擔心，有哪些是基於實際發生的事，哪些是我的大腦自動填補的故事？」把它們分開，你會發現，真正需要被應對的，往往比你以為的少很多。月亮的智慧，是在她的光中學習辨識幻象——而不是躲避黑暗。",
  },
  {
    id: 19, name: "太陽", enName: "The Sun", emoji: "☀",
    essence: "{{NAME}}，你抽到了「太陽」——塔羅中能量最純粹、最高頻的幸運牌之一。太陽牌中，一個孩子騎著白馬，在一片向日葵盛開的原野上自由馳騁，背後是燦爛的太陽。這張牌代表純粹的喜悅、成功、活力與生命力。它的出現，是宇宙最直接的確認：你走在正確的道路上，你現在所做的，或即將要做的，被宇宙完整地支持著。這是一段讓{{NAME}}可以放心去閃耀的時光——不要縮小自己，讓那個自然而然的光芒完整地展現出來。",
    blindspot: "你的心理盲區在於「陽光中的盲點」——太陽過於明亮，有時讓你看不見那些在光的邊緣的細節。你現在的狀態可能過於樂觀，讓你忽略了某些需要被注意的警示信號，或者讓你過度分享、過度展示，忘記了保留必要的邊界與私人空間。太陽的智慧：照耀，但不要把所有的光都燒給不值得的地方。",
    breakthrough: "{{NAME}}的宇宙破局建議：今天，讓自己完整地慶祝一件你習慣輕描淡寫的成就——不論大小，讓那個成就佔據你應有的注意力和喜悅。太陽牌要你做的，是允許幸福此刻完整地存在，而不是急著看下一個目標。讓自己在這個太陽時刻裡完整地發光——你值得這份光。",
  },
  {
    id: 20, name: "審判", enName: "Judgement", emoji: "📯",
    essence: "{{NAME}}，你抽到了「審判」——靈魂的召喚與復甦的宇宙象徵。審判牌中，天使吹響號角，從棺木中升起的靈魂展臂迎接新生。這不是末日的審判，而是一個「聆聽到更高召喚、從舊有的自我形態中醒來」的覺醒時刻。這張牌的出現，意味著你的生命正在呼喚你進行一次深刻的自我重新定義——某個關於「我是誰、我能做什麼、我值得什麼」的舊認知，正在被宇宙邀請你更新。",
    blindspot: "你的心理盲區在於對「過去錯誤」的持續審判——你對自己過去某些選擇或行為的羞恥與後悔，讓你無法完整地站在當下。你用昨天的錯誤為明天的可能性設限，這是審判牌能量最深的悲劇。它想告訴你：那個曾經做錯的你，已經是過去了；而今天醒來的你，有完整的權利重新開始，不帶任何刑罰。",
    breakthrough: "{{NAME}}的宇宙破局建議：今天，寫一封給過去的自己的原諒信——為那些你曾經做出的、讓自己後悔的選擇，給出真正的原諒。不是說它沒有影響，而是說：「那時的我，以那時的理解做出了那時的選擇，這已經是最好的版本了。今天的我，選擇不再讓昨天的判決，成為明天的牆。」聽見那個召喚，從棺木裡站起來。",
  },
  {
    id: 21, name: "世界", enName: "The World", emoji: "🌐",
    essence: "{{NAME}}，你抽到了「世界」——塔羅中最完整、最圓滿的一張牌。世界牌中，一個女性在月桂花環中自由舞動，她已抵達，她已完成。這張牌代表一個重要週期的圓滿完成——不論是一個計畫、一段關係、一個人生階段，或是某種對自我認知的整合——它已經完成了，或即將以最完整的形式呈現。這是宇宙對{{NAME}}最高規格的認可：你已經走到了這裡，這個本身，就是一個了不起的成就。",
    blindspot: "你的心理盲區在於「抵達時的空虛感」——你花了那麼多能量追逐這個目標，當它真的到來時，你可能感到一種奇特的失落：「就這樣？」或者你已經在抵達之前就開始焦慮下一個目標。世界牌的智慧：先完整地慶祝這個完成，讓那份完整感真正進入你的身體，再開始下一章。不允許自己完整地抵達，是對你所走過的每一步最深的辜負。",
    breakthrough: "{{NAME}}的宇宙破局建議：今天，識別一件你已經完成、但從未真正慶祝的成就——讓那個完成被真正地承認。寫下它，或告訴某個你信任的人，讓它在言語中存在。然後，帶著這份完整感，問自己：「下一個世界，我想去哪裡？」帶著已抵達的成熟，迎接下一個全新的起點——那個下一個「愚者的旅程」，正在等著你。",
  },
];

/* ─── Error Boundary ────────────────────────────────────────────── */
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 22, color: "#D4AF37", fontWeight: 700, marginBottom: 16 }}>✦ 星圖暫時迷失 ✦</div>
          <p style={{ fontSize: 18, color: "#FFF", lineHeight: 1.8, marginBottom: 24 }}>請重新輸入生辰以重啟星盤</p>
          <button onClick={() => this.setState({ hasError: false })} style={{ padding: "12px 32px", background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, borderRadius: 100, border: "none", cursor: "pointer", fontSize: 16 }}>重試</button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Helpers ───────────────────────────────────────────────────── */
function renderNick(text: string, nick: string): ReactNode[] {
  const n = nick.trim() || "緣主";
  const parts = text.split("{{NAME}}");
  return parts.flatMap((part, i) =>
    i < parts.length - 1
      ? [part, <span key={`n-${i}`} style={{ color: "#D4AF37", fontWeight: 700, textShadow: "0 0 8px rgba(212,175,55,0.4)" }}>{n}</span>]
      : [part]
  );
}
function GoldTitle({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return <div style={{ fontSize: size, fontWeight: 700, color: "#D4AF37", textShadow: "0 0 12px rgba(212,175,55,0.6),0 0 24px rgba(212,175,55,0.3)", lineHeight: 1.3, animation: "breathe-gold 3s infinite ease-in-out" }}>{children}</div>;
}
function BodyText({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontSize: 18, color: "#FFFFFF", lineHeight: 1.8, margin: 0, ...style }}>{children}</p>;
}
function SectionCard({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "linear-gradient(160deg,#111 0%,#0a0a0a 100%)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 16, padding: "22px 18px", marginBottom: 14, ...style }}>{children}</div>;
}
function FreeTag() {
  return <span style={{ fontSize: 11, color: "rgba(74,255,140,0.75)", border: "1px solid rgba(74,255,140,0.35)", padding: "2px 8px", borderRadius: 100 }}>免費</span>;
}

/* ─── MiniLockedSection ─────────────────────────────────────────── */
interface MiniLockedProps {
  moduleKey: PricingKey; label: string;
  isUnlocked: boolean; onRequest: (k: PricingKey, l: string) => void;
  children: ReactNode; blurPreview?: ReactNode;
}
function MiniLockedSection({ moduleKey, label, isUnlocked, onRequest, children, blurPreview }: MiniLockedProps) {
  if (isUnlocked) return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>{children}</motion.div>;
  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(212,175,55,0.18)", background: "rgba(0,0,0,0.35)" }}>
      {blurPreview && <div style={{ filter: "blur(5px)", opacity: 0.25, pointerEvents: "none", userSelect: "none", padding: "14px 16px" }}>{blurPreview}</div>}
      <div style={{ position: blurPreview ? "absolute" : "relative", inset: blurPreview ? 0 : undefined, display: "flex", alignItems: "center", justifyContent: "center", padding: blurPreview ? 0 : "14px" }}>
        <button onClick={() => onRequest(moduleKey, label)} data-testid={`btn-unlock-${moduleKey}`}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 22px", borderRadius: 100, background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 0 16px rgba(212,175,55,0.4)" }}>
          <Lock size={14} />{label} ({starTarotPricing[moduleKey]} 點)
        </button>
      </div>
    </div>
  );
}

/* ─── UnlockConfirmModal ────────────────────────────────────────── */
interface ConfirmState { key: PricingKey; cost: number; label: string; }
function UnlockConfirmModal({ modal, onConfirm, onClose }: { modal: ConfirmState; onConfirm: () => void; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: "#080808", border: "1px solid rgba(212,175,55,0.5)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 340 }}>
        <GoldTitle size={22}>確認解鎖天機？</GoldTitle>
        <p style={{ fontSize: 18, color: "#FFF", lineHeight: 1.8, marginTop: 14, marginBottom: 22 }}>
          解鎖【{modal.label}】將消耗 <span style={{ color: "#D4AF37", fontWeight: 700 }}>{modal.cost}</span> 星能點，解鎖後可無限次觀看此生日報告。
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={onConfirm} data-testid="btn-confirm-unlock" style={{ padding: "13px 0", background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, borderRadius: 10, border: "none", cursor: "pointer", fontSize: 16 }}>確認解鎖</button>
          <button onClick={onClose} data-testid="btn-cancel-unlock" style={{ padding: "12px 0", background: "transparent", border: "1px solid rgba(212,175,55,0.4)", color: "#D4AF37", borderRadius: 10, cursor: "pointer", fontSize: 15 }}>暫不解鎖</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── AnimatedAstrolabe ─────────────────────────────────────────── */
function AnimatedAstrolabe({ timeInteracting }: { timeInteracting: boolean }) {
  return (
    <div style={{ width: 160, height: 160, margin: "0 auto 8px" }}>
      <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ overflow: "visible" }}>
        <defs>
          <filter id="gg"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="gc"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <radialGradient id="cg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#FBF5B7"/><stop offset="60%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#8B6914" stopOpacity="0"/></radialGradient>
        </defs>
        <style>{`.rc60{transform-box:fill-box;transform-origin:center;animation:scw 60s linear infinite}.rcc40{transform-box:fill-box;transform-origin:center;animation:sccw 40s linear infinite}.rc22{transform-box:fill-box;transform-origin:center;animation:scw 22s linear infinite}.cpulse{transform-box:fill-box;transform-origin:center;animation:cpulse 2.5s ease-in-out infinite}.pb{animation:pout 0.9s ease-out infinite}@keyframes scw{to{transform:rotate(360deg)}}@keyframes sccw{to{transform:rotate(-360deg)}}@keyframes cpulse{0%,100%{opacity:.85}50%{opacity:1}}@keyframes pout{0%{opacity:1;transform:scale(1) translate(0,0)}100%{opacity:0;transform:scale(.3) translate(var(--px,0px),var(--py,0px))}}`}</style>
        <g className="rc60"><circle cx="100" cy="100" r="88" fill="none" stroke="rgba(212,175,55,0.35)" strokeWidth="1" strokeDasharray="4 3"/>{Array.from({length:12},(_,i)=>{const a=i*30*Math.PI/180;return<line key={i} x1={100+85*Math.sin(a)} y1={100-85*Math.cos(a)} x2={100+91*Math.sin(a)} y2={100-91*Math.cos(a)} stroke="rgba(212,175,55,0.55)" strokeWidth="1.5"/>})}{[0,90,180,270].map(d=>{const a=d*Math.PI/180;return<circle key={d} cx={100+88*Math.sin(a)} cy={100-88*Math.cos(a)} r="3" fill="#D4AF37" filter="url(#gg)"/>})}</g>
        <g className="rcc40"><circle cx="100" cy="100" r="65" fill="none" stroke="rgba(212,175,55,0.28)" strokeWidth=".8" strokeDasharray="2 4"/>{[45,135,225,315].map(d=>{const a=d*Math.PI/180;return<circle key={d} cx={100+65*Math.sin(a)} cy={100-65*Math.cos(a)} r="2.5" fill="rgba(212,175,55,0.7)"/>})}</g>
        <g className="rc22"><circle cx="100" cy="100" r="42" fill="none" stroke="rgba(212,175,55,0.45)" strokeWidth="1.2"/><path d="M100 58 L104 68 L100 64 L96 68 Z" fill="rgba(212,175,55,0.7)"/></g>
        <circle cx="100" cy="100" r="18" fill="url(#cg)" filter="url(#gc)" className="cpulse"/>
        <circle cx="100" cy="100" r="6" fill="#FBF5B7" filter="url(#gg)"/>
        {timeInteracting && [{a:30,r:55},{a:80,r:70},{a:130,r:50},{a:200,r:65},{a:260,r:48},{a:310,r:72},{a:160,r:58},{a:350,r:62}].map(({a,r},i)=>{const ang=a*Math.PI/180;return<circle key={i} cx={100+r*Math.sin(ang)} cy={100-r*Math.cos(ang)} r="2.5" fill="#D4AF37" filter="url(#gg)" className="pb" style={{"--px":`${r*Math.sin(ang)*.4}px`,"--py":`${-r*Math.cos(ang)*.4}px`,"animationDelay":`${i*0.11}s`} as React.CSSProperties}/>})}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HOME COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function Home() {
  const { nickname, setNickname } = useNickname();
  const { points, deductPoints, addPoints } = usePoints();
  const { toast } = useToast();

  // Input
  const [nicknameInput, setNicknameInput] = useState("");
  const [birthday, setBirthday] = useState<BirthdayValue>({ year: 1990, month: 1, day: 1, hour: 12, minute: 0 });
  const [unknownTime, setUnknownTime] = useState(false);

  // Profile lock state
  const [confirmedUserKey, setConfirmedUserKey] = useState<string | null>(null);
  const [isProfileLocked, setIsProfileLocked] = useState(false);

  // App state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("tianguo");
  const [timeInteracting, setTimeInteracting] = useState(false);
  const [unlockedModules, setUnlockedModules] = useState<Record<string, boolean>>({});
  const [confirmModal, setConfirmModal] = useState<ConfirmState | null>(null);
  const [showTopup, setShowTopup] = useState(false);
  const [compatibilityResult, setCompatibilityResult] = useState<ReturnType<typeof getCompatibility> | null>(null);
  const [partnerBirthday, setPartnerBirthday] = useState({ month: 6, day: 15 });
  const [partnerUnknownTime, setPartnerUnknownTime] = useState(false);
  const [tarotQuestion, setTarotQuestion] = useState("🌟 今日整體運勢與靈魂指引");

  // Scroll anchor just below unlock button
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Ironclad copy / context-menu prevention ──────────────────────
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    const preventKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["c","a","x","u","s","p"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const preventSelect = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("keydown", preventKey);
    document.addEventListener("selectstart", preventSelect);
    return () => {
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("keydown", preventKey);
      document.removeEventListener("selectstart", preventSelect);
    };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNicknameInput(val);
    if (!isProfileLocked) {
      const idx = getProfileIndex();
      if (idx[val]) {
        const p = idx[val];
        setBirthday({ year: p.year, month: p.month, day: p.day, hour: p.hour, minute: p.minute });
        setUnknownTime(p.isUnknownTime);
      }
    }
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    const nick = nicknameInput.trim() || "緣主";
    const key  = buildUserKey(nick, birthday);
    setNickname(nick);
    setConfirmedUserKey(key);
    setIsProfileLocked(true);
    const saved = loadUnlockedModulesForKey(key);
    setUnlockedModules(saved);
    saveProfileEntry(nick, birthday, unknownTime);
    setIsUnlocked(true);
    setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  };

  const handleEditProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsProfileLocked(false);
  };

  const handleTabSwitch = (id: TabId) => {
    setActiveTab(id);
    setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  const handleTimeInteract = useCallback((active: boolean) => setTimeInteracting(active), []);

  const requestUnlock = (key: PricingKey, label: string) => {
    const cost = starTarotPricing[key];
    if (unlockedModules[key]) return;
    if (points < cost) {
      toast({ title: "星能點數不足", description: `需要 ${cost} 點，目前餘額 ${points} 點。`, variant: "destructive" });
      return;
    }
    setConfirmModal({ key, cost, label });
  };

  const confirmUnlock = () => {
    if (!confirmModal) return;
    if (deductPoints(confirmModal.cost)) {
      setUnlockedModules(prev => ({ ...prev, [confirmModal.key]: true }));
      if (confirmedUserKey) saveUnlockRecord(confirmModal.key, confirmedUserKey);
    }
    setConfirmModal(null);
  };

  // ── Derived data ─────────────────────────────────────────────────
  const nick           = nickname.trim() || nicknameInput.trim() || "緣主";
  const profile        = getBirthdayProfile(birthday.month, birthday.day);
  const tripleSign     = getTripleSignProfile(birthday.year, birthday.month, birthday.day, birthday.hour, birthday.minute);
  const planets        = getPlanetDeconstruction(birthday.month, birthday.day, birthday.year, birthday.hour, birthday.minute);
  const monthly        = getMonthlyForecast(birthday.month, birthday.day);
  const yearlyOverview = getYearlyOverview();
  const careerForecast = getCareerForecast(birthday.year, birthday.month, birthday.day);
  const loveForecast   = getLoveForecast(birthday.year, birthday.month, birthday.day);
  const wealthForecast = getWealthForecast(birthday.year, birthday.month, birthday.day);
  const soulmateCategories = getSoulmateCategories();
  const mercury        = getMercuryRetrogradeStatus();
  const destinyReport  = getBirthdayDestinyReport(birthday.year, birthday.month, birthday.day, birthday.hour, birthday.minute);

  // 3-card tarot spread seeded by birthday (past / present / future)
  const tarotSeed  = (birthday.year % 100) * 13 + birthday.month * 7 + birthday.day * 3;
  const tarotCard1 = MAJOR_ARCANA[tarotSeed % 22];
  const tarotCard2 = MAJOR_ARCANA[(tarotSeed + 7) % 22];
  const tarotCard3 = MAJOR_ARCANA[(tarotSeed + 14) % 22];

  /* ═══════════════════ RENDER ════════════════════════════════════ */
  return (
    <ErrorBoundary>
      <div style={{ minHeight: "100dvh", background: "#0D0D0D", color: "#FFF", fontFamily: "'Noto Serif SC',serif", paddingBottom: isUnlocked ? 84 : 32, userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}>

        {/* ── Top bar — single gold capsule ───────────────────────── */}
        <div style={{ position: "fixed", top: 12, right: 12, zIndex: 200 }}>
          <button onClick={e => { e.preventDefault(); setShowTopup(true); }} data-testid="btn-topup"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(212,175,55,0.55)", borderRadius: 100, color: "#D4AF37", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 0 12px rgba(212,175,55,0.2)", letterSpacing: "0.03em" }}>
            🪙 {points} 點
          </button>
        </div>

        {/* ── Input section ───────────────────────────────────────── */}
        <div style={{ padding: "40px 18px 20px", textAlign: "center" }}>
          <AnimatedAstrolabe timeInteracting={timeInteracting} />
          <GoldTitle size={28}>星穹密鑰</GoldTitle>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", margin: "6px 0 22px" }}>AI 塔羅與星盤探索</p>

          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 16, padding: "20px 14px" }}>
            <p style={{ fontSize: 17, color: "#FFF", marginBottom: 14, lineHeight: 1.7 }}>「請輸入您的生辰軌跡以解鎖密鑰」</p>

            {/* Nickname — with address-book auto-fill */}
            <input type="text" value={nicknameInput} onChange={handleNicknameChange}
              placeholder="請輸入您的專屬暱稱（如：緣主、William）"
              maxLength={12} data-testid="input-nickname" disabled={isProfileLocked}
              style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", background: isProfileLocked ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.5)", border: `1px solid ${isProfileLocked ? "rgba(212,175,55,0.2)" : "rgba(212,175,55,0.4)"}`, borderRadius: 10, color: "#D4AF37", fontSize: 16, fontFamily: "inherit", outline: "none", marginBottom: 14, caretColor: "#D4AF37", userSelect: "text", WebkitUserSelect: "text", opacity: isProfileLocked ? 0.7 : 1, cursor: isProfileLocked ? "not-allowed" : "text" }}
            />

            {/* Birthday select dropdowns */}
            {(() => {
              const locked = isProfileLocked;
              const selSt: React.CSSProperties = { width: "100%", padding: "10px 8px", background: locked ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.6)", border: `1px solid ${locked ? "rgba(212,175,55,0.2)" : "rgba(212,175,55,0.45)"}`, borderRadius: 8, color: "#D4AF37", fontSize: 14, fontFamily: "'Noto Serif SC',serif", outline: "none", cursor: locked ? "not-allowed" : "pointer", opacity: locked ? 0.7 : 1, userSelect: "text", WebkitUserSelect: "text" };
              const lbSt: React.CSSProperties = { fontSize: 12, color: "#C9A84C", fontWeight: 600, marginBottom: 4, textAlign: "center" };
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Row 1: Year, Month, Day */}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
                    <div><div style={lbSt}>西元年</div>
                      <select value={birthday.year} disabled={locked} onChange={e => setBirthday(p => ({...p, year: +e.target.value}))} style={selSt} data-testid="sel-year">
                        {Array.from({length: 77}, (_, i) => 2026 - i).map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div><div style={lbSt}>月</div>
                      <select value={birthday.month} disabled={locked} onChange={e => setBirthday(p => ({...p, month: +e.target.value}))} style={selSt} data-testid="sel-month">
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div><div style={lbSt}>日</div>
                      <select value={birthday.day} disabled={locked} onChange={e => setBirthday(p => ({...p, day: +e.target.value}))} style={selSt} data-testid="sel-day">
                        {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Unknown time checkbox */}
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: locked ? "not-allowed" : "pointer", userSelect: "none", WebkitUserSelect: "none", justifyContent: "center", opacity: locked ? 0.7 : 1 }}>
                    <input type="checkbox" checked={unknownTime} disabled={locked} onChange={e => {
                      setUnknownTime(e.target.checked);
                      if (e.target.checked) setBirthday(p => ({...p, hour: 12, minute: 0}));
                    }} style={{ accentColor: "#D4AF37", width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, color: "#C9A84C" }}>🙋‍♂️ 我不確定 / 忘記具體出生時間</span>
                  </label>
                  {/* Row 2: Hour, Minute */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, opacity: (unknownTime || locked) ? 0.4 : 1, transition: "opacity 0.2s" }}>
                    <div><div style={lbSt}>時（00–23）</div>
                      <select value={birthday.hour} disabled={unknownTime || locked} onChange={e => setBirthday(p => ({...p, hour: +e.target.value}))} style={selSt} data-testid="sel-hour">
                        {Array.from({length: 24}, (_, i) => i).map(h => <option key={h} value={h}>{String(h).padStart(2,"0")}</option>)}
                      </select>
                    </div>
                    <div><div style={lbSt}>分（00–59）</div>
                      <select value={birthday.minute} disabled={unknownTime || locked} onChange={e => setBirthday(p => ({...p, minute: +e.target.value}))} style={selSt} data-testid="sel-minute">
                        {Array.from({length: 60}, (_, i) => i).map(m => <option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}
                      </select>
                    </div>
                  </div>
                  {unknownTime && (
                    <div style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.28)", borderRadius: 12, padding: "14px 16px", textAlign: "left" }}>
                      <p style={{ fontSize: 18, color: "#FFF", lineHeight: 1.8, margin: 0 }}>💡 <span style={{ color: "#D4AF37", fontWeight: 700 }}>星穹提示：</span>忘記精確出生時間沒關係。系統將自動以當日中午 12:00 進行基礎推演。此狀態下，您的太陽星座、五行行星落座依然具備極高的參考價值。但由於黃道各宮位每 4 分鐘就會產生微幅位移，若少了精確的分分秒秒，算出的【上升星座】與【宮位落入】精確度將會大幅降低，且【月亮星座】若剛好處於當日交界點，亦可能產生誤差。其餘引流與塔羅功能不受影響，請依自身情況酌情解鎖。</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Action buttons */}
            {isProfileLocked ? (
              <button onClick={handleEditProfile} data-testid="btn-edit-profile"
                style={{ marginTop: 14, width: "100%", padding: "12px 0", background: "transparent", border: "1px solid rgba(212,175,55,0.5)", color: "#D4AF37", fontWeight: 600, fontSize: 15, borderRadius: 100, cursor: "pointer", letterSpacing: "0.04em" }}>
                ✏️ 修改資料
              </button>
            ) : (
              <button onClick={handleConfirm} data-testid="btn-unlock-main"
                style={{ marginTop: 18, width: "100%", padding: "14px 0", background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, fontSize: 17, border: "none", borderRadius: 100, cursor: "pointer", boxShadow: "0 0 22px rgba(212,175,55,0.5)", letterSpacing: "0.05em" }}>
                {isUnlocked ? "✦ 重新確認資料" : "解鎖星盤"}
              </button>
            )}
          </div>
        </div>

        {/* ── Scroll anchor ────────────────────────────────────────── */}
        <div ref={contentRef} />

        {/* ── Tab content ─────────────────────────────────────────── */}
        <AnimatePresence>
          {isUnlocked && (
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ padding: "0 14px" }}>

              {/* ════ TAB 1: 星穹天機 ════ */}
              {activeTab === "tianguo" && (
                <div>
                  {/* Soul archetype — free */}
                  <SectionCard>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: "#C9A84C", border: "1px solid rgba(201,168,76,0.4)", padding: "2px 10px", borderRadius: 100 }}>{profile.zodiac}</span>
                      <FreeTag />
                    </div>
                    <div style={{ marginBottom: 12 }}><GoldTitle size={26}>{profile.archetype}</GoldTitle></div>
                    <BodyText>{renderNick(profile.profile, nick)}</BodyText>
                  </SectionCard>

                  {/* Triple signs — FREE */}
                  <SectionCard>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <GoldTitle size={20}>黃金三角星力矩陣</GoldTitle>
                      <FreeTag />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
                      {[
                        { role: "太陽星座", sign: tripleSign.sunSign,    color: "#FFD666" },
                        { role: "月亮星座", sign: tripleSign.moonSign,   color: "#B8D4FF" },
                        { role: "上升星座", sign: tripleSign.risingSign, color: "#C4A3FF" },
                      ].map(({ role, sign, color }) => (
                        <div key={role} style={{ textAlign: "center", background: "rgba(0,0,0,0.4)", borderRadius: 12, padding: "14px 6px", border: `1px solid ${color}30` }}>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>{role}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color, textShadow: `0 0 12px ${color}80,0 0 22px ${color}40`, lineHeight: 1.3 }}>{sign}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginBottom: 8, fontSize: 13, color: "#C9A84C" }}>基礎能量概覽 · 台灣時區演算</div>
                    <BodyText>{renderNick(tripleSign.basicDescription, nick)}</BodyText>
                    <div style={{ marginTop: 18 }}>
                      <MiniLockedSection moduleKey="astroTriangleRatio" label="解鎖三主星深層交織心理影響與人格面具"
                        isUnlocked={unlockedModules.astroTriangleRatio} onRequest={requestUnlock}
                        blurPreview={<p style={{ fontSize: 16, color: "#FFF", lineHeight: 1.8 }}>太陽與月亮星座之間的深層心理張力揭示了 <span style={{ color: "#D4AF37", fontWeight: 700 }}>{nick}</span> 最隱秘的自我……</p>}>
                        <div>
                          <div style={{ fontSize: 13, color: "#C9A84C", marginBottom: 10 }}>✦ 三主星深層解析已解鎖 ✦</div>
                          <BodyText>{renderNick(tripleSign.deepProfile, nick)}</BodyText>
                        </div>
                      </MiniLockedSection>
                    </div>
                  </SectionCard>

                  {/* Planets — sign + core text FREE, deep analysis 6pts (all 5 bundled) */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingLeft: 4 }}>
                      <GoldTitle size={18}>五行行星落座</GoldTitle>
                      <span style={{ fontSize: 11, color: "#4AFF8C", border: "1px solid rgba(74,255,140,0.35)", padding: "2px 8px", borderRadius: 100 }}>星座免費</span>
                      <span style={{ fontSize: 11, color: "rgba(212,175,55,0.5)", background: "rgba(212,175,55,0.08)", padding: "2px 8px", borderRadius: 100, border: "1px solid rgba(212,175,55,0.2)" }}>五星全解 6 點</span>
                    </div>
                    {/* ── Unlock button at TOP ── */}
                    {!unlockedModules.allFivePlanets && (
                      <button onClick={e => { e.preventDefault(); requestUnlock("allFivePlanets", "萬象五星一鍵全解鎖"); }} data-testid="btn-unlock-allFivePlanets"
                        style={{ width: "100%", marginBottom: 14, padding: "14px 0", background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 100, cursor: "pointer", boxShadow: "0 0 14px rgba(212,175,55,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <Lock size={15} /> 一鍵解鎖五星深層盲區全析（{starTarotPricing.allFivePlanets} 點）
                      </button>
                    )}
                    {!!unlockedModules.allFivePlanets && (
                      <div style={{ marginBottom: 12, textAlign: "center", fontSize: 12, color: "rgba(74,255,140,0.7)", border: "1px solid rgba(74,255,140,0.25)", borderRadius: 100, padding: "4px 0" }}>✦ 五星深析已全解鎖 ✦</div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {planets.map((p) => (
                        <div key={p.planet} style={{ background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.22)", borderRadius: 14, overflow: "hidden" }}>
                          <div style={{ padding: "14px 16px 10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                              <span style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(212,175,55,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4AF37", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{p.element}</span>
                              <div>
                                <div style={{ color: "#C9A84C", fontWeight: 700, fontSize: 15 }}>{p.planet}</div>
                                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{p.domain}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: "center", padding: "10px 0 6px" }}>
                              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>落入星座</div>
                              <div style={{ fontSize: 26, fontWeight: 700, color: "#FFD666", textShadow: "0 0 14px rgba(255,214,102,0.7),0 0 28px rgba(255,214,102,0.35)", letterSpacing: "0.04em" }}>{p.sign}</div>
                            </div>
                            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, margin: "8px 0 0", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>{p.coreText}</p>
                            {!!unlockedModules.allFivePlanets && (
                              <div style={{ marginTop: 12, background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 10, padding: "12px 14px" }}>
                                <BodyText style={{ fontSize: 16 }}>{renderNick(p.analysis, nick)}</BodyText>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ════ TAB 2: 量子塔羅 ════ */}
              {activeTab === "tarot" && (
                <div>
                  {/* Rules banner */}
                  <div style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
                    <p style={{ fontSize: 15, color: "#D4AF37", lineHeight: 1.85, margin: 0, textShadow: "0 0 10px rgba(212,175,55,0.35)", fontWeight: 600 }}>
                      🔮 量子塔羅規則：在心中凝聚您最想祈求的指引，從下方選擇問題類型，宇宙將透過您的生命密碼，為您抽出「過去・現在・未來」三張命運之牌。消耗 {starTarotPricing.tarotDivination} 點即可翻牌解碼，每份報告 100+ 字深度啟示。
                    </p>
                  </div>

                  <SectionCard>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <GoldTitle size={20}>三牌命運牌陣</GoldTitle>
                      <span style={{ fontSize: 12, color: "rgba(212,175,55,0.4)" }}>{starTarotPricing.tarotDivination} 點</span>
                    </div>

                    {/* Question dropdown */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, color: "#C9A84C", fontWeight: 600, marginBottom: 6 }}>🙏 今日祈問方向</div>
                      <select value={tarotQuestion} onChange={e => setTarotQuestion(e.target.value)}
                        style={{ width: "100%", padding: "11px 12px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(212,175,55,0.45)", borderRadius: 10, color: "#D4AF37", fontSize: 14, fontFamily: "'Noto Serif SC',serif", outline: "none", cursor: "pointer", userSelect: "text", WebkitUserSelect: "text" }}>
                        {["🌟 今日整體運勢與靈魂指引","💰 財富豐盛與事業突破方向","❤️ 感情關係與心靈連結指引","🎯 當前最重要的人生決策指引","🌿 身心靈健康與能量修復指引","✨ 近期隱藏機遇與貴人磁場"].map(q => (
                          <option key={q} value={q}>{q}</option>
                        ))}
                      </select>
                      <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(212,175,55,0.05)", borderRadius: 8, border: "1px solid rgba(212,175,55,0.15)" }}>
                        <p style={{ fontSize: 13, color: "rgba(212,175,55,0.8)", lineHeight: 1.7, margin: 0 }}>
                          已選：<span style={{ fontWeight: 700 }}>{tarotQuestion}</span>
                        </p>
                      </div>
                    </div>

                    {/* 3-card face-down preview or revealed */}
                    {!unlockedModules.tarotDivination ? (
                      <div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
                          {[{label:"過去",icon:"⏮"},{label:"現在",icon:"⊙"},{label:"未來",icon:"⏭"}].map(({label, icon}) => (
                            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                              <div style={{ width: "100%", aspectRatio: "2/3", background: "linear-gradient(160deg,rgba(212,175,55,0.12) 0%,rgba(0,0,0,0.5) 100%)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                <span style={{ fontSize: 28, opacity: 0.5 }}>✦</span>
                                <span style={{ fontSize: 11, color: "rgba(212,175,55,0.5)" }}>未翻開</span>
                              </div>
                              <span style={{ fontSize: 13, color: "#C9A84C", fontWeight: 600 }}>{icon} {label}</span>
                            </div>
                          ))}
                        </div>
                        <button onClick={e => { e.preventDefault(); requestUnlock("tarotDivination", "三牌命運牌陣"); }} data-testid="btn-unlock-tarotDivination"
                          style={{ width: "100%", padding: "14px 0", background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 100, cursor: "pointer", boxShadow: "0 0 14px rgba(212,175,55,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <Lock size={15} /> 翻開命運三牌（{starTarotPricing.tarotDivination} 點）
                        </button>
                      </div>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                        {/* 3 revealed cards */}
                        {[
                          { card: tarotCard1, role: "過去", icon: "⏮", roleColor: "#B8D4FF", bg: "rgba(184,212,255,0.04)", border: "rgba(184,212,255,0.2)" },
                          { card: tarotCard2, role: "現在", icon: "⊙", roleColor: "#FFD666", bg: "rgba(255,214,102,0.05)", border: "rgba(255,214,102,0.25)" },
                          { card: tarotCard3, role: "未來", icon: "⏭", roleColor: "#C4A3FF", bg: "rgba(196,163,255,0.04)", border: "rgba(196,163,255,0.2)" },
                        ].map(({ card, role, icon, roleColor, bg, border }) => (
                          <div key={role} style={{ marginBottom: 18, background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: "18px 16px" }}>
                            {/* Role label */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                              <span style={{ fontSize: 16 }}>{icon}</span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: roleColor, letterSpacing: "0.06em" }}>{role}</span>
                              <span style={{ flex: 1, height: 1, background: `${border}` }}/>
                            </div>
                            {/* Card header */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                              <span style={{ fontSize: 32, filter: "drop-shadow(0 0 8px rgba(212,175,55,0.6))" }}>{card.emoji}</span>
                              <div>
                                <div style={{ fontSize: 10, color: "rgba(212,175,55,0.55)", letterSpacing: "0.1em", marginBottom: 2 }}>{card.enName}</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: "#D4AF37", textShadow: "0 0 10px rgba(212,175,55,0.5)" }}>{card.name}</div>
                              </div>
                            </div>
                            {/* Essence */}
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 12, color: "#FFD666", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><span>✦</span> 牌面本質</div>
                              <BodyText style={{ fontSize: 16 }}>{renderNick(card.essence, nick)}</BodyText>
                            </div>
                            {/* Blindspot */}
                            <div style={{ marginBottom: 12, background: "rgba(255,107,74,0.05)", border: "1px solid rgba(255,107,74,0.15)", borderRadius: 10, padding: "12px 14px" }}>
                              <div style={{ fontSize: 12, color: "#FF9F7A", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><span>⚠</span> 心理盲區</div>
                              <BodyText style={{ fontSize: 16 }}>{renderNick(card.blindspot, nick)}</BodyText>
                            </div>
                            {/* Breakthrough */}
                            <div style={{ background: "rgba(74,255,140,0.05)", border: "1px solid rgba(74,255,140,0.15)", borderRadius: 10, padding: "12px 14px" }}>
                              <div style={{ fontSize: 12, color: "#4AFF8C", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><span>⚡</span> 宇宙破局建議</div>
                              <BodyText style={{ fontSize: 16 }}>{renderNick(card.breakthrough, nick)}</BodyText>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </SectionCard>
                </div>
              )}

              {/* ════ TAB 3: 時空流轉 ════ */}
              {activeTab === "shikong" && (
                <div>
                  {/* Mercury — free */}
                  <SectionCard>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <GoldTitle size={20}>實時天象防禦</GoldTitle>
                      <span style={{ padding: "4px 14px", borderRadius: 100, fontSize: 13, fontWeight: 700, color: mercury.isRetrograde ? "#FF6B4A" : "#4AFF8C", border: `1px solid ${mercury.isRetrograde ? "#FF6B4A" : "#4AFF8C"}`, boxShadow: `0 0 10px ${mercury.isRetrograde ? "rgba(255,107,74,0.3)" : "rgba(74,255,140,0.3)"}` }}>
                        {mercury.statusLabel}
                      </span>
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                      {mercury.tips.map((tip, i) => (
                        <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ color: "#D4AF37", marginTop: 4, flexShrink: 0 }}>•</span>
                          <BodyText>{tip}</BodyText>
                        </li>
                      ))}
                    </ul>
                  </SectionCard>

                  {/* Monthly — FREE */}
                  <SectionCard>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <GoldTitle size={20}>本月心靈藍圖</GoldTitle>
                      <FreeTag />
                    </div>
                    <BodyText>{renderNick(monthly, nick)}</BodyText>
                  </SectionCard>

                  {/* Yearly — unified 10pt unlock */}
                  <SectionCard>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <GoldTitle size={20}>今年大運軌跡</GoldTitle>
                      <FreeTag />
                    </div>
                    <div style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.18)", borderRadius: 12, padding: "16px 14px", marginBottom: 18 }}>
                      <div style={{ fontSize: 13, color: "#C9A84C", marginBottom: 10 }}>✦ 宏觀宇宙引力提示 · 全體適用 ✦</div>
                      <BodyText>{yearlyOverview}</BodyText>
                    </div>
                    <MiniLockedSection moduleKey="yearlyTotalDestiny" label={`解鎖 ${nick} 全年大運三維度（事業・感情・財富）`}
                      isUnlocked={!!unlockedModules.yearlyTotalDestiny} onRequest={requestUnlock}
                      blurPreview={
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {[{ icon: "⚡", label: "天命黃金事業流轉" }, { icon: "♾", label: "宿命靈魂正緣羈絆" }, { icon: "✦", label: "宇宙天意財富盲區" }].map(({ icon, label }) => (
                            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 16, color: "#D4AF37" }}>{icon}</span>
                              <div style={{ height: 13, background: "rgba(212,175,55,0.12)", borderRadius: 6, flex: 1 }} />
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{label}</span>
                            </div>
                          ))}
                        </div>
                      }>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ fontSize: 13, color: "#C9A84C", textAlign: "center", marginBottom: 4, letterSpacing: "0.06em" }}>✦ 全年大運三維度已解鎖 ✦</div>
                        {([
                          { label: "⚡ 天命黃金事業流轉", color: "#FFD666", bg: "rgba(255,214,102,0.05)", border: "rgba(255,214,102,0.2)", text: careerForecast },
                          { label: "♾ 宿命靈魂正緣羈絆", color: "#C4A3FF", bg: "rgba(196,163,255,0.05)", border: "rgba(196,163,255,0.2)", text: loveForecast },
                          { label: "✦ 宇宙天意財富盲區", color: "#4AFF8C", bg: "rgba(74,255,140,0.05)", border: "rgba(74,255,140,0.15)", text: wealthForecast },
                        ]).map(({ label, color, bg, border, text }) => (
                          <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "14px 14px" }}>
                            <p style={{ color, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{label}</p>
                            <BodyText style={{ fontSize: 16 }}>{renderNick(text, nick)}</BodyText>
                          </div>
                        ))}
                      </motion.div>
                    </MiniLockedSection>
                  </SectionCard>
                </div>
              )}

              {/* ════ TAB 5: 天命生日個性詳解 ════ */}
              {activeTab === "birthday" && (
                <div>
                  <SectionCard>
                    {/* Announcement banner */}
                    <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#D4AF37", lineHeight: 1.8, margin: 0, textShadow: "0 0 10px rgba(212,175,55,0.4)" }}>
                        💡 星穹密鑰・特別回饋公告：本項目為平台初次顯化之「破冰福利」，特別由大師資料庫進行全解鎖回饋，僅象徵性收取 2 點。此為破格特惠，其餘核心天機（如三主星交織、今年大運天書、量子共鳴深度報告）均涉及更高階大數據心理學與時空軌跡交叉精算，兩者計費權重不同，請依個人剛需酌情解鎖。
                      </p>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <GoldTitle size={20}>天命生日個性詳解</GoldTitle>
                      <span style={{ fontSize: 12, color: "#C9A84C", border: "1px solid rgba(212,175,55,0.35)", padding: "2px 10px", borderRadius: 100 }}>破冰特惠 {starTarotPricing.birthdayDestiny} 點</span>
                    </div>

                    <MiniLockedSection
                      moduleKey="birthdayDestiny"
                      label="解鎖天命生日個性全詳解（400+字）"
                      isUnlocked={!!unlockedModules.birthdayDestiny}
                      onRequest={requestUnlock}
                      blurPreview={
                        <div>
                          <p style={{ fontSize: 17, color: "#FFD666", fontWeight: 700, lineHeight: 1.8, marginBottom: 6 }}>
                            {birthday.month}月{birthday.day}日生的你是...
                          </p>
                          <p style={{ fontSize: 16, color: "#FFF", lineHeight: 1.8 }}>
                            <span style={{ color: "#FFD666", fontWeight: 700 }}>【太陽野心密碼】</span><br />
                            {destinyReport.sunText.replace(/\{\{NAME\}\}/g, nick).substring(0, 30)}……
                          </p>
                          <p style={{ fontSize: 16, color: "#FFF", lineHeight: 1.8, marginTop: 8 }}>
                            <span style={{ color: "#B8D4FF", fontWeight: 700 }}>【月亮情緒地雷】</span><br />
                            {destinyReport.moonText.replace(/\{\{NAME\}\}/g, nick).substring(0, 30)}……
                          </p>
                        </div>
                      }
                    >
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {/* Personalised opener — mandatory format */}
                        <div style={{ textAlign: "center", marginBottom: 20, padding: "18px 14px", background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 14 }}>
                          <p style={{ fontSize: 22, fontWeight: 700, color: "#D4AF37", lineHeight: 1.6, margin: 0, textShadow: "0 0 14px rgba(212,175,55,0.5)" }}>
                            {birthday.month}月{birthday.day}日生的你是...
                          </p>
                        </div>

                        <div style={{ fontSize: 13, color: "#C9A84C", textAlign: "center", marginBottom: 16, letterSpacing: "0.06em" }}>✦ 天命生日個性詳解已全解鎖 ✦</div>

                        {/* Section 1: Sun */}
                        <div style={{ background: "rgba(255,214,102,0.05)", border: "1px solid rgba(255,214,102,0.2)", borderRadius: 12, padding: "16px 14px", marginBottom: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 18 }}>☀</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "#FFD666" }}>太陽能量庫 · 外在野心密碼</span>
                          </div>
                          <BodyText style={{ fontSize: 17 }}>{renderNick(destinyReport.sunText, nick)}</BodyText>
                        </div>

                        {/* Section 2: Moon */}
                        <div style={{ background: "rgba(184,212,255,0.05)", border: "1px solid rgba(184,212,255,0.18)", borderRadius: 12, padding: "16px 14px", marginBottom: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 18 }}>🌙</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "#B8D4FF" }}>月亮情緒庫 · 暗夜情緒地雷</span>
                          </div>
                          <BodyText style={{ fontSize: 17 }}>{renderNick(destinyReport.moonText, nick)}</BodyText>
                        </div>

                        {/* Section 3: Life Path */}
                        <div style={{ background: "rgba(196,163,255,0.05)", border: "1px solid rgba(196,163,255,0.18)", borderRadius: 12, padding: "16px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 18 }}>✦</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "#C4A3FF" }}>生命靈數 {destinyReport.lifePathNum} · 靈魂天命原型</span>
                          </div>
                          <BodyText style={{ fontSize: 17 }}>{renderNick(destinyReport.lifePathText, nick)}</BodyText>
                        </div>
                      </motion.div>
                    </MiniLockedSection>
                  </SectionCard>
                </div>
              )}

              {/* ════ TAB 4: 量子共鳴 ════ */}
              {activeTab === "resonance" && (
                <div>
                  {/* 4 individual soulmate cards */}
                  <SectionCard style={{ paddingBottom: 10 }}>
                    <div style={{ marginBottom: 14 }}>
                      <GoldTitle size={20}>靈魂引力場</GoldTitle>
                      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginTop: 6, lineHeight: 1.7 }}>
                        宇宙為 <span style={{ color: "#D4AF37", fontWeight: 700 }}>{nick}</span> 精準配置的四大靈魂磁場（各 4 點 · 200+ 字深度報告）
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {soulmateCategories.map(({ key, icon }) => {
                        const mKey  = SOULMATE_PRICING_KEYS[key];
                        const dLabel = SOULMATE_LABELS[key] || key;
                        const sm    = getSoulmateProfile(birthday.month, birthday.day, key as SoulmateCategory);
                        const isU   = !!unlockedModules[mKey];
                        return (
                          <div key={key} style={{ background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.22)", borderRadius: 14, overflow: "hidden" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid rgba(212,175,55,0.1)" }}>
                              <span style={{ fontSize: 18, color: "#D4AF37" }}>{icon}</span>
                              <span style={{ color: "#C9A84C", fontWeight: 700, fontSize: 15 }}>{dLabel}</span>
                              {!isU && <span style={{ marginLeft: "auto", fontSize: 12, color: "rgba(212,175,55,0.45)" }}>{starTarotPricing[mKey]} 點</span>}
                              {isU  && <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(74,255,140,0.7)", border: "1px solid rgba(74,255,140,0.3)", padding: "2px 8px", borderRadius: 100 }}>已解鎖</span>}
                            </div>
                            {/* Free teaser: compatible signs */}
                            <div style={{ padding: "10px 16px 4px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {sm.zodiacs.map((z,i) => (
                                <span key={i} style={{ padding: "2px 10px", background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.18)", borderRadius: 100, fontSize: 12, color: "#C9A84C" }}>{z}</span>
                              ))}
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", alignSelf: "center" }}>· 最佳月份 {sm.months.join("·")}</span>
                            </div>
                            <div style={{ padding: "8px 16px 14px" }}>
                              <MiniLockedSection moduleKey={mKey} label={`解鎖${dLabel}深度報告`}
                                isUnlocked={isU} onRequest={requestUnlock}
                                blurPreview={<p style={{ fontSize: 15, color: "#FFF", lineHeight: 1.8 }}>{sm.analysis.replace(/\{\{NAME\}\}/g, nick).substring(0, 30)}……</p>}>
                                <div>
                                  <BodyText style={{ fontSize: 16 }}>{renderNick(sm.analysis, nick)}</BodyText>
                                </div>
                              </MiniLockedSection>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard>

                  {/* Compatibility */}
                  <SectionCard>
                    <div style={{ marginBottom: 14 }}><GoldTitle size={20}>量子共鳴 · 雙人靈魂比對</GoldTitle></div>
                    <BodyText style={{ marginBottom: 14 }}>輸入對方生辰，進行高維度靈魂頻率比對（分數及共鳴指數免費，350+ 字深度報告 10 點）</BodyText>
                    {/* Partner birthday — select dropdowns + unknown time */}
                    <div style={{ margin: "14px 0" }}>
                      {(() => {
                        const selSt: React.CSSProperties = { width: "100%", padding: "10px 8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 8, color: "#D4AF37", fontSize: 14, fontFamily: "'Noto Serif SC',serif", outline: "none", cursor: "pointer", userSelect: "text", WebkitUserSelect: "text" };
                        const lbSt: React.CSSProperties = { fontSize: 11, color: "#C9A84C", fontWeight: 600, marginBottom: 4, textAlign: "center" };
                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              <div><div style={lbSt}>對方月份</div>
                                <select value={partnerBirthday.month} onChange={e => setPartnerBirthday(p => ({...p, month: +e.target.value}))} style={selSt} data-testid="sel-partner-month">
                                  {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m} 月</option>)}
                                </select>
                              </div>
                              <div><div style={lbSt}>對方日期</div>
                                <select value={partnerBirthday.day} onChange={e => setPartnerBirthday(p => ({...p, day: +e.target.value}))} style={selSt} data-testid="sel-partner-day">
                                  {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d} 日</option>)}
                                </select>
                              </div>
                            </div>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none", WebkitUserSelect: "none", justifyContent: "center" }}>
                              <input type="checkbox" checked={partnerUnknownTime} onChange={e => setPartnerUnknownTime(e.target.checked)} style={{ accentColor: "#D4AF37", width: 15, height: 15 }} />
                              <span style={{ fontSize: 12, color: "#C9A84C" }}>🙋 對方出生日期不確定</span>
                            </label>
                            {partnerUnknownTime && (
                              <div style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.28)", borderRadius: 12, padding: "14px 16px" }}>
                                <p style={{ fontSize: 18, color: "#FFF", lineHeight: 1.8, margin: 0 }}>💡 <span style={{ color: "#D4AF37", fontWeight: 700 }}>星穹提示：</span>不知道心靈伴侶或朋友的精確出生時間？沒關係！系統將自動以當日中午 12:00 進行兩者星軌的重疊推演。在未知精確分秒的情況下，你們之間的太陽與太陽、太陽與五行星座（如火星、金星）的『核心引力、價值觀共鳴度』依然具備高達 85% 以上的參考價值。但請注意，涉及極度客製化的宮位交織以及精確的上升契合度，其計算結果會受到限制。請依據目前的現有資訊安心進行引力解鎖。</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <button onClick={e => { e.preventDefault(); setCompatibilityResult(getCompatibility(birthday.month, birthday.day, partnerBirthday.month, partnerBirthday.day)); }} data-testid="btn-compare"
                      style={{ width: "100%", padding: "12px 0", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.45)", borderRadius: 100, color: "#D4AF37", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 14 }}>
                      比對共鳴頻率（免費）
                    </button>
                    <AnimatePresence>
                      {compatibilityResult && (
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ borderTop: "1px solid rgba(212,175,55,0.15)", paddingTop: 18 }}>
                          <div style={{ textAlign: "center", marginBottom: 16 }}>
                            <div style={{ fontSize: 52, fontWeight: 700, color: "#D4AF37", textShadow: "0 0 20px rgba(212,175,55,0.7),0 0 40px rgba(212,175,55,0.3)", lineHeight: 1.1 }}>{compatibilityResult.score}%</div>
                            <p style={{ fontSize: 12, color: "rgba(212,175,55,0.55)", marginTop: 4 }}>{compatibilityResult.crossNote}</p>
                            <p style={{ fontSize: 18, color: "#FFF", lineHeight: 1.8, marginTop: 8 }}>{compatibilityResult.summary}</p>
                          </div>
                          <MiniLockedSection moduleKey="friendCompatibility" label="解鎖深度共鳴天書（350+ 字）"
                            isUnlocked={!!unlockedModules.friendCompatibility} onRequest={requestUnlock}
                            blurPreview={<div style={{ height: 60, background: "rgba(212,175,55,0.05)", borderRadius: 8 }}/>}>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                              {[
                                { label: "⚠ 相處盲區",    color: "#FF9F7A", bg: "rgba(255,107,74,0.05)", border: "rgba(255,107,74,0.2)", text: compatibilityResult.sections.blindSpots },
                                { label: "⚡ 互補超能力",  color: "#FFD666", bg: "rgba(255,214,102,0.05)", border: "rgba(255,214,102,0.2)", text: compatibilityResult.sections.superPowers },
                                { label: "◎ 年度共鳴軌跡", color: "#B8D4FF", bg: "rgba(184,212,255,0.05)", border: "rgba(184,212,255,0.18)", text: compatibilityResult.sections.yearlyResonance },
                              ].map(({ label, color, bg, border, text }) => (
                                <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "14px 14px" }}>
                                  <p style={{ color, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{label}</p>
                                  <BodyText style={{ fontSize: 16 }}>{renderNick(text, nick)}</BodyText>
                                </div>
                              ))}
                            </motion.div>
                          </MiniLockedSection>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </SectionCard>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <footer style={{ padding: "20px 18px 100px", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#444", lineHeight: 1.8 }}>
            💡 本模組之星盤推演與塔羅矩陣，均基於 AI 大數據心理學模型與符號學演算法，內容僅供個人自我理解、生活風格靈感與高科技娛樂體驗之參考，不構成任何實質醫療、法律或財務建議。
          </p>
        </footer>

        {/* ── 4-Tab bottom bar ─────────────────────────────────────── */}
        {isUnlocked && (
          <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(5,5,5,0.97)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(212,175,55,0.18)", display: "flex", zIndex: 100 }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={e => { e.preventDefault(); handleTabSwitch(tab.id); }} data-testid={`tab-${tab.id}`}
                  style={{ flex: 1, padding: "10px 0 13px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer", color: active ? "#D4AF37" : "rgba(255,255,255,0.35)", transition: "all 0.2s", borderTop: active ? "2px solid #D4AF37" : "2px solid transparent" }}>
                  <span style={{ fontSize: 17, lineHeight: 1, textShadow: active ? "0 0 10px rgba(212,175,55,0.7)" : "none" }}>{tab.glyph}</span>
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: "0.03em" }}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <TopupModal open={showTopup} onOpenChange={setShowTopup} />
        {confirmModal && <UnlockConfirmModal modal={confirmModal} onConfirm={confirmUnlock} onClose={() => setConfirmModal(null)} />}
      </div>
    </ErrorBoundary>
  );
}
