import React, { useState, useCallback, useRef, useEffect, ReactNode, Component } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Coins } from "lucide-react";
import { BirthdayWheels, SimpleBirthdayWheels, BirthdayValue } from "@/components/BirthdayWheels";
import { TopupModal } from "@/components/TopupModal";
import { usePoints } from "@/contexts/PointsContext";
import { useNickname } from "@/contexts/NicknameContext";
import { useToast } from "@/hooks/use-toast";
import { getBirthdayProfile, getTripleSignProfile } from "@/lib/astrology";
import { getPlanetDeconstruction } from "@/lib/planets";
import { getMonthlyForecast, getYearlyOverview, getCareerForecast, getLoveForecast, getWealthForecast } from "@/lib/forecast";
import { getSoulmateProfile, getSoulmateCategories, type SoulmateCategory } from "@/lib/soulmate";
import { getCompatibility } from "@/lib/compatibility";
import { getMercuryRetrogradeStatus } from "@/lib/mercury";

/* ─── Pricing ──────────────────────────────────────────────────── */
const starTarotPricing = {
  astroTriangleRatio: 12,
  tarotDivination: 6,
  monthlyBlueprint: 6,
  friendCompatibility: 10,
  careerDestiny: 10,
  loveDestiny: 10,
  wealthDestiny: 10,
  spouseMatch: 4,
  bossMatch: 4,
  colleagueMatch: 4,
  friendMatch: 4,
  venusDeep: 2,
  jupiterDeep: 2,
  mercuryDeep: 2,
  marsDeep: 2,
  saturnDeep: 2,
} as const;
type PricingKey = keyof typeof starTarotPricing;

/* ─── Tabs ──────────────────────────────────────────────────────── */
type TabId = "tianguo" | "tarot" | "shikong" | "resonance";
const TABS: { id: TabId; label: string; glyph: string }[] = [
  { id: "tianguo", label: "星穹天機", glyph: "✦" },
  { id: "tarot",   label: "量子塔羅", glyph: "🔮" },
  { id: "shikong", label: "時空流轉", glyph: "◎" },
  { id: "resonance", label: "量子共鳴", glyph: "⟡" },
];

const PLANET_KEYS: Record<string, PricingKey> = {
  金星: "venusDeep", 木星: "jupiterDeep", 水星: "mercuryDeep", 火星: "marsDeep", 土星: "saturnDeep",
};
const SOULMATE_PRICING_KEYS: Record<string, PricingKey> = {
  spouse: "spouseMatch", boss: "bossMatch", colleague: "colleagueMatch", friend: "friendMatch",
};
const SOULMATE_LABELS: Record<string, string> = {
  spouse: "天命配偶歸宿", boss: "提攜貴人上司", colleague: "專案執行同事", friend: "解壓傾聽朋友",
};

const TAROT_CARDS = ["🌙", "⭐", "☀️", "🔮", "⚡", "🌊", "🔥", "🌿"];
const TAROT_MEANINGS = [
  "月亮牌逆位：{{NAME}} 的直覺正在穿越迷霧，請相信那些尚未清晰的內在聲音，它正引領你通往一個更真實的自我。",
  "星星牌正位：宇宙對 {{NAME}} 發出了明確的希望信號。即便前路看似漫長，每一步都被星光照亮——你走對了方向。",
  "太陽牌正位：{{NAME}} 正迎來一段純粹的高光時刻。讓自己被看見、被聽到，你的光芒就是世界需要的禮物。",
  "高女祭司：{{NAME}} 握有一把神秘的智慧鑰匙，那是外人無法輕易獲得的洞見。此刻請靜觀，答案自在內心深處。",
  "命運之輪：{{NAME}} 正站在一個關鍵的轉折點上，宇宙之輪開始轉動，一切皆有其時，請敞開心迎接即將到來的改變。",
  "戰車牌：{{NAME}} 的意志力此刻達到最高峰。堅定方向，不要因外界聲音而動搖，勝利屬於那個堅持到最後的你。",
  "力量牌：{{NAME}} 內在那頭沉睡的獅子正在甦醒。真正的力量不是壓制，而是以溫柔的意志馴服所有恐懼。",
  "皇后牌：{{NAME}} 正處於豐盛顯化的最佳頻率。種下的善意與付出，即將以你意想不到的美好形式回流。",
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
  const { points, deductPoints } = usePoints();
  const { toast } = useToast();

  // Input
  const [nicknameInput, setNicknameInput] = useState("");
  const [birthday, setBirthday] = useState<BirthdayValue>({ year: 1990, month: 1, day: 1, hour: 12, minute: 0 });
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [kbInput, setKbInput] = useState({ year: "1990", month: "01", day: "01", hour: "12", minute: "00" });

  // App state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("tianguo");
  const [timeInteracting, setTimeInteracting] = useState(false);
  const [unlockedModules, setUnlockedModules] = useState<Record<string, boolean>>({});
  const [confirmModal, setConfirmModal] = useState<ConfirmState | null>(null);
  const [showTopup, setShowTopup] = useState(false);
  const [compatibilityResult, setCompatibilityResult] = useState<ReturnType<typeof getCompatibility> | null>(null);
  const [partnerBirthday, setPartnerBirthday] = useState({ year: 1990, month: 6, day: 15 });
  const [tarotDrawn, setTarotDrawn] = useState<number | null>(null);

  // Scroll anchor just below unlock button
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Copy / context-menu prevention ──────────────────────────────
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    const preventKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["c","a","x","u","s"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("copy", prevent);
    document.addEventListener("keydown", preventKey);
    return () => {
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("copy", prevent);
      document.removeEventListener("keydown", preventKey);
    };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleUnlock = (e: React.MouseEvent) => {
    e.preventDefault();
    let bd = birthday;
    if (isKeyboardMode) {
      const y   = Math.max(1900, Math.min(2099, parseInt(kbInput.year)  || 1990));
      const m   = Math.max(1, Math.min(12, parseInt(kbInput.month) || 1));
      const d   = Math.max(1, Math.min(31, parseInt(kbInput.day)   || 1));
      const h   = Math.max(0, Math.min(23, parseInt(kbInput.hour)  || 12));
      const min = Math.max(0, Math.min(59, parseInt(kbInput.minute)|| 0));
      bd = { year: y, month: m, day: d, hour: h, minute: min };
      setBirthday(bd);
    }
    setNickname(nicknameInput);
    setIsUnlocked(true);
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
    if (deductPoints(confirmModal.cost)) setUnlockedModules(prev => ({ ...prev, [confirmModal.key]: true }));
    setConfirmModal(null);
  };

  // ── Derived data ─────────────────────────────────────────────────
  const nick         = nickname.trim() || nicknameInput.trim() || "緣主";
  const profile      = getBirthdayProfile(birthday.month, birthday.day);
  const tripleSign   = getTripleSignProfile(birthday.year, birthday.month, birthday.day, birthday.hour, birthday.minute);
  const planets      = getPlanetDeconstruction(birthday.month, birthday.day, birthday.year, birthday.hour, birthday.minute);
  const monthly      = getMonthlyForecast(birthday.month, birthday.day);
  const yearlyOverview = getYearlyOverview();
  const careerForecast = getCareerForecast(birthday.year, birthday.month, birthday.day);
  const loveForecast   = getLoveForecast(birthday.year, birthday.month, birthday.day);
  const wealthForecast = getWealthForecast(birthday.year, birthday.month, birthday.day);
  const soulmateCategories = getSoulmateCategories();
  const mercury      = getMercuryRetrogradeStatus();
  const tarotIdx     = tarotDrawn ?? ((birthday.month + birthday.day + birthday.hour) % TAROT_MEANINGS.length);

  /* ═══════════════════ RENDER ════════════════════════════════════ */
  return (
    <ErrorBoundary>
      <div style={{ minHeight: "100dvh", background: "#0D0D0D", color: "#FFF", fontFamily: "'Noto Serif SC',serif", paddingBottom: isUnlocked ? 84 : 32, userSelect: "none", WebkitUserSelect: "none" }}>

        {/* ── Top bar ─────────────────────────────────────────────── */}
        <div style={{ position: "fixed", top: 12, right: 12, zIndex: 200 }}>
          <button onClick={e => { e.preventDefault(); setShowTopup(true); }} data-testid="btn-topup"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", border: "1px solid rgba(212,175,55,0.5)", borderRadius: 100, color: "#D4AF37", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Coins size={14} /> {points} 點
          </button>
        </div>

        {/* ── Input section ───────────────────────────────────────── */}
        <div style={{ padding: "40px 18px 20px", textAlign: "center" }}>
          <AnimatedAstrolabe timeInteracting={timeInteracting} />
          <GoldTitle size={28}>星穹密鑰</GoldTitle>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", margin: "6px 0 22px" }}>AI 塔羅與星盤探索</p>

          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 16, padding: "20px 14px" }}>
            <p style={{ fontSize: 17, color: "#FFF", marginBottom: 14, lineHeight: 1.7 }}>「請輸入您的生辰軌跡以解鎖密鑰」</p>

            {/* Nickname */}
            <input type="text" value={nicknameInput} onChange={e => setNicknameInput(e.target.value)}
              placeholder="請輸入您的專屬暱稱（如：緣主、William）"
              maxLength={12} data-testid="input-nickname"
              style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 10, color: "#D4AF37", fontSize: 16, fontFamily: "inherit", outline: "none", marginBottom: 14, caretColor: "#D4AF37", userSelect: "text", WebkitUserSelect: "text" }}
            />

            {/* Mode toggle */}
            <button onClick={e => { e.preventDefault(); setIsKeyboardMode(prev => !prev); }}
              style={{ marginBottom: 14, padding: "7px 16px", background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 100, color: "#C9A84C", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              {isKeyboardMode ? "🎡 切換星盤滾輪選擇" : "⌨️ 切換鍵盤手動輸入"}
            </button>

            {/* Wheel or keyboard picker */}
            {isKeyboardMode ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 4 }}>
                {([
                  { label: "年", key: "year", ph: "YYYY", max: 4 },
                  { label: "月", key: "month", ph: "MM", max: 2 },
                  { label: "日", key: "day", ph: "DD", max: 2 },
                  { label: "時", key: "hour", ph: "HH", max: 2 },
                  { label: "分", key: "minute", ph: "mm", max: 2 },
                ] as const).map(({ label, key, ph, max }) => (
                  <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 12, color: "#C9A84C", fontWeight: 600 }}>{label}</span>
                    <input type="text" inputMode="numeric" pattern="[0-9]*"
                      value={kbInput[key]}
                      onChange={e => { const v = e.target.value.replace(/\D/g,"").slice(0,max); setKbInput(prev=>({...prev,[key]:v})); }}
                      placeholder={ph}
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 2px", textAlign: "center", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 8, color: "#D4AF37", fontSize: 14, fontFamily: "monospace", outline: "none", caretColor: "#D4AF37", userSelect: "text", WebkitUserSelect: "text" }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <BirthdayWheels value={birthday} onChange={setBirthday} testIdPrefix="main" onTimeInteract={handleTimeInteract} />
            )}

            <button onClick={handleUnlock} data-testid="btn-unlock-main"
              style={{ marginTop: 18, width: "100%", padding: "14px 0", background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, fontSize: 17, border: "none", borderRadius: 100, cursor: "pointer", boxShadow: "0 0 22px rgba(212,175,55,0.5)", letterSpacing: "0.05em" }}>
              解鎖星盤
            </button>
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

                  {/* Planets — sign + core text FREE, deep analysis locked 2pts */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingLeft: 4 }}>
                      <GoldTitle size={18}>五行行星落座</GoldTitle>
                      <span style={{ fontSize: 11, color: "#4AFF8C", border: "1px solid rgba(74,255,140,0.35)", padding: "2px 8px", borderRadius: 100 }}>星座免費</span>
                      <span style={{ fontSize: 11, color: "rgba(212,175,55,0.5)", background: "rgba(212,175,55,0.08)", padding: "2px 8px", borderRadius: 100, border: "1px solid rgba(212,175,55,0.2)" }}>深析 2 點</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {planets.map((p) => {
                        const pKey = PLANET_KEYS[p.planet];
                        return (
                          <div key={p.planet} style={{ background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.22)", borderRadius: 14, overflow: "hidden" }}>

                            {/* ── FREE header: planet + sign ── */}
                            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(212,175,55,0.1)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                <span style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(212,175,55,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4AF37", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{p.element}</span>
                                <div>
                                  <div style={{ color: "#C9A84C", fontWeight: 700, fontSize: 15 }}>{p.planet}</div>
                                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{p.domain}</div>
                                </div>
                                {!!unlockedModules[pKey] && (
                                  <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(74,255,140,0.7)", border: "1px solid rgba(74,255,140,0.3)", padding: "2px 8px", borderRadius: 100 }}>已解鎖</span>
                                )}
                              </div>
                              {/* ★ Sign — prominently displayed for free ★ */}
                              <div style={{ textAlign: "center", padding: "10px 0 6px" }}>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>落入星座</div>
                                <div style={{ fontSize: 26, fontWeight: 700, color: "#FFD666", textShadow: "0 0 14px rgba(255,214,102,0.7),0 0 28px rgba(255,214,102,0.35)", letterSpacing: "0.04em" }}>
                                  {p.sign}
                                </div>
                              </div>
                              {/* Core 1-sentence influence — free */}
                              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, margin: "8px 0 0", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
                                {p.coreText}
                              </p>
                            </div>

                            {/* ── LOCKED: deep analysis ── */}
                            <div style={{ padding: "12px 16px" }}>
                              <MiniLockedSection
                                moduleKey={pKey}
                                label={`${p.planet}深層心理盲區深度解析`}
                                isUnlocked={!!unlockedModules[pKey]}
                                onRequest={requestUnlock}
                                blurPreview={
                                  <p style={{ fontSize: 15, color: "#FFF", lineHeight: 1.8 }}>
                                    {p.analysis.substring(0, 22)}……
                                  </p>
                                }
                              >
                                <BodyText style={{ fontSize: 16 }}>{renderNick(p.analysis, nick)}</BodyText>
                              </MiniLockedSection>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ════ TAB 2: 量子塔羅 ════ */}
              {activeTab === "tarot" && (
                <div>
                  <SectionCard>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <GoldTitle size={22}>每日宇宙牌陣</GoldTitle>
                      <span style={{ fontSize: 12, color: "rgba(212,175,55,0.4)" }}>{starTarotPricing.tarotDivination} 點</span>
                    </div>
                    <BodyText style={{ marginBottom: 18 }}>
                      宇宙為 <span style={{ color: "#D4AF37", fontWeight: 700 }}>{nick}</span> 今日佈下的牌陣正在等待翻開——每一張牌都是高我給予的量子信號。
                    </BodyText>
                    {!unlockedModules.tarotDivination ? (
                      <div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 18 }}>
                          {TAROT_CARDS.map((_, i) => (
                            <div key={i} style={{ aspectRatio: "2/3", background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "rgba(212,175,55,0.4)" }}>?</div>
                          ))}
                        </div>
                        <button onClick={e => { e.preventDefault(); requestUnlock("tarotDivination", "量子塔羅牌陣"); }} data-testid="btn-unlock-tarotDivination"
                          style={{ width: "100%", padding: "13px 0", background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 100, cursor: "pointer", boxShadow: "0 0 14px rgba(212,175,55,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <Lock size={15} /> 翻開今日牌陣 ({starTarotPricing.tarotDivination} 點)
                        </button>
                      </div>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
                          {TAROT_CARDS.map((c, i) => {
                            const sel = i === (tarotDrawn ?? tarotIdx);
                            return (
                              <div key={i} onClick={e => { e.preventDefault(); setTarotDrawn(i % TAROT_MEANINGS.length); }}
                                style={{ aspectRatio: "2/3", background: sel ? "rgba(212,175,55,0.18)" : "rgba(212,175,55,0.06)", border: `1px solid ${sel ? "#D4AF37" : "rgba(212,175,55,0.2)"}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, cursor: "pointer", boxShadow: sel ? "0 0 14px rgba(212,175,55,0.5)" : "none", transition: "all 0.2s" }}>
                                {c}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(212,175,55,0.28)", borderRadius: 14, padding: "18px 16px" }}>
                          <div style={{ fontSize: 13, color: "#C9A84C", marginBottom: 10, letterSpacing: "0.06em" }}>✦ 今日牌義揭示 ✦</div>
                          <BodyText>{renderNick(TAROT_MEANINGS[tarotDrawn ?? tarotIdx], nick)}</BodyText>
                        </div>
                      </motion.div>
                    )}
                  </SectionCard>

                  {/* Mini tarot guidance */}
                  <SectionCard>
                    <GoldTitle size={18}>塔羅行動指引</GoldTitle>
                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                      {["今日能量顏色：金色與深紫，穿戴這兩色將放大你的磁場。", "最佳行動時段：上午 10–12 時，宇宙能量在此時段達到峰值。", "今日冥想關鍵詞：放下、接收、顯化。靜心五分鐘後再做重要決定。"].map((t, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ color: "#D4AF37", flexShrink: 0, marginTop: 4 }}>✦</span>
                          <BodyText style={{ fontSize: 16 }}>{t}</BodyText>
                        </div>
                      ))}
                    </div>
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

                  {/* Monthly (6pts) */}
                  <SectionCard>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <GoldTitle size={20}>本月心靈藍圖</GoldTitle>
                      <span style={{ fontSize: 12, color: "rgba(212,175,55,0.4)" }}>{starTarotPricing.monthlyBlueprint} 點</span>
                    </div>
                    <MiniLockedSection moduleKey="monthlyBlueprint" label="解鎖本月運勢"
                      isUnlocked={unlockedModules.monthlyBlueprint} onRequest={requestUnlock}
                      blurPreview={<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{[100,85,70,90].map((w,i)=><div key={i} style={{height:13,background:"rgba(212,175,55,0.12)",borderRadius:6,width:`${w}%`}}/>)}</div>}>
                      <BodyText>{renderNick(monthly, nick)}</BodyText>
                    </MiniLockedSection>
                  </SectionCard>

                  {/* Yearly — free overview + 3 paid */}
                  <SectionCard>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <GoldTitle size={20}>今年大運軌跡</GoldTitle>
                      <FreeTag />
                    </div>
                    <div style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.18)", borderRadius: 12, padding: "16px 14px", marginBottom: 18 }}>
                      <div style={{ fontSize: 13, color: "#C9A84C", marginBottom: 10 }}>✦ 宏觀宇宙引力提示 · 全體適用 ✦</div>
                      <BodyText>{yearlyOverview}</BodyText>
                    </div>
                    <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
                      解鎖 <span style={{ color: "#D4AF37", fontWeight: 700 }}>{nick}</span> 的三維個人天機：
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {([
                        { key: "careerDestiny" as PricingKey, label: "天命黃金事業流轉", icon: "⚡", text: careerForecast },
                        { key: "loveDestiny"   as PricingKey, label: "宿命靈魂正緣羈絆", icon: "♾", text: loveForecast },
                        { key: "wealthDestiny" as PricingKey, label: "宇宙天意財富盲區", icon: "✦", text: wealthForecast },
                      ]).map(({ key, label, icon, text }) => (
                        <div key={key} style={{ background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.22)", borderRadius: 14, overflow: "hidden" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid rgba(212,175,55,0.1)" }}>
                            <span style={{ fontSize: 18, color: "#D4AF37" }}>{icon}</span>
                            <span style={{ color: "#C9A84C", fontWeight: 700, fontSize: 15 }}>{label}</span>
                            <span style={{ marginLeft: "auto", fontSize: 12, color: "rgba(212,175,55,0.45)" }}>{starTarotPricing[key]} 點</span>
                          </div>
                          <div style={{ padding: "12px 16px" }}>
                            <MiniLockedSection moduleKey={key} label={`解鎖${label}`}
                              isUnlocked={!!unlockedModules[key]} onRequest={requestUnlock}
                              blurPreview={<div style={{ height: 44, background: "rgba(212,175,55,0.05)", borderRadius: 8 }}/>}>
                              <BodyText style={{ fontSize: 16 }}>{renderNick(text, nick)}</BodyText>
                            </MiniLockedSection>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              )}

              {/* ════ TAB 4: 量子共鳴 ════ */}
              {activeTab === "resonance" && (
                <div>
                  {/* 4 individual soulmate items */}
                  <SectionCard style={{ paddingBottom: 10 }}>
                    <div style={{ marginBottom: 14 }}>
                      <GoldTitle size={20}>命運引力場</GoldTitle>
                      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginTop: 6, lineHeight: 1.7 }}>
                        宇宙為 <span style={{ color: "#D4AF37", fontWeight: 700 }}>{nick}</span> 精準配置的四大靈魂磁場（各 4 點）
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                            <div style={{ padding: "12px 16px" }}>
                              <MiniLockedSection moduleKey={mKey} label={`解鎖${dLabel}`}
                                isUnlocked={isU} onRequest={requestUnlock}
                                blurPreview={<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{sm.zodiacs.map((z,i)=><span key={i} style={{padding:"2px 10px",background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.2)",borderRadius:100,fontSize:12,color:"#C9A84C"}}>{z}</span>)}</div>}>
                                <div>
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>{sm.zodiacs.map((z,i)=><span key={i} style={{padding:"3px 10px",background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.28)",borderRadius:100,fontSize:13,color:"#C9A84C"}}>{z}</span>)}</div>
                                  <p style={{ fontSize: 13, color: "rgba(212,175,55,0.7)", marginBottom: 8 }}>理想月份：{sm.months.join(" · ")}</p>
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
                    <div style={{ marginBottom: 14 }}><GoldTitle size={20}>量子共鳴 雙人比對</GoldTitle></div>
                    <BodyText>輸入對方生辰，進行高維度靈魂頻率比對（分數免費，深度報告 10 點）</BodyText>
                    <div style={{ margin: "14px 0" }}>
                      <SimpleBirthdayWheels value={partnerBirthday} onChange={setPartnerBirthday} testIdPrefix="partner" />
                    </div>
                    <button onClick={e => { e.preventDefault(); setCompatibilityResult(getCompatibility(birthday.month, birthday.day, partnerBirthday.month, partnerBirthday.day)); }} data-testid="btn-compare"
                      style={{ width: "100%", padding: "12px 0", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.45)", borderRadius: 100, color: "#D4AF37", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 14 }}>
                      比對共鳴頻率
                    </button>
                    <AnimatePresence>
                      {compatibilityResult && (
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ borderTop: "1px solid rgba(212,175,55,0.15)", paddingTop: 18 }}>
                          <div style={{ textAlign: "center", marginBottom: 16 }}>
                            <div style={{ fontSize: 52, fontWeight: 700, color: "#D4AF37", textShadow: "0 0 20px rgba(212,175,55,0.7),0 0 40px rgba(212,175,55,0.3)", lineHeight: 1.1 }}>{compatibilityResult.score}%</div>
                            <p style={{ fontSize: 18, color: "#FFF", lineHeight: 1.8, marginTop: 8 }}>{compatibilityResult.summary}</p>
                          </div>
                          <MiniLockedSection moduleKey="friendCompatibility" label="解鎖深度共鳴報告"
                            isUnlocked={!!unlockedModules.friendCompatibility} onRequest={requestUnlock}
                            blurPreview={<div style={{ height: 60, background: "rgba(212,175,55,0.05)", borderRadius: 8 }}/>}>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              {[
                                { label: "相處盲區",    text: compatibilityResult.sections.blindSpots },
                                { label: "互補超能力",  text: compatibilityResult.sections.superPowers },
                                { label: "年度共鳴軌跡", text: compatibilityResult.sections.yearlyResonance },
                              ].map(({ label, text }) => (
                                <div key={label} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 12, padding: 14 }}>
                                  <p style={{ color: "#C9A84C", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{label}</p>
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
