import { useState, useCallback, ReactNode } from "react";
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

const starTarotPricing = {
  astroTriangleRatio: 12,
  monthlyBlueprint: 6,
  tarotDivination: 6,
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
type TabId = "tianguo" | "shikong" | "resonance";

const TABS: { id: TabId; label: string; glyph: string }[] = [
  { id: "tianguo", label: "星穹天機", glyph: "✦" },
  { id: "shikong", label: "時空流轉", glyph: "◎" },
  { id: "resonance", label: "量子共鳴", glyph: "⟡" },
];

const PLANET_KEYS: Record<string, PricingKey> = {
  金星: "venusDeep",
  木星: "jupiterDeep",
  水星: "mercuryDeep",
  火星: "marsDeep",
  土星: "saturnDeep",
};

const TAROT_CARDS = ["🌙", "⭐", "☀️", "🔮", "⚡", "🌊", "🔥", "🌿"];
const TAROT_MEANINGS = [
  "月亮牌逆位：{{NAME}} 的直覺正在穿越迷霧，請相信那些尚未清晰的內在聲音，它正引領你通往一個更真實的自我。",
  "星星牌正位：宇宙對 {{NAME}} 發出了明確的希望信號。即便前路看似漫長，每一步都被星光照亮——你走對了方向。",
  "太陽牌正位：{{NAME}} 正迎來一段純粹的高光時刻。讓自己被看見、被聽到，你的光芒就是世界需要的禮物。",
  "高女祭司：{{NAME}} 握有一把神秘的智慧鑰匙，那是外人無法輕易獲得的洞見。此刻請靜觀，答案自在內心深處。",
];

function renderNick(text: string, nick: string): ReactNode[] {
  const n = nick.trim() || "你";
  const parts = text.split("{{NAME}}");
  return parts.flatMap((part, i) =>
    i < parts.length - 1
      ? [part, <span key={`n-${i}`} style={{ color: "#D4AF37", fontWeight: 700, textShadow: "0 0 8px rgba(212,175,55,0.4)" }}>{n}</span>]
      : [part]
  );
}

function GoldTitle({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return (
    <div style={{ fontSize: size, fontWeight: 700, color: "#D4AF37", textShadow: "0 0 12px rgba(212,175,55,0.6),0 0 24px rgba(212,175,55,0.3)", lineHeight: 1.3, animation: "breathe-gold 3s infinite ease-in-out" }}>
      {children}
    </div>
  );
}

function BodyText({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontSize: 18, color: "#FFFFFF", lineHeight: 1.8, ...style }}>{children}</p>;
}

function SectionCard({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "linear-gradient(160deg,#111 0%,#0a0a0a 100%)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 16, padding: "22px 18px", marginBottom: 14, ...style }}>
      {children}
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span style={{ fontSize: 12, color: "#C9A84C", border: "1px solid rgba(201,168,76,0.4)", padding: "2px 10px", borderRadius: 100, lineHeight: 1.6 }}>{children}</span>;
}

function FreeTag() {
  return <span style={{ fontSize: 11, color: "rgba(74,255,140,0.7)", border: "1px solid rgba(74,255,140,0.35)", padding: "2px 8px", borderRadius: 100, marginLeft: 6 }}>免費</span>;
}

interface MiniLockedProps {
  moduleKey: PricingKey;
  label: string;
  isUnlocked: boolean;
  onRequest: (key: PricingKey, label: string) => void;
  children: ReactNode;
  blurPreview?: ReactNode;
}

function MiniLockedSection({ moduleKey, label, isUnlocked, onRequest, children, blurPreview }: MiniLockedProps) {
  if (isUnlocked) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {children}
      </motion.div>
    );
  }
  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(212,175,55,0.18)", background: "rgba(0,0,0,0.35)" }}>
      {blurPreview && (
        <div style={{ filter: "blur(5px)", opacity: 0.25, pointerEvents: "none", userSelect: "none", padding: "14px 16px" }}>
          {blurPreview}
        </div>
      )}
      <div style={{ position: blurPreview ? "absolute" : "relative", inset: blurPreview ? 0 : undefined, display: "flex", alignItems: "center", justifyContent: "center", padding: blurPreview ? 0 : "16px" }}>
        <button
          onClick={() => onRequest(moduleKey, label)}
          data-testid={`btn-unlock-${moduleKey}`}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 22px", borderRadius: 100, background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 0 16px rgba(212,175,55,0.4)" }}
        >
          <Lock size={14} />
          {label} ({starTarotPricing[moduleKey]} 點)
        </button>
      </div>
    </div>
  );
}

interface ConfirmModalState { key: PricingKey; cost: number; label: string; }

function UnlockConfirmModal({ modal, onConfirm, onClose }: { modal: ConfirmModalState; onConfirm: () => void; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: "#080808", border: "1px solid rgba(212,175,55,0.5)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 340, boxShadow: "0 0 40px rgba(212,175,55,0.15)" }}>
        <GoldTitle size={22}>確認解鎖天機？</GoldTitle>
        <p style={{ fontSize: 18, color: "#FFF", lineHeight: 1.8, marginTop: 14, marginBottom: 22 }}>
          解鎖【{modal.label}】將消耗 <span style={{ color: "#D4AF37", fontWeight: 700 }}>{modal.cost}</span> 星能點，解鎖後可無限次觀看此生日報告。
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={onConfirm} data-testid="btn-confirm-unlock" style={{ padding: "13px 0", background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, borderRadius: 10, border: "none", cursor: "pointer", fontSize: 16, boxShadow: "0 0 14px rgba(212,175,55,0.4)" }}>確認解鎖</button>
          <button onClick={onClose} data-testid="btn-cancel-unlock" style={{ padding: "12px 0", background: "transparent", border: "1px solid rgba(212,175,55,0.4)", color: "#D4AF37", borderRadius: 10, cursor: "pointer", fontSize: 15 }}>暫不解鎖</button>
        </div>
      </motion.div>
    </div>
  );
}

function AnimatedAstrolabe({ timeInteracting }: { timeInteracting: boolean }) {
  return (
    <div style={{ width: 160, height: 160, margin: "0 auto 8px" }}>
      <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ overflow: "visible" }}>
        <defs>
          <filter id="glow-gold"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="glow-core"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <radialGradient id="core-g" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#FBF5B7"/><stop offset="60%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#8B6914" stopOpacity="0"/></radialGradient>
        </defs>
        <style>{`.rc60{transform-box:fill-box;transform-origin:center;animation:scw 60s linear infinite}.rcc40{transform-box:fill-box;transform-origin:center;animation:sccw 40s linear infinite}.rc22{transform-box:fill-box;transform-origin:center;animation:scw 22s linear infinite}.cpulse{transform-box:fill-box;transform-origin:center;animation:cpulse 2.5s ease-in-out infinite}.pburst{animation:pout 0.9s ease-out infinite}@keyframes scw{to{transform:rotate(360deg)}}@keyframes sccw{to{transform:rotate(-360deg)}}@keyframes cpulse{0%,100%{opacity:.85}50%{opacity:1}}@keyframes pout{0%{opacity:1;transform:scale(1) translate(0,0)}100%{opacity:0;transform:scale(.3) translate(var(--px,10px),var(--py,-10px))}}`}</style>
        <g className="rc60">
          <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(212,175,55,0.35)" strokeWidth="1" strokeDasharray="4 3"/>
          {Array.from({length:12},(_,i)=>{const a=(i*30*Math.PI)/180;return<line key={i} x1={100+85*Math.sin(a)} y1={100-85*Math.cos(a)} x2={100+91*Math.sin(a)} y2={100-91*Math.cos(a)} stroke="rgba(212,175,55,0.55)" strokeWidth="1.5"/>})}
          {[0,90,180,270].map(d=>{const a=(d*Math.PI)/180;return<circle key={d} cx={100+88*Math.sin(a)} cy={100-88*Math.cos(a)} r="3" fill="#D4AF37" filter="url(#glow-gold)"/>})}
        </g>
        <g className="rcc40">
          <circle cx="100" cy="100" r="65" fill="none" stroke="rgba(212,175,55,0.28)" strokeWidth=".8" strokeDasharray="2 4"/>
          {[45,135,225,315].map(d=>{const a=(d*Math.PI)/180;return<circle key={d} cx={100+65*Math.sin(a)} cy={100-65*Math.cos(a)} r="2.5" fill="rgba(212,175,55,0.7)"/>})}
        </g>
        <g className="rc22">
          <circle cx="100" cy="100" r="42" fill="none" stroke="rgba(212,175,55,0.45)" strokeWidth="1.2"/>
          <path d="M100 58 L104 68 L100 64 L96 68 Z" fill="rgba(212,175,55,0.7)"/>
        </g>
        <circle cx="100" cy="100" r="18" fill="url(#core-g)" filter="url(#glow-core)" className="cpulse"/>
        <circle cx="100" cy="100" r="6" fill="#FBF5B7" filter="url(#glow-gold)"/>
        {timeInteracting && [{a:30,r:55},{a:80,r:70},{a:130,r:50},{a:200,r:65},{a:260,r:48},{a:310,r:72},{a:160,r:58},{a:350,r:62}].map(({a,r},i)=>{const ang=(a*Math.PI)/180;const px=100+r*Math.sin(ang);const py=100-r*Math.cos(ang);return<circle key={i} cx={px} cy={py} r="2.5" fill="#D4AF37" filter="url(#glow-gold)" className="pburst" style={{"--px":`${r*Math.sin(ang)*.4}px`,"--py":`${-r*Math.cos(ang)*.4}px`,"animationDelay":`${i*0.11}s`} as React.CSSProperties}/>})}
      </svg>
    </div>
  );
}

export default function Home() {
  const { nickname, setNickname } = useNickname();
  const { points, deductPoints } = usePoints();
  const { toast } = useToast();

  const [nicknameInput, setNicknameInput] = useState("");
  const [birthday, setBirthday] = useState<BirthdayValue>({ year: 1990, month: 1, day: 1, hour: 12, minute: 0 });
  const [partnerBirthday, setPartnerBirthday] = useState({ year: 1990, month: 6, day: 15 });
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("tianguo");
  const [timeInteracting, setTimeInteracting] = useState(false);
  const [unlockedModules, setUnlockedModules] = useState<Record<string, boolean>>({});
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const [showTopup, setShowTopup] = useState(false);
  const [compatibilityResult, setCompatibilityResult] = useState<ReturnType<typeof getCompatibility> | null>(null);
  const [tarotDrawn, setTarotDrawn] = useState<number | null>(null);

  const handleUnlock = () => {
    setNickname(nicknameInput);
    setIsUnlocked(true);
  };

  const handleTimeInteract = useCallback((active: boolean) => setTimeInteracting(active), []);

  const requestUnlock = (key: PricingKey, label: string) => {
    const cost = starTarotPricing[key];
    if (unlockedModules[key]) return;
    if (points < cost) {
      toast({ title: "星能點數不足", description: `需要 ${cost} 點，目前餘額 ${points} 點。請充值後再試。`, variant: "destructive" });
      return;
    }
    setConfirmModal({ key, cost, label });
  };

  const confirmUnlock = () => {
    if (!confirmModal) return;
    if (deductPoints(confirmModal.cost)) {
      setUnlockedModules(prev => ({ ...prev, [confirmModal.key]: true }));
    }
    setConfirmModal(null);
  };

  const nick = nickname.trim() || nicknameInput.trim() || "你";
  const profile = getBirthdayProfile(birthday.month, birthday.day);
  const tripleSign = getTripleSignProfile(birthday.year, birthday.month, birthday.day, birthday.hour, birthday.minute);
  const planets = getPlanetDeconstruction(birthday.month, birthday.day);
  const monthly = getMonthlyForecast(birthday.month, birthday.day);
  const yearlyOverview = getYearlyOverview();
  const careerForecast = getCareerForecast(birthday.year, birthday.month, birthday.day);
  const loveForecast = getLoveForecast(birthday.year, birthday.month, birthday.day);
  const wealthForecast = getWealthForecast(birthday.year, birthday.month, birthday.day);
  const soulmateCategories = getSoulmateCategories();
  const mercury = getMercuryRetrogradeStatus();

  const tarotIdx = tarotDrawn ?? ((birthday.month + birthday.day + birthday.hour) % TAROT_MEANINGS.length);

  return (
    <div style={{ minHeight: "100dvh", background: "#0D0D0D", color: "#FFF", fontFamily: "'Noto Serif SC',serif", paddingBottom: isUnlocked ? 80 : 32 }}>

      {/* Top bar */}
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 200 }}>
        <button onClick={() => setShowTopup(true)} data-testid="btn-topup" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)", border: "1px solid rgba(212,175,55,0.5)", borderRadius: 100, color: "#D4AF37", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Coins size={14} /> {points} 點
        </button>
      </div>

      {/* ── INPUT SECTION ── */}
      <div style={{ padding: "40px 18px 20px", textAlign: "center" }}>
        <AnimatedAstrolabe timeInteracting={timeInteracting} />
        <GoldTitle size={28}>星穹密鑰</GoldTitle>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", margin: "6px 0 22px" }}>AI 塔羅與星盤探索</p>

        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 16, padding: "20px 14px" }}>
          <p style={{ fontSize: 17, color: "#FFF", marginBottom: 14, lineHeight: 1.7 }}>「請輸入您的生辰軌跡以解鎖密鑰」</p>
          <input
            type="text" value={nicknameInput} onChange={e => setNicknameInput(e.target.value)}
            placeholder="請輸入您的專屬暱稱（如：小宇、William）"
            maxLength={12} data-testid="input-nickname"
            style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 10, color: "#D4AF37", fontSize: 16, fontFamily: "inherit", outline: "none", marginBottom: 18, caretColor: "#D4AF37" }}
          />
          <BirthdayWheels value={birthday} onChange={setBirthday} testIdPrefix="main" onTimeInteract={handleTimeInteract} />
          <button onClick={handleUnlock} data-testid="btn-unlock-main" style={{ marginTop: 18, width: "100%", padding: "14px 0", background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, fontSize: 17, border: "none", borderRadius: 100, cursor: "pointer", boxShadow: "0 0 22px rgba(212,175,55,0.5)", letterSpacing: "0.05em" }}>
            解鎖星盤
          </button>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <AnimatePresence>
        {isUnlocked && (
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ padding: "0 14px" }}>

            {/* ════ TAB 1: 星穹天機 ════ */}
            {activeTab === "tianguo" && (
              <div>
                {/* Archetype — free */}
                <SectionCard>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Tag>{profile.zodiac}</Tag>
                    <FreeTag />
                  </div>
                  <div style={{ marginBottom: 12 }}><GoldTitle size={26}>{profile.archetype}</GoldTitle></div>
                  <BodyText>{renderNick(profile.profile, nick)}</BodyText>
                </SectionCard>

                {/* ── Triple Sign FREE section ── */}
                <SectionCard>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <GoldTitle size={20}>黃金三角星力矩陣</GoldTitle>
                    <FreeTag />
                  </div>

                  {/* Big 28px sign names */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
                    {[
                      { role: "太陽星座", sign: tripleSign.sunSign, color: "#FFD666" },
                      { role: "月亮星座", sign: tripleSign.moonSign, color: "#B8D4FF" },
                      { role: "上升星座", sign: tripleSign.risingSign, color: "#C4A3FF" },
                    ].map(({ role, sign, color }) => (
                      <div key={role} style={{ textAlign: "center", background: "rgba(0,0,0,0.4)", borderRadius: 12, padding: "14px 6px", border: `1px solid ${color}30` }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>{role}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color, textShadow: `0 0 12px ${color}80,0 0 22px ${color}40`, lineHeight: 1.3 }}>{sign}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 4, fontSize: 13, color: "#C9A84C" }}>基礎能量概覽</div>
                  <BodyText>{renderNick(tripleSign.basicDescription, nick)}</BodyText>

                  <div style={{ marginTop: 18 }}>
                    <MiniLockedSection
                      moduleKey="astroTriangleRatio"
                      label="解鎖三主星深層交織心理影響與人格面具"
                      isUnlocked={unlockedModules.astroTriangleRatio}
                      onRequest={requestUnlock}
                      blurPreview={<p style={{ fontSize: 16, color: "#FFF", lineHeight: 1.8 }}>太陽與月亮星座之間的深層心理張力揭示了 <span style={{ color: "#D4AF37", fontWeight: 700 }}>{nick}</span> 最隱秘的自我……</p>}
                    >
                      <div>
                        <div style={{ fontSize: 13, color: "#C9A84C", marginBottom: 10 }}>✦ 三主星深層解析已解鎖 ✦</div>
                        <BodyText>{renderNick(tripleSign.deepProfile, nick)}</BodyText>
                      </div>
                    </MiniLockedSection>
                  </div>
                </SectionCard>

                {/* ── Individual planet cards (2pts each) ── */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingLeft: 4 }}>
                    <GoldTitle size={18}>五行行星深度解析</GoldTitle>
                    <span style={{ fontSize: 11, color: "rgba(212,175,55,0.5)", background: "rgba(212,175,55,0.08)", padding: "2px 8px", borderRadius: 100, border: "1px solid rgba(212,175,55,0.2)" }}>各 2 點</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {planets.map((p) => {
                      const planetKey = PLANET_KEYS[p.planet];
                      const isUnlocked = unlockedModules[planetKey];
                      return (
                        <div key={p.planet} style={{ background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.22)", borderRadius: 14, overflow: "hidden" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid rgba(212,175,55,0.1)" }}>
                            <span style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(212,175,55,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4AF37", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{p.element}</span>
                            <div>
                              <div style={{ color: "#C9A84C", fontWeight: 700, fontSize: 15 }}>{p.planet}</div>
                              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{p.domain}</div>
                            </div>
                            {isUnlocked && <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(74,255,140,0.7)", border: "1px solid rgba(74,255,140,0.3)", padding: "2px 8px", borderRadius: 100 }}>已解鎖</span>}
                          </div>
                          <div style={{ padding: "12px 16px" }}>
                            {planetKey ? (
                              <MiniLockedSection
                                moduleKey={planetKey}
                                label={`${p.planet}深度解析`}
                                isUnlocked={!!unlockedModules[planetKey]}
                                onRequest={requestUnlock}
                                blurPreview={<p style={{ fontSize: 15, color: "#FFF", lineHeight: 1.8 }}>{p.analysis.substring(0, 18)}……</p>}
                              >
                                <BodyText style={{ fontSize: 16 }}>{renderNick(p.analysis, nick)}</BodyText>
                              </MiniLockedSection>
                            ) : (
                              <BodyText style={{ fontSize: 16 }}>{renderNick(p.analysis, nick)}</BodyText>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tarot Divination (6pts) */}
                <SectionCard>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <GoldTitle size={20}>每日塔羅占卜</GoldTitle>
                    <span style={{ fontSize: 12, color: "rgba(212,175,55,0.4)" }}>{starTarotPricing.tarotDivination} 點</span>
                  </div>
                  {!unlockedModules.tarotDivination ? (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
                        {TAROT_CARDS.map((c, i) => (
                          <div key={i} style={{ aspectRatio: "2/3", background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "rgba(212,175,55,0.5)" }}>?</div>
                        ))}
                      </div>
                      <button onClick={() => requestUnlock("tarotDivination", "塔羅占卜解析")} data-testid="btn-unlock-tarotDivination" style={{ width: "100%", padding: "12px 0", background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 100, cursor: "pointer", boxShadow: "0 0 14px rgba(212,175,55,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <Lock size={15} /> 解鎖今日牌陣 ({starTarotPricing.tarotDivination} 點)
                      </button>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 18 }}>
                        {TAROT_CARDS.map((c, i) => (
                          <div
                            key={i}
                            onClick={() => setTarotDrawn(i % TAROT_MEANINGS.length)}
                            style={{ aspectRatio: "2/3", background: i === (tarotDrawn ?? tarotIdx) ? "rgba(212,175,55,0.18)" : "rgba(212,175,55,0.06)", border: `1px solid ${i === (tarotDrawn ?? tarotIdx) ? "#D4AF37" : "rgba(212,175,55,0.2)"}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, cursor: "pointer", boxShadow: i === (tarotDrawn ?? tarotIdx) ? "0 0 12px rgba(212,175,55,0.4)" : "none", transition: "all 0.2s" }}
                          >{c}</div>
                        ))}
                      </div>
                      <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 12, padding: "16px 14px" }}>
                        <div style={{ fontSize: 13, color: "#C9A84C", marginBottom: 8 }}>✦ 今日牌義揭示 ✦</div>
                        <BodyText>{renderNick(TAROT_MEANINGS[tarotDrawn ?? tarotIdx], nick)}</BodyText>
                      </div>
                    </motion.div>
                  )}
                </SectionCard>
              </div>
            )}

            {/* ════ TAB 2: 時空流轉 ════ */}
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

                {/* Monthly blueprint (6pts) */}
                <SectionCard>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <GoldTitle size={20}>本月心靈藍圖</GoldTitle>
                    <span style={{ fontSize: 12, color: "rgba(212,175,55,0.4)" }}>{starTarotPricing.monthlyBlueprint} 點</span>
                  </div>
                  <MiniLockedSection
                    moduleKey="monthlyBlueprint"
                    label="解鎖本月運勢"
                    isUnlocked={unlockedModules.monthlyBlueprint}
                    onRequest={requestUnlock}
                    blurPreview={<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{[100,85,70,90].map((w,i)=><div key={i} style={{height:13,background:"rgba(212,175,55,0.12)",borderRadius:6,width:`${w}%`}}/>)}</div>}
                  >
                    <BodyText>{renderNick(monthly, nick)}</BodyText>
                  </MiniLockedSection>
                </SectionCard>

                {/* ── Yearly Destiny — FREE overview + 3 paid sub-modules ── */}
                <SectionCard>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <GoldTitle size={20}>今年大運軌跡</GoldTitle>
                    <span style={{ fontSize: 11, color: "rgba(74,255,140,0.7)", border: "1px solid rgba(74,255,140,0.3)", padding: "2px 8px", borderRadius: 100 }}>概覽免費</span>
                  </div>

                  {/* FREE yearly overview */}
                  <div style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.18)", borderRadius: 12, padding: "16px 14px", marginBottom: 18 }}>
                    <div style={{ fontSize: 13, color: "#C9A84C", marginBottom: 10, letterSpacing: "0.05em" }}>✦ 宏觀宇宙能量概覽 · 全體適用 ✦</div>
                    <BodyText>{yearlyOverview}</BodyText>
                  </div>

                  {/* 3 sub-modules */}
                  <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
                    解鎖 <span style={{ color: "#D4AF37", fontWeight: 700 }}>{nick}</span> 的專屬三維天機預言書：
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { key: "careerDestiny" as PricingKey, label: "天命黃金事業流轉", icon: "⚡", text: careerForecast },
                      { key: "loveDestiny" as PricingKey, label: "宿命靈魂正緣羈絆", icon: "♾", text: loveForecast },
                      { key: "wealthDestiny" as PricingKey, label: "宇宙天意財富盲區", icon: "✦", text: wealthForecast },
                    ].map(({ key, label, icon, text }) => (
                      <div key={key} style={{ background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.22)", borderRadius: 14, overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid rgba(212,175,55,0.1)" }}>
                          <span style={{ fontSize: 18, color: "#D4AF37" }}>{icon}</span>
                          <span style={{ color: "#C9A84C", fontWeight: 700, fontSize: 15 }}>{label}</span>
                          <span style={{ marginLeft: "auto", fontSize: 12, color: "rgba(212,175,55,0.45)" }}>{starTarotPricing[key]} 點</span>
                        </div>
                        <div style={{ padding: "12px 16px" }}>
                          <MiniLockedSection
                            moduleKey={key}
                            label={`解鎖${label}`}
                            isUnlocked={!!unlockedModules[key]}
                            onRequest={requestUnlock}
                            blurPreview={<div style={{height:52,background:"rgba(212,175,55,0.05)",borderRadius:8}}/>}
                          >
                            <BodyText style={{ fontSize: 16 }}>{renderNick(text, nick)}</BodyText>
                          </MiniLockedSection>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ════ TAB 3: 量子共鳴 ════ */}
            {activeTab === "resonance" && (
              <div>
                {/* ── 4 individual soulmate unlocks (4pts each) ── */}
                <SectionCard style={{ paddingBottom: 10 }}>
                  <div style={{ marginBottom: 14 }}>
                    <GoldTitle size={20}>命運引力場</GoldTitle>
                    <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginTop: 6, lineHeight: 1.7 }}>解鎖宇宙為 <span style={{ color: "#D4AF37", fontWeight: 700 }}>{nick}</span> 配置的四大生命場景靈魂磁場</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {soulmateCategories.map(({ key, label, icon }) => {
                      const mKey = key as PricingKey;
                      const sm = getSoulmateProfile(birthday.month, birthday.day, key as SoulmateCategory);
                      const isUnlocked = !!unlockedModules[mKey];
                      return (
                        <div key={key} style={{ background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.22)", borderRadius: 14, overflow: "hidden" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid rgba(212,175,55,0.1)" }}>
                            <span style={{ fontSize: 18, color: "#D4AF37" }}>{icon}</span>
                            <span style={{ color: "#C9A84C", fontWeight: 700, fontSize: 15 }}>{label}</span>
                            {!isUnlocked && <span style={{ marginLeft: "auto", fontSize: 12, color: "rgba(212,175,55,0.45)" }}>{starTarotPricing[mKey]} 點</span>}
                            {isUnlocked && <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(74,255,140,0.7)", border: "1px solid rgba(74,255,140,0.3)", padding: "2px 8px", borderRadius: 100 }}>已解鎖</span>}
                          </div>
                          <div style={{ padding: "12px 16px" }}>
                            <MiniLockedSection
                              moduleKey={mKey}
                              label={`解鎖${label}`}
                              isUnlocked={isUnlocked}
                              onRequest={requestUnlock}
                              blurPreview={
                                <div>
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                                    {sm.zodiacs.map((z,i)=><span key={i} style={{padding:"2px 10px",background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.2)",borderRadius:100,fontSize:12,color:"#C9A84C"}}>{z}</span>)}
                                  </div>
                                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 1.7 }}>理想月份：{sm.months.join(" · ")}</p>
                                </div>
                              }
                            >
                              <div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                                  {sm.zodiacs.map((z,i)=><span key={i} style={{padding:"3px 10px",background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.28)",borderRadius:100,fontSize:13,color:"#C9A84C"}}>{z}</span>)}
                                </div>
                                <p style={{ fontSize: 13, color: "rgba(212,175,55,0.7)", marginBottom: 10 }}>核心特質：{sm.traits.map(t=>renderNick(t,nick))}</p>
                                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>理想月份：{sm.months.join(" · ")}</p>
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
                  <BodyText>輸入對方生辰，進行高維度靈魂頻率比對</BodyText>
                  <div style={{ margin: "14px 0" }}>
                    <SimpleBirthdayWheels value={partnerBirthday} onChange={setPartnerBirthday} testIdPrefix="partner" />
                  </div>
                  <button onClick={() => setCompatibilityResult(getCompatibility(birthday.month, birthday.day, partnerBirthday.month, partnerBirthday.day))} data-testid="btn-compare" style={{ width: "100%", padding: "12px 0", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.45)", borderRadius: 100, color: "#D4AF37", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 14 }}>
                    比對共鳴頻率
                  </button>
                  <AnimatePresence>
                    {compatibilityResult && (
                      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ borderTop: "1px solid rgba(212,175,55,0.15)", paddingTop: 18 }}>
                        <div style={{ textAlign: "center", marginBottom: 16 }}>
                          <div style={{ fontSize: 52, fontWeight: 700, color: "#D4AF37", textShadow: "0 0 20px rgba(212,175,55,0.7),0 0 40px rgba(212,175,55,0.3)", lineHeight: 1.1 }}>{compatibilityResult.score}%</div>
                          <p style={{ fontSize: 18, color: "#FFF", lineHeight: 1.8, marginTop: 8 }}>{compatibilityResult.summary}</p>
                        </div>
                        <MiniLockedSection
                          moduleKey="friendCompatibility"
                          label="解鎖深度共鳴報告"
                          isUnlocked={!!unlockedModules.friendCompatibility}
                          onRequest={requestUnlock}
                          blurPreview={<div style={{height:60,background:"rgba(212,175,55,0.05)",borderRadius:8}}/>}
                        >
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {[
                              { label: "相處盲區", text: compatibilityResult.sections.blindSpots },
                              { label: "互補超能力", text: compatibilityResult.sections.superPowers },
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

      {/* Bottom tab bar */}
      {isUnlocked && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(6,6,6,0.96)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(212,175,55,0.18)", display: "flex", zIndex: 100 }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} data-testid={`tab-${tab.id}`}
                style={{ flex: 1, padding: "11px 0 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "transparent", border: "none", cursor: "pointer", color: active ? "#D4AF37" : "rgba(255,255,255,0.35)", transition: "all 0.2s", borderTop: active ? "2px solid #D4AF37" : "2px solid transparent" }}>
                <span style={{ fontSize: 18, lineHeight: 1, textShadow: active ? "0 0 10px rgba(212,175,55,0.7)" : "none" }}>{tab.glyph}</span>
                <span style={{ fontSize: 11, fontWeight: active ? 700 : 400, letterSpacing: "0.04em" }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <TopupModal open={showTopup} onOpenChange={setShowTopup} />
      {confirmModal && <UnlockConfirmModal modal={confirmModal} onConfirm={confirmUnlock} onClose={() => setConfirmModal(null)} />}
    </div>
  );
}
