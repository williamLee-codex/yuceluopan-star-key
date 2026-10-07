import React, { useState, useMemo, useCallback, useRef, useEffect, ReactNode, Component } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";
import type { BirthdayValue } from "@/components/BirthdayWheels";
import { TopupModal } from "@/components/TopupModal";
import { usePoints } from "@/contexts/PointsContext";
import { useNickname } from "@/contexts/NicknameContext";
import { useToast } from "@/hooks/use-toast";
import { getBirthdayProfile, getTripleSignProfile, getBirthdayDestinyReport, getDateDestinyReport } from "@/lib/astrology";
import { getPlanetDeconstruction } from "@/lib/planets";
import { getMonthlyForecast, getYearlyOverview, getCareerForecast, getLoveForecast, getWealthForecast } from "@/lib/forecast";
import { getSoulmateProfile, getSoulmateCategories, type SoulmateCategory } from "@/lib/soulmate";
import { getCompatibility } from "@/lib/compatibility";
import { getMercuryRetrogradeStatus } from "@/lib/mercury";
import {
  buildLegacyProfileKey,
  buildProfileKey,
  defaultCountryForLocale,
  formatBirthplaceLabel,
  getBirthplaceCountries,
  TAIPEI_BIRTHPLACE,
  type Birthplace,
} from "@/lib/birthplace";
import { searchBirthplaces } from "@/lib/location-search";
import { launchBirthPlaceToBirthplace } from "@/lib/launch-birthplace";
import { loadLaunchProfile } from "@/lib/launch-profile";

import { calculateNatalChart } from '@/lib/natal/engine';
import { buildNatalReadingFacts } from '@/lib/natal/reading-adapter';
import { NatalChart } from '@/components/NatalChart';

/* ─── localStorage helpers ──────────────────────────────────────── */
const LS_UNLOCK_RECORDS = "starTarot_unlockedRecords";
const LS_PROFILE_INDEX  = "starTarot_profileIndex";

function loadUnlockedModulesForKey(userKey: string, legacyKey?: string): Record<string, boolean> {
  try {
    const records = JSON.parse(localStorage.getItem(LS_UNLOCK_RECORDS) || "{}") as Record<string, Record<string, boolean>>;
    const result: Record<string, boolean> = {};
    for (const mKey of Object.keys(records)) {
      if (records[mKey]?.[userKey]) result[mKey] = true;
      else if (legacyKey && records[mKey]?.[legacyKey]) {
        result[mKey] = true;
        records[mKey][userKey] = true;
      }
    }
    localStorage.setItem(LS_UNLOCK_RECORDS, JSON.stringify(records));
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

type ProfileEntry = { year: number; month: number; day: number; hour: number; minute: number; isUnknownTime: boolean; birthplace?: Birthplace };

function getProfileIndex(): Record<string, ProfileEntry> {
  try { return JSON.parse(localStorage.getItem(LS_PROFILE_INDEX) || "{}"); } catch { return {}; }
}

function saveProfileEntry(nick: string, bd: BirthdayValue, isUnknownTime: boolean, birthplace: Birthplace): void {
  try {
    const idx = getProfileIndex();
    idx[nick] = { year: bd.year, month: bd.month, day: bd.day, hour: bd.hour, minute: bd.minute, isUnknownTime, birthplace };
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
  { id: "birthday",  label: "誕生日鑑", glyph: "🎂" },
];
const SOULMATE_PRICING_KEYS: Record<string, PricingKey> = {
  spouse: "spouseMatch", boss: "bossMatch", colleague: "colleagueMatch", friend: "friendMatch",
};

const SOULMATE_LABELS: Record<string, string> = {
  spouse: "伴侶相處", boss: "上司相處", colleague: "同事合作", friend: "朋友相處",
};

/* ─── Major Arcana readings ───────────────────────────────────── */
interface TarotCard {
  id: number; name: string; enName: string; emoji: string;
  essence: string; blindspot: string; breakthrough: string;
}
const MAJOR_ARCANA: TarotCard[] = [
  {
    id: 0, name: "愚者", enName: "The Fool", emoji: "🌀",
    essence: "{{NAME}}，這張牌的主題是「新的開始」。你可以把這張牌當成嘗試新事物的提醒。開始之前仍要看清楚需要多少時間、費用，以及你能承受的風險。",
    blindspot: "你可能一直等到完全準備好，才允許自己出發；也可能因為太興奮，忽略必要準備。",
    breakthrough: "{{NAME}}可以試著這樣做：挑一件想做的小事，列出第一步與需要準備的東西。在能承受的範圍內試一次，再根據結果調整。",
  },
  {
    id: 1, name: "魔術師", enName: "The Magician", emoji: "⚡",
    essence: "{{NAME}}，這張牌的主題是「運用已有的能力」。先盤點自己已經會做什麼、有哪些工具，以及誰可以提供幫忙。把注意力放在能實際使用的資源上。",
    blindspot: "你可能把沒有更多時間或工具，當成一直不開始的理由；也可能同時想做太多事。",
    breakthrough: "{{NAME}}可以試著這樣做：寫下三項現有能力，再選一個能用到它們的小目標。先做出一份草稿或小成果，再找人給具體意見。",
  },
  {
    id: 2, name: "女祭司", enName: "The High Priestess", emoji: "🌙",
    essence: "{{NAME}}，這張牌的主題是「先聽見自己的感受」。有些猶豫值得慢慢想清楚。你可以留意直覺，但做重要決定時，也要把它和已知事實一起看。",
    blindspot: "外界意見太多時，你可能分不清自己的需要；也可能把擔心直接當成事實。",
    breakthrough: "{{NAME}}可以試著這樣做：留十分鐘不看訊息，寫下你真正想要什麼、擔心什麼。再把需要確認的事情列出來，一項一項了解。",
  },
  {
    id: 3, name: "皇后", enName: "The Empress", emoji: "🌿",
    essence: "{{NAME}}，這張牌的主題是「照顧與創造」。這張牌提醒你留意生活中的照顧、享受與創作。把時間花在值得滋養的事上，也替自己留一點舒服的空間。",
    blindspot: "你可能一直照顧別人，卻忽略自己的疲憊；也可能用花錢填補不安。",
    breakthrough: "{{NAME}}可以試著這樣做：安排一件預算內的小享受，例如好好吃一餐或做點創作。先問自己最缺的是休息、陪伴，還是生活上的幫忙。",
  },
  {
    id: 4, name: "皇帝", enName: "The Emperor", emoji: "🏛",
    essence: "{{NAME}}，這張牌的主題是「安排與責任」。需要穩定進度時，清楚的計畫與分工會有幫助。規則要做得到，也要讓參與的人知道原因。",
    blindspot: "你可能想控制所有細節，讓自己太累；也可能只有想法，卻沒有安排時間。",
    breakthrough: "{{NAME}}可以試著這樣做：替最重要的一件事訂下完成日期與第一步。若需要別人合作，把責任談清楚，也留出調整的空間。",
  },
  {
    id: 5, name: "教皇", enName: "The Hierophant", emoji: "🕍",
    essence: "{{NAME}}，這張牌的主題是「學習與既有規則」。你可以從有經驗的人身上學習，也可以重新檢查自己一直遵守的習慣。了解原因後，再決定要保留什麼。",
    blindspot: "你可能只因大家都這樣做就跟著做，或因為不喜歡被限制而拒絕所有建議。",
    breakthrough: "{{NAME}}可以試著這樣做：挑一條常用的規則，問它目前還有沒有幫助。若想學新事物，先確認來源、內容與費用，再安排學習。",
  },
  {
    id: 6, name: "戀人", enName: "The Lovers", emoji: "💫",
    essence: "{{NAME}}，這張牌的主題是「關係與選擇」。這張牌提醒你看清楚自己重視什麼。感情、工作或生活的選擇，都需要把期待和代價一起考慮。",
    blindspot: "你可能為了不讓人失望，答應不適合自己的事；也可能一直拖著不選，讓壓力越來越大。",
    breakthrough: "{{NAME}}可以試著這樣做：寫下每個選項的好處、代價與不能接受的條件。若牽涉另一個人，把彼此的期待說清楚，再做決定。",
  },
  {
    id: 7, name: "戰車", enName: "The Chariot", emoji: "🏹",
    essence: "{{NAME}}，這張牌的主題是「確定方向再前進」。想推動事情時，先選好方向，再持續做可以掌握的部分。速度可以調整，不必每次都靠硬撐。",
    blindspot: "你可能太在意快速完成，忽略風險與疲勞；也可能想等所有不確定都消失才開始。",
    breakthrough: "{{NAME}}可以試著這樣做：選一個近期目標，安排今天能完成的一步。把可能的阻礙和備用做法寫下來，也替自己安排休息。",
  },
  {
    id: 8, name: "力量", enName: "Strength", emoji: "🦁",
    essence: "{{NAME}}，這張牌的主題是「穩住情緒的力量」。溫和而清楚地回應，有時比壓下情緒或急著爭贏更有用。承認自己累了，也是一種照顧自己的能力。",
    blindspot: "你可能把需要幫忙看成軟弱，或一直壓抑生氣，直到突然爆發。",
    breakthrough: "{{NAME}}可以試著這樣做：情緒上來時先暫停一下，再說出發生了什麼和你的需要。若今天已經很累，先把一件可延後的事放下。",
  },
  {
    id: 9, name: "隱士", enName: "The Hermit", emoji: "🕯",
    essence: "{{NAME}}，這張牌的主題是「留時間想清楚」。獨處能幫你整理想法，但不必把所有問題都一個人承擔。安靜之後，也可以向信任的人求助。",
    blindspot: "你可能因為不想被打擾而疏遠所有人，或一直思考，卻遲遲不採取行動。",
    breakthrough: "{{NAME}}可以試著這樣做：安排一段安靜時間，寫下最掛心的一個問題。整理完後，選一個小行動，或找一個可信任的人討論。",
  },
  {
    id: 10, name: "命運之輪", enName: "Wheel of Fortune", emoji: "☸",
    essence: "{{NAME}}，這張牌的主題是「接受生活會變動」。有些事情不完全在你的控制裡。變動發生時，可以先處理眼前需要，再看看哪些地方能調整。",
    blindspot: "你可能把一次好壞結果當成全部，或急著替每個變化找出命運上的原因。",
    breakthrough: "{{NAME}}可以試著這樣做：寫下現在能控制和不能控制的事。先做一件能改善眼前情況的小事，再回頭評估下一步。",
  },
  {
    id: 11, name: "正義", enName: "Justice", emoji: "⚖",
    essence: "{{NAME}}，這張牌的主題是「公平與承擔後果」。做決定時，把條件、責任與可能的後果看清楚。對別人公平，也要對自己的時間和能力公平。",
    blindspot: "你可能只想證明誰對誰錯，忽略真正要解決的問題；也可能為了維持和氣而一直退讓。",
    breakthrough: "{{NAME}}可以試著這樣做：討論一件爭議時，先列出雙方同意的事實，再說明不同意的地方。涉及承諾時，把內容確認清楚。",
  },
  {
    id: 12, name: "倒吊人", enName: "The Hanged Man", emoji: "🔄",
    essence: "{{NAME}}，這張牌的主題是「暫停並換個角度」。事情卡住時，短暫停下來能幫你看見不同做法。暫停要有目的，也要知道什麼時候再回來處理。",
    blindspot: "你可能把等待當成不用決定，或一直犧牲自己的需要，希望事情自然變好。",
    breakthrough: "{{NAME}}可以試著這樣做：替卡住的事訂一個回顧日期。在那之前，找一個不同觀點，想想是否能減少一個不必要的負擔。",
  },
  {
    id: 13, name: "死神", enName: "Death", emoji: "🌑",
    essence: "{{NAME}}，這張牌的主題是「結束與改變」。這張牌談的是告別不再合適的安排。結束可能需要時間，也可以先從一個小調整開始。",
    blindspot: "你可能因為投入過很多心力，就不願承認某件事已經不適合；也可能急著切斷一切。",
    breakthrough: "{{NAME}}可以試著這樣做：挑一個需要調整的習慣，寫下保留它的代價與改變的好處。先做一個可承受的改變，再觀察結果。",
  },
  {
    id: 14, name: "節制", enName: "Temperance", emoji: "🌊",
    essence: "{{NAME}}，這張牌的主題是「找到合適的份量」。工作、休息與人際需要可以慢慢調整。不必一下做得太多，也不用因為沒有做到全部就放棄。",
    blindspot: "你可能在全力衝刺和完全停擺之間來回，讓自己很難持續。",
    breakthrough: "{{NAME}}可以試著這樣做：把一個太大的計畫縮小成每天做得到的份量。試行幾天，看看是否需要再增加或減少。",
  },
  {
    id: 15, name: "惡魔", enName: "The Devil", emoji: "⛓",
    essence: "{{NAME}}，這張牌的主題是「看清楚讓你難以放下的習慣」。這張牌提醒你觀察：有沒有某種安排，短時間讓你舒服，長時間卻讓你付出太多代價？",
    blindspot: "你可能把熟悉當成適合，或明知道不舒服，仍因害怕改變而留下。",
    breakthrough: "{{NAME}}可以試著這樣做：寫下這件事帶來的好處與代價。先減少一個讓你負擔過重的部分，需要時也找可信任的人幫忙。",
  },
  {
    id: 16, name: "高塔", enName: "The Tower", emoji: "⚡",
    essence: "{{NAME}}，這張牌的主題是「面對突然的變動」。原本的安排被打亂時，先照顧眼前需要，不必立刻替整個人生下結論。穩定下來後再重新安排。",
    blindspot: "你可能急著恢復原狀，忽略已經改變的條件；也可能覺得所有努力都沒有意義。",
    breakthrough: "{{NAME}}可以試著這樣做：先確認安全、必要支出與可以求助的人，再挑一件最急的事處理。其他安排等資訊清楚後再決定。",
  },
  {
    id: 17, name: "星星", enName: "The Star", emoji: "⭐",
    essence: "{{NAME}}，這張牌的主題是「慢慢恢復希望」。經歷不順後，可以用小小的進展重建信心。希望不一定來自保證，而是知道自己還有下一步。",
    blindspot: "你可能因為害怕再次失望，連小機會都不敢試；也可能只期待好轉，沒有具體安排。",
    breakthrough: "{{NAME}}可以試著這樣做：寫下一件仍值得努力的事，安排一個做得到的小步驟。完成後記錄進展，不必急著和別人比較。",
  },
  {
    id: 18, name: "月亮", enName: "The Moon", emoji: "🌙",
    essence: "{{NAME}}，這張牌的主題是「分清楚擔心與事實」。資訊不完整時，容易把猜測當成答案。先承認不知道，再確認需要了解的事情。",
    blindspot: "你可能把最壞的想像當成即將發生的事，或只憑感覺判斷別人的意思。",
    breakthrough: "{{NAME}}可以試著這樣做：把擔心寫下來，逐項標出已有的事實和自己的猜測。能直接問的就問，暫時無法確認的先保留。",
  },
  {
    id: 19, name: "太陽", enName: "The Sun", emoji: "☀",
    essence: "{{NAME}}，這張牌的主題是「看見進展與喜悅」。有值得高興的成果，可以好好肯定自己。享受順利的時刻，也記得完成必要的準備與檢查。",
    blindspot: "你可能因為過度樂觀而忽略條件，也可能習慣把自己的成果說得很小。",
    breakthrough: "{{NAME}}可以試著這樣做：寫下一件最近做好的事，說明自己付出了什麼。接著確認下一步需要的時間與資源，讓進展能持續。",
  },
  {
    id: 20, name: "審判", enName: "Judgement", emoji: "📯",
    essence: "{{NAME}}，這張牌的主題是「回顧並做新的決定」。過去的經驗可以幫你了解自己，但不必變成一直責怪自己的理由。看清楚後，可以選擇不同做法。",
    blindspot: "你可能反覆後悔，卻沒有處理現在能改變的部分；也可能急著翻篇，忽略需要承擔的責任。",
    breakthrough: "{{NAME}}可以試著這樣做：挑一件仍掛心的事，分清楚需要道歉、補救或放下的部分。先完成一個具體行動，再決定下一步。",
  },
  {
    id: 21, name: "世界", enName: "The World", emoji: "🌐",
    essence: "{{NAME}}，這張牌的主題是「完成一段努力」。完成一件事後，留時間回顧收穫與代價。你可以肯定成果，也可以決定下一階段要保留什麼。",
    blindspot: "你可能還沒休息就急著開始下一件事，或因為結束後空下來而感到不安。",
    breakthrough: "{{NAME}}可以試著這樣做：整理三件這段經驗教你的事，安排一個簡單的慶祝或休息。等自己恢復之後，再選下一個值得投入的目標。",
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
          <div style={{ fontSize: 22, color: "#D4AF37", fontWeight: 700, marginBottom: 16 }}>暫時無法顯示內容</div>
          <p style={{ fontSize: 18, color: "#FFF", lineHeight: 1.8, marginBottom: 24 }}>請重新整理頁面；如果仍無法顯示，請返回御策羅盤再進入。</p>
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
function renderNickHtml(html: string, nick: string): string {
  const n = (nick.trim() || "緣主").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return html.replaceAll("{{NAME}}", `<span style="color:#D4AF37;font-weight:700;text-shadow:0 0 8px rgba(212,175,55,0.4);">${n}</span>`);
}
function GoldTitle({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return <div style={{ fontSize: size, fontWeight: 700, color: "#D4AF37", textShadow: "0 0 12px rgba(212,175,55,0.6),0 0 24px rgba(212,175,55,0.3)", lineHeight: 1.3, animation: "breathe-gold 3s infinite ease-in-out" }}>{children}</div>;
}
function BodyText({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontSize: 18, color: "#FFFFFF", lineHeight: 1.8, margin: 0, ...style }}>{children}</p>;
}
function SectionCard({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <div className="sk-section-card" style={{ background: "linear-gradient(160deg,#111 0%,#0a0a0a 100%)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 16, padding: "22px 18px", marginBottom: 14, ...style }}>{children}</div>;
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
        <GoldTitle size={22}>確認解鎖這份報告？</GoldTitle>
        <p style={{ fontSize: 18, color: "#FFF", lineHeight: 1.8, marginTop: 14, marginBottom: 22 }}>
          解鎖【{modal.label}】將消耗 <span style={{ color: "#D4AF37", fontWeight: 700 }}>{modal.cost}</span> 點，解鎖後可再次閱讀這份生日報告。
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
  const [hasLaunchProfile, setHasLaunchProfile] = useState(false);
  const [launchProfileChecked, setLaunchProfileChecked] = useState(false);
  const [birthday, setBirthday] = useState<BirthdayValue>({ year: 1990, month: 1, day: 1, hour: 12, minute: 0 });
  const [unknownTime, setUnknownTime] = useState(false);
  const [locationLanguage] = useState(() => typeof navigator === "undefined" ? "en" : navigator.language);
  const [countryCode, setCountryCode] = useState(() => defaultCountryForLocale(typeof navigator === "undefined" ? undefined : navigator.language));
  const [cityQuery, setCityQuery] = useState("");
  const [birthplace, setBirthplace] = useState<Birthplace | null>(null);
  const [cityResults, setCityResults] = useState<Birthplace[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [citySearchError, setCitySearchError] = useState<string | null>(null);
  const countryOptions = getBirthplaceCountries(locationLanguage);

  useEffect(() => {
    let active = true;
    void loadLaunchProfile().then(async (profile) => {
      if (!active) return;
      if (!profile) {
        setLaunchProfileChecked(true);
        return;
      }
      setHasLaunchProfile(true);
      setLaunchProfileChecked(true);
      const date = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(profile.birthDate);
      if (!date) return;
      const time = /^(?:[^T]*T)?([0-9]{2}):([0-9]{2})/.exec(profile.birthTime || "");
      setNicknameInput(profile.displayName || "");
      setBirthday({ year: +date[1], month: +date[2], day: +date[3], hour: time ? +time[1] : 12, minute: time ? +time[2] : 0 });
      setUnknownTime(!time);
      const resolvedBirthplace = await launchBirthPlaceToBirthplace(
        profile.birthPlace,
        locationLanguage,
      );
      if (!active) return;

      setBirthplace(resolvedBirthplace);

      if (resolvedBirthplace?.countryCode) {
        setCountryCode(resolvedBirthplace.countryCode);
      }

      setCityQuery(profile.birthPlace.displayName);
    });
    return () => { active = false; };
  }, []);

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
  const [tarotQuestion, setTarotQuestion] = useState("🌟 今天最想整理的事");

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

  useEffect(() => {
    const query = cityQuery.trim();

    if (isProfileLocked || birthplace || query.length < 2) {
      setCityResults([]);
      setIsSearchingCity(false);
      setCitySearchError(null);
      return;
    }

    let isCurrent = true;
    const timer = window.setTimeout(() => {
      setIsSearchingCity(true);
      setCitySearchError(null);

      void searchBirthplaces(query, countryCode || undefined, locationLanguage)
        .then((results) => {
          if (isCurrent) setCityResults(results);
        })
        .catch(() => {
          if (!isCurrent) return;
          setCityResults([]);
          setCitySearchError("出生城市資料暫時無法載入，請稍後再試。");
        })
        .finally(() => {
          if (isCurrent) setIsSearchingCity(false);
        });
    }, 300);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [birthplace, cityQuery, countryCode, isProfileLocked, locationLanguage]);

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
        if (p.birthplace) {
          setCountryCode(p.birthplace.countryCode);
          setBirthplace(p.birthplace);
          setCityQuery(formatBirthplaceLabel(p.birthplace));
        } else {
          setBirthplace(null);
          setCityQuery("");
        }
      } else {
        setBirthplace(null);
        setCityQuery("");
      }
    }
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!birthplace) {
      toast({ title: "請先選擇出生城市", description: "請選擇國家並從城市搜尋結果中點選一個城市。", variant: "destructive" });
      return;
    }
    const nick = nicknameInput.trim() || "緣主";
    const key = buildProfileKey(nick, birthday, birthplace.id);
    const legacyKey = buildLegacyProfileKey(nick, birthday);
    setNickname(nick);
    setConfirmedUserKey(key);
    setIsProfileLocked(true);
    const saved = loadUnlockedModulesForKey(key, legacyKey);
    setUnlockedModules(saved);
    saveProfileEntry(nick, birthday, unknownTime, birthplace);
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
      toast({ title: "點數不足", description: `需要 ${cost} 點，目前餘額 ${points} 點。`, variant: "destructive" });
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
  const natal = useMemo(() => birthplace ? calculateNatalChart({birthDate:`${String(birthday.year).padStart(4,'0')}-${String(birthday.month).padStart(2,'0')}-${String(birthday.day).padStart(2,'0')}`,birthTime:unknownTime ? null : `${String(birthday.hour).padStart(2,'0')}:${String(birthday.minute).padStart(2,'0')}`,timeZone:birthplace.timeZone,latitude:birthplace.latitude,longitude:birthplace.longitude}) : {status:'invalid-input' as const,reason:'missing-birthplace'}, [birthday.year,birthday.month,birthday.day,birthday.hour,birthday.minute,unknownTime,birthplace]);
  const facts = useMemo(() => buildNatalReadingFacts(natal), [natal]);
  const hasExactPlanets = natal.status === 'ready' || natal.status === 'houses-unavailable';
  const profile        = getBirthdayProfile(birthday.month, birthday.day, facts.signs.sun);
  const tripleSign = hasExactPlanets ? getTripleSignProfile(birthday.year,birthday.month,birthday.day,birthday.hour,birthday.minute,birthplace ?? undefined,{sun:facts.signs.sun!,moon:facts.signs.moon!,rising:facts.risingSign ?? '未能確定'}) : {sunSign:facts.signs.sun ?? '未能確定',moonSign:facts.signs.moon ?? '未能確定',risingSign:'未能確定',basicDescription:'沒有出生時間，無法確定上升星座；請先看下方的可能星座範圍。',deepProfile:''};
  const planets = hasExactPlanets ? getPlanetDeconstruction(birthday.month,birthday.day,birthday.year,birthday.hour,birthday.minute,facts.signs as Record<'venus'|'jupiter'|'mercury'|'mars'|'saturn',string>) : [];
  const monthly        = getMonthlyForecast(birthday.month, birthday.day);
  const yearlyOverview = getYearlyOverview();
  const careerForecast = getCareerForecast(birthday.year, birthday.month, birthday.day);
  const loveForecast   = getLoveForecast(birthday.year, birthday.month, birthday.day);
  const wealthForecast = getWealthForecast(birthday.year, birthday.month, birthday.day);
  const soulmateCategories = getSoulmateCategories();
  const relationshipEvidenceDomain: Record<SoulmateCategory, PaidReadingDomain> = { partner: "partner", boss: "boss", colleague: "colleague", friend: "friend" };
  const mercury        = getMercuryRetrogradeStatus();
  const destinyReport = hasExactPlanets ? getBirthdayDestinyReport(birthday.year,birthday.month,birthday.day,birthday.hour,birthday.minute,{sun:facts.signs.sun!,moon:facts.signs.moon!}) : {sunText:'出生資料未完整確認，暫時無法提供太陽星座解讀。',moonText:'月亮可能跨越兩個星座，請先看本命星盤列出的可能範圍。',...getDateDestinyReport(birthday.year,birthday.month,birthday.day)};

  // 3-card tarot spread seeded by birthday (past / present / future)
  const tarotSeed  = (birthday.year % 100) * 13 + birthday.month * 7 + birthday.day * 3;
  const tarotCard1 = MAJOR_ARCANA[tarotSeed % 22];
  const tarotCard2 = MAJOR_ARCANA[(tarotSeed + 7) % 22];
  const tarotCard3 = MAJOR_ARCANA[(tarotSeed + 14) % 22];

  /* ═══════════════════ RENDER ════════════════════════════════════ */
  return (
    <ErrorBoundary>
      <div className="sk-app" style={{ minHeight: "100dvh", background: "#0D0D0D", color: "#FFF", fontFamily: "'Noto Serif SC',serif", paddingBottom: isUnlocked ? 84 : 32, userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}>

        {/* ── Top bar — single gold capsule ───────────────────────── */}
        <div style={{ position: "fixed", top: 12, right: 12, zIndex: 200 }}>
          <button onClick={e => { e.preventDefault(); setShowTopup(true); }} data-testid="btn-topup"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(212,175,55,0.55)", borderRadius: 100, color: "#D4AF37", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 0 12px rgba(212,175,55,0.2)", letterSpacing: "0.03em" }}>
            🪙 {points} 點
          </button>
        </div>

        {/* ── Input section ───────────────────────────────────────── */}
        <header className="sk-hero" style={{ padding: "40px 18px 20px", textAlign: "center" }}>
          <AnimatedAstrolabe timeInteracting={timeInteracting} />
          <GoldTitle size={28}>星穹密鑰</GoldTitle>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", margin: "6px 0 22px" }}>西洋占星・觀勢</p>

          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 16, padding: "20px 14px" }}>
            {!launchProfileChecked ? (
              <div style={{ padding: "24px 14px", color: "#C9A84C" }}>正在載入你的出生資料…</div>
            ) : hasLaunchProfile ? (
              <div style={{ padding: "18px 14px", background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 12, textAlign: "left" }}>
                <p style={{ fontSize: 16, color: "#D4AF37", fontWeight: 700, marginBottom: 10 }}>已載入你的出生資料</p>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.8, margin: 0 }}>
                  {nicknameInput || "緣主"} 的出生資料已從御策羅盤帶入，可以直接查看星盤。
                </p>
              </div>
            ) : (
              <div style={{ padding: "18px 14px", background: "rgba(255,180,120,0.06)", border: "1px solid rgba(255,180,120,0.3)", borderRadius: 12, textAlign: "left" }}>
                <p style={{ fontSize: 16, color: "#FFD0A8", fontWeight: 700, marginBottom: 10 }}>請從御策羅盤的天機閣進入</p>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.8, margin: 0 }}>
                  請先在御策羅盤確認出生資料，再從天機閣進入星穹密鑰。
                </p>
              </div>
            )}

            {/* Action buttons */}
            {isProfileLocked ? (
              <button onClick={handleEditProfile} data-testid="btn-edit-profile"
                style={{ marginTop: 14, width: "100%", padding: "12px 0", background: "transparent", border: "1px solid rgba(212,175,55,0.5)", color: "#D4AF37", fontWeight: 600, fontSize: 15, borderRadius: 100, cursor: "pointer", letterSpacing: "0.04em" }}>
                ✏️ 修改資料
              </button>
            ) : hasLaunchProfile ? (
              <button onClick={handleConfirm} data-testid="btn-unlock-main"
                style={{ marginTop: 18, width: "100%", padding: "14px 0", background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, fontSize: 17, border: "none", borderRadius: 100, cursor: "pointer", boxShadow: "0 0 22px rgba(212,175,55,0.5)", letterSpacing: "0.05em" }}>
                {isUnlocked ? "✦ 更新星盤" : "查看星盤"}
              </button>
            ) : (
              <a href="https://www.yuceluopan.com/create-subject" data-testid="link-create-profile"
                style={{ display: "block", marginTop: 18, width: "100%", padding: "14px 0", background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, fontSize: 17, borderRadius: 100, textAlign: "center", textDecoration: "none", boxShadow: "0 0 22px rgba(212,175,55,0.5)", letterSpacing: "0.05em" }}>
                確認出生資料
              </a>
            )}
          </div>
        </header>

        {/* Function navigation */}
        {isUnlocked && (
          <nav className="sk-tabs" aria-label="星穹密鑰功能">
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined} onClick={e => { e.preventDefault(); handleTabSwitch(tab.id); }} data-testid={`tab-${tab.id}`}
                  style={{ flex: 1, padding: "10px 0 13px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer", color: active ? "#D4AF37" : "rgba(255,255,255,0.35)", transition: "all 0.2s", borderTop: active ? "2px solid #D4AF37" : "2px solid transparent" }}>
                  <span style={{ fontSize: 17, lineHeight: 1, textShadow: active ? "0 0 10px rgba(212,175,55,0.7)" : "none" }}>{tab.glyph}</span>
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: "0.03em" }}>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}


        {/* ── Scroll anchor ────────────────────────────────────────── */}
        <div ref={contentRef} />

        {/* ── Tab content ─────────────────────────────────────────── */}
        <AnimatePresence>
          {isUnlocked && (
            <motion.div className="sk-content" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ padding: "0 14px" }}>

              {/* ════ TAB 1: 星穹天機 ════ */}
              {activeTab === "tianguo" && (
                <div>
                  <NatalChart chart={natal} />
                  {hasExactPlanets && <>
                  {/* Soul archetype — free */}
                  <SectionCard>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: "#C9A84C", border: "1px solid rgba(201,168,76,0.4)", padding: "2px 10px", borderRadius: 100 }}>{profile.zodiac}</span>
                      <FreeTag />
                    </div>
                    <div style={{ marginBottom: 12 }}><GoldTitle size={26}>{profile.archetype}</GoldTitle></div>
                    <BodyText>{renderNick(profile.profile, nick)}</BodyText>
                  </SectionCard>

                  {facts.canReadTriangle && <>
                  {/* Triple signs — FREE */}
                  <SectionCard>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <GoldTitle size={20}>太陽、月亮與上升</GoldTitle>
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
                    <div style={{ marginBottom: 8, fontSize: 13, color: "#C9A84C" }}>三個星座一起看 · {birthplace ? formatBirthplaceLabel(birthplace) : "尚未確認出生地"}</div>
                    <BodyText>{renderNick(tripleSign.basicDescription, nick)}</BodyText>
                    <div style={{ marginTop: 18 }}>
                      <MiniLockedSection moduleKey="astroTriangleRatio" label="解鎖目標、情緒與相處方式解析"
                        isUnlocked={unlockedModules.astroTriangleRatio} onRequest={requestUnlock}
                        blurPreview={<p style={{ fontSize: 16, color: "#FFF", lineHeight: 1.8 }}>從太陽與月亮，看看你想追求的目標和真正需要的安心感。這能幫助 <span style={{ color: "#D4AF37", fontWeight: 700 }}>{nick}</span> 更清楚地理解自己……</p>}>
                        <div>
                          <div style={{ fontSize: 13, color: "#C9A84C", marginBottom: 14 }}>✦ 太陽、月亮與上升解析已解鎖 ✦</div>
                          <div
                            style={{ fontFamily: "'Noto Serif SC',serif" }}
                            dangerouslySetInnerHTML={{ __html: renderNickHtml(tripleSign.deepProfile, nick) }}
                          />
                        </div>
                      </MiniLockedSection>
                    </div>
                  </SectionCard>

                  </>}
                  {/* Planets — sign + core text FREE, deep analysis 6pts (all 5 bundled) */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingLeft: 4 }}>
                      <GoldTitle size={18}>五顆行星與生活習慣</GoldTitle>
                      <span style={{ fontSize: 11, color: "#4AFF8C", border: "1px solid rgba(74,255,140,0.35)", padding: "2px 8px", borderRadius: 100 }}>星座免費</span>
                      <span style={{ fontSize: 11, color: "rgba(212,175,55,0.5)", background: "rgba(212,175,55,0.08)", padding: "2px 8px", borderRadius: 100, border: "1px solid rgba(212,175,55,0.2)" }}>五顆行星解析 {starTarotPricing.allFivePlanets} 點</span>
                    </div>
                    {/* ── Unlock button at TOP ── */}
                    {!unlockedModules.allFivePlanets && (
                      <button onClick={e => { e.preventDefault(); requestUnlock("allFivePlanets", "五顆行星解析"); }} data-testid="btn-unlock-allFivePlanets"
                        style={{ width: "100%", marginBottom: 14, padding: "14px 0", background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 100, cursor: "pointer", boxShadow: "0 0 14px rgba(212,175,55,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <Lock size={15} /> 解鎖五顆行星解析（{starTarotPricing.allFivePlanets} 點）
                      </button>
                    )}
                    {!!unlockedModules.allFivePlanets && (
                      <div style={{ marginBottom: 12, textAlign: "center", fontSize: 12, color: "rgba(74,255,140,0.7)", border: "1px solid rgba(74,255,140,0.25)", borderRadius: 100, padding: "4px 0" }}>✦ 五顆行星解析已解鎖 ✦</div>
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
                              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>所在星座</div>
                              <div style={{ fontSize: 26, fontWeight: 700, color: "#FFD666", textShadow: "0 0 14px rgba(255,214,102,0.7),0 0 28px rgba(255,214,102,0.35)", letterSpacing: "0.04em" }}>{p.sign}</div>
                            </div>
                            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, margin: "8px 0 0", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>{p.coreText}</p>
                            {!!unlockedModules.allFivePlanets && (
                              <div style={{ marginTop: 12, background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 10, padding: "12px 14px" }}>
                                <div
                                  style={{ fontFamily: "'Noto Serif SC',serif" }}
                                  dangerouslySetInnerHTML={{ __html: renderNickHtml(p.analysis, nick) }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  </>}
                </div>
              )}

              {/* ════ TAB 2: 量子塔羅 ════ */}
              {activeTab === "tarot" && (
                <div>
                  {/* Rules banner */}
                  <div style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
                    <p style={{ fontSize: 15, color: "#D4AF37", lineHeight: 1.85, margin: 0, textShadow: "0 0 10px rgba(212,175,55,0.35)", fontWeight: 600 }}>
                      🔮 先選一個想思考的主題，再翻開三張牌，從「過去、現在、未來」整理想法。消耗 {starTarotPricing.tarotDivination} 點即可查看牌義、容易忽略的事，以及可以嘗試的做法。
                    </p>
                  </div>

                  <SectionCard>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <GoldTitle size={20}>三張牌看一個問題</GoldTitle>
                      <span style={{ fontSize: 12, color: "rgba(212,175,55,0.4)" }}>{starTarotPricing.tarotDivination} 點</span>
                    </div>

                    {/* Question dropdown */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, color: "#C9A84C", fontWeight: 600, marginBottom: 6 }}>🙏 想思考的主題</div>
                      <select value={tarotQuestion} onChange={e => setTarotQuestion(e.target.value)}
                        style={{ width: "100%", padding: "11px 12px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(212,175,55,0.45)", borderRadius: 10, color: "#D4AF37", fontSize: 14, fontFamily: "'Noto Serif SC',serif", outline: "none", cursor: "pointer", userSelect: "text", WebkitUserSelect: "text" }}>
                        {["🌟 今天最想整理的事","💰 工作與收支","❤️ 感情與相處","🎯 正在猶豫的選擇","🌿 休息與生活步調","✨ 新機會與合作"].map(q => (
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
                        <button onClick={e => { e.preventDefault(); requestUnlock("tarotDivination", "三張牌看一個問題"); }} data-testid="btn-unlock-tarotDivination"
                          style={{ width: "100%", padding: "14px 0", background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 100, cursor: "pointer", boxShadow: "0 0 14px rgba(212,175,55,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <Lock size={15} /> 翻開三張牌（{starTarotPricing.tarotDivination} 點）
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
                              <div style={{ fontSize: 12, color: "#FFD666", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><span>✦</span> 這張牌的意思</div>
                              <BodyText style={{ fontSize: 16 }}>{renderNick(card.essence, nick)}</BodyText>
                            </div>
                            {/* Blindspot */}
                            <div style={{ marginBottom: 12, background: "rgba(255,107,74,0.05)", border: "1px solid rgba(255,107,74,0.15)", borderRadius: 10, padding: "12px 14px" }}>
                              <div style={{ fontSize: 12, color: "#FF9F7A", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><span>⚠</span> 容易忽略的事</div>
                              <BodyText style={{ fontSize: 16 }}>{renderNick(card.blindspot, nick)}</BodyText>
                            </div>
                            {/* Breakthrough */}
                            <div style={{ background: "rgba(74,255,140,0.05)", border: "1px solid rgba(74,255,140,0.15)", borderRadius: 10, padding: "12px 14px" }}>
                              <div style={{ fontSize: 12, color: "#4AFF8C", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><span>⚡</span> 可以嘗試的做法</div>
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
                      <GoldTitle size={20}>溝通與行程提醒</GoldTitle>
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
                      <GoldTitle size={20}>本月生活提醒</GoldTitle>
                      <FreeTag />
                    </div>
                    <BodyText>{renderNick(monthly, nick)}</BodyText>
                  </SectionCard>

                  {/* Yearly — unified 10pt unlock */}
                  <SectionCard>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <GoldTitle size={20}>今年生活規劃</GoldTitle>
                      <FreeTag />
                    </div>
                    <div style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.18)", borderRadius: 12, padding: "16px 14px", marginBottom: 18 }}>
                      <div style={{ fontSize: 13, color: "#C9A84C", marginBottom: 10 }}>✦ 年度生活提醒 ✦</div>
                      <BodyText>{yearlyOverview}</BodyText>
                    </div>
                    <MiniLockedSection moduleKey="yearlyTotalDestiny" label={`解鎖 ${nick} 工作、感情與收支提醒`}
                      isUnlocked={!!unlockedModules.yearlyTotalDestiny} onRequest={requestUnlock}
                      blurPreview={
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {[{ icon: "⚡", label: "工作與發展" }, { icon: "♾", label: "感情與相處" }, { icon: "✦", label: "收支與金錢習慣" }].map(({ icon, label }) => (
                            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 16, color: "#D4AF37" }}>{icon}</span>
                              <div style={{ height: 13, background: "rgba(212,175,55,0.12)", borderRadius: 6, flex: 1 }} />
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{label}</span>
                            </div>
                          ))}
                        </div>
                      }>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ fontSize: 13, color: "#C9A84C", textAlign: "center", marginBottom: 4, letterSpacing: "0.06em" }}>✦ 工作、感情與收支提醒已解鎖 ✦</div>
                        {([
                          { label: "⚡ 工作與發展", color: "#FFD666", bg: "rgba(255,214,102,0.05)", border: "rgba(255,214,102,0.2)", text: careerForecast },
                          { label: "♾ 感情與相處", color: "#C4A3FF", bg: "rgba(196,163,255,0.05)", border: "rgba(196,163,255,0.2)", text: loveForecast },
                          { label: "✦ 收支與金錢習慣", color: "#4AFF8C", bg: "rgba(74,255,140,0.05)", border: "rgba(74,255,140,0.15)", text: wealthForecast },
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

              {/* ════ TAB 5: 生日與個性 ════ */}
              {activeTab === "birthday" && (
                <div>
                  <SectionCard>
                    {/* Announcement banner */}
                    <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#D4AF37", lineHeight: 1.8, margin: 0, textShadow: "0 0 10px rgba(212,175,55,0.4)" }}>
                        這份報告包含目標、情緒與生命靈數三個主題，可用 2 點解鎖。請先看免費內容，再決定是否需要深入閱讀。
                    </p>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <GoldTitle size={20}>生日與個性</GoldTitle>
                      <span style={{ fontSize: 12, color: "#C9A84C", border: "1px solid rgba(212,175,55,0.35)", padding: "2px 10px", borderRadius: 100 }}>閱讀個性解析 {starTarotPricing.birthdayDestiny} 點</span>
                    </div>

                    <MiniLockedSection
                      moduleKey="birthdayDestiny"
                      label="解鎖目標、情緒與生命靈數解析"
                      isUnlocked={!!unlockedModules.birthdayDestiny}
                      onRequest={requestUnlock}
                      blurPreview={
                        <div>
                          <p style={{ fontSize: 17, color: "#FFD666", fontWeight: 700, lineHeight: 1.8, marginBottom: 6 }}>
                            {birthday.month}月{birthday.day}日生的你是...
                          </p>
                          <p style={{ fontSize: 16, color: "#FFF", lineHeight: 1.8 }}>
                            <span style={{ color: "#FFD666", fontWeight: 700 }}>【目標與做事風格】</span><br />
                            {destinyReport.sunText.replace(/\{\{NAME\}\}/g, nick).substring(0, 30)}……
                          </p>
                          <p style={{ fontSize: 16, color: "#FFF", lineHeight: 1.8, marginTop: 8 }}>
                            <span style={{ color: "#B8D4FF", fontWeight: 700 }}>【感受與安心來源】</span><br />
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

                        <div style={{ fontSize: 13, color: "#C9A84C", textAlign: "center", marginBottom: 16, letterSpacing: "0.06em" }}>✦ 生日個性解析已解鎖 ✦</div>

                        {/* Section 1: Sun */}
                        <div style={{ background: "rgba(255,214,102,0.05)", border: "1px solid rgba(255,214,102,0.2)", borderRadius: 12, padding: "16px 14px", marginBottom: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 18 }}>☀</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "#FFD666" }}>太陽：你的目標與做事風格</span>
                          </div>
                          <BodyText style={{ fontSize: 17 }}>{renderNick(destinyReport.sunText, nick)}</BodyText>
                        </div>

                        {/* Section 2: Moon */}
                        <div style={{ background: "rgba(184,212,255,0.05)", border: "1px solid rgba(184,212,255,0.18)", borderRadius: 12, padding: "16px 14px", marginBottom: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 18 }}>🌙</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "#B8D4FF" }}>月亮：你的感受與安心來源</span>
                          </div>
                          <BodyText style={{ fontSize: 17 }}>{renderNick(destinyReport.moonText, nick)}</BodyText>
                        </div>

                        {/* Section 3: Life Path */}
                        <div style={{ background: "rgba(196,163,255,0.05)", border: "1px solid rgba(196,163,255,0.18)", borderRadius: 12, padding: "16px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 18 }}>✦</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "#C4A3FF" }}>生命靈數 {destinyReport.lifePathNum} · 個性觀察</span>
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
                      <GoldTitle size={20}>不同關係的相處提醒</GoldTitle>
                      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginTop: 6, lineHeight: 1.7 }}>
                        從星座角度，看看 <span style={{ color: "#D4AF37", fontWeight: 700 }}>{nick}</span> 在伴侶、上司、同事與朋友關係裡，可以留意哪些相處習慣（每項 4 點）。
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {soulmateCategories.map(({ key, icon }) => {
                        const mKey  = SOULMATE_PRICING_KEYS[key];
                        const dLabel = SOULMATE_LABELS[key] || key;
                        const sm    = getSoulmateProfile(birthday.month, birthday.day, key as SoulmateCategory);
                        const relationshipReading = hasExactPlanets ? buildRelationshipReading(facts, relationshipEvidenceDomain[key as SoulmateCategory] as "partner" | "boss" | "colleague" | "friend", sm.analysis) : sm.analysis;
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
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", alignSelf: "center" }}></span>
                            </div>
                            <div style={{ padding: "8px 16px 14px" }}>
                              <MiniLockedSection moduleKey={mKey} label={`解鎖${dLabel}深度報告`}
                                isUnlocked={isU} onRequest={requestUnlock}
                                blurPreview={<p style={{ fontSize: 15, color: "#FFF", lineHeight: 1.8 }}>{sm.analysis.replace(/\{\{NAME\}\}/g, nick).substring(0, 30)}……</p>}>
                                <div>
                                  <BodyText style={{ fontSize: 16, whiteSpace: "pre-line" }}>{renderNick(relationshipReading, nick)}</BodyText>
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
                    <div style={{ marginBottom: 14 }}><GoldTitle size={20}>量子共鳴 · 兩個人的相處</GoldTitle></div>
                    <BodyText style={{ marginBottom: 14 }}>選擇對方的出生月日，查看相處提醒。參考分數免費；溝通、合作與日常相處報告 10 點。</BodyText>
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
                              <span style={{ fontSize: 12, color: "#C9A84C" }}>🙋 不確定對方的生日</span>
                            </label>
                            {partnerUnknownTime && (
                              <div style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.28)", borderRadius: 12, padding: "14px 16px" }}>
                                <p style={{ fontSize: 18, color: "#FFF", lineHeight: 1.8, margin: 0 }}>💡 <span style={{ color: "#D4AF37", fontWeight: 700 }}>星穹提示：</span>目前只根據雙方的出生月日提供相處提醒，不包含上升星座與宮位分析。參考分數不是感情成功的機率；若生日不確定，請先確認再比較。</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <button onClick={e => { e.preventDefault(); setCompatibilityResult(getCompatibility(birthday.month, birthday.day, partnerBirthday.month, partnerBirthday.day)); }} data-testid="btn-compare"
                      style={{ width: "100%", padding: "12px 0", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.45)", borderRadius: 100, color: "#D4AF37", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 14 }}>
                      查看相處提醒（免費）
                    </button>
                    <AnimatePresence>
                      {compatibilityResult && (
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ borderTop: "1px solid rgba(212,175,55,0.15)", paddingTop: 18 }}>
                          <div style={{ textAlign: "center", marginBottom: 16 }}>
                            <div style={{ fontSize: 52, fontWeight: 700, color: "#D4AF37", textShadow: "0 0 20px rgba(212,175,55,0.7),0 0 40px rgba(212,175,55,0.3)", lineHeight: 1.1 }}>{compatibilityResult.score} 分</div>
                            <p style={{ fontSize: 12, color: "rgba(212,175,55,0.55)", marginTop: 4 }}>相處參考分數 · {compatibilityResult.crossNote}</p>
                            <p style={{ fontSize: 18, color: "#FFF", lineHeight: 1.8, marginTop: 8 }}>{compatibilityResult.summary}</p>
                          </div>
                          <MiniLockedSection moduleKey="friendCompatibility" label="解鎖溝通、合作與日常相處提醒"
                            isUnlocked={!!unlockedModules.friendCompatibility} onRequest={requestUnlock}
                            blurPreview={<div style={{ height: 60, background: "rgba(212,175,55,0.05)", borderRadius: 8 }}/>}>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                              {[
                                { label: "⚠ 容易卡住的地方",    color: "#FF9F7A", bg: "rgba(255,107,74,0.05)", border: "rgba(255,107,74,0.2)", text: compatibilityResult.sections.blindSpots },
                                { label: "⚡ 可以一起發揮的長處",  color: "#FFD666", bg: "rgba(255,214,102,0.05)", border: "rgba(255,214,102,0.2)", text: compatibilityResult.sections.superPowers },
                                { label: "◎ 今年可以練習的相處方式", color: "#B8D4FF", bg: "rgba(184,212,255,0.05)", border: "rgba(184,212,255,0.18)", text: compatibilityResult.sections.yearlyResonance },
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
            💡 內容提供自我觀察與日常思考的角度。重要的生活決定，仍要考慮實際情況與自己的需要。
          </p>
        </footer>

        <TopupModal open={showTopup} onOpenChange={setShowTopup} />
        {confirmModal && <UnlockConfirmModal modal={confirmModal} onConfirm={confirmUnlock} onClose={() => setConfirmModal(null)} />}
      </div>
    </ErrorBoundary>
  );
}
