import { useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Coins } from "lucide-react";
import { BirthdayWheels, SimpleBirthdayWheels, BirthdayValue } from "@/components/BirthdayWheels";
import { TopupModal } from "@/components/TopupModal";
import { usePoints } from "@/contexts/PointsContext";
import { useNickname } from "@/contexts/NicknameContext";
import { useToast } from "@/hooks/use-toast";
import { getBirthdayProfile } from "@/lib/astrology";
import { getPlanetDeconstruction } from "@/lib/planets";
import { getMonthlyForecast, getYearlyForecast } from "@/lib/forecast";
import { getSoulmateProfiles } from "@/lib/soulmate";
import { getCompatibility } from "@/lib/compatibility";
import { getMercuryRetrogradeStatus } from "@/lib/mercury";

const starTarotPricing = {
  planetDeconstruction: 8,
  monthlyBlueprint: 6,
  yearlyAstroDestiny: 42,
  fiveDimensionsSoul: 16,
  friendCompatibility: 10,
};

type TabId = "tianguo" | "shikong" | "resonance";

const TABS: { id: TabId; label: string; glyph: string }[] = [
  { id: "tianguo", label: "星穹天機", glyph: "✦" },
  { id: "shikong", label: "時空流轉", glyph: "◎" },
  { id: "resonance", label: "量子共鳴", glyph: "⟡" },
];

function renderNick(text: string, nick: string): ReactNode[] {
  const n = nick.trim() || "你";
  const parts = text.split("{{NAME}}");
  return parts.flatMap((part, i) =>
    i < parts.length - 1
      ? [
          part,
          <span
            key={`nick-${i}`}
            style={{ color: "#D4AF37", fontWeight: 700, textShadow: "0 0 8px rgba(212,175,55,0.5)" }}
          >
            {n}
          </span>,
        ]
      : [part]
  );
}

function GoldTitle({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 700,
        color: "#D4AF37",
        textShadow: "0 0 12px rgba(212,175,55,0.6),0 0 24px rgba(212,175,55,0.3)",
        lineHeight: 1.3,
        animation: "breathe-gold 3s infinite ease-in-out",
      }}
    >
      {children}
    </div>
  );
}

function BodyText({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 18, color: "#FFFFFF", lineHeight: 1.8 }}>
      {children}
    </p>
  );
}

function SectionCard({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "linear-gradient(160deg,#111 0%,#0a0a0a 100%)",
        border: "1px solid rgba(212,175,55,0.25)",
        borderRadius: 16,
        padding: "24px 20px",
        marginBottom: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface LockedModuleProps {
  title: string;
  cost: number;
  isUnlocked: boolean;
  onUnlock: () => void;
  unlockLabel?: string;
  blurContent: ReactNode;
  children: ReactNode;
  specialBlur?: boolean;
}

function LockedModule({ title, cost, isUnlocked, onUnlock, unlockLabel, blurContent, children, specialBlur }: LockedModuleProps) {
  if (isUnlocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ background: "linear-gradient(160deg,#111 0%,#0a0a0a 100%)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 16, padding: "24px 20px", marginBottom: 16 }}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <div style={{ position: "relative", background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.18)", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(212,175,55,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "rgba(212,175,55,0.55)", fontSize: 16, fontWeight: 600 }}>{title}</span>
        <span style={{ color: "rgba(212,175,55,0.4)", fontSize: 13 }}>{cost} 點</span>
      </div>
      <div style={{ position: "relative", padding: "20px", minHeight: 140 }}>
        <div style={{ filter: "blur(6px)", opacity: 0.3, pointerEvents: "none", userSelect: "none" }}>
          {blurContent}
        </div>
        <div
          style={{
            position: "absolute", inset: 0,
            backdropFilter: specialBlur ? "blur(20px)" : "blur(4px)",
            background: "rgba(0,0,0,0.45)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
          }}
        >
          <button
            onClick={onUnlock}
            data-testid={`button-unlock-${title}`}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 24px", borderRadius: 100,
              background: "linear-gradient(90deg,#B38728,#FBF5B7)",
              color: "#000", fontWeight: 700, fontSize: 15,
              boxShadow: "0 0 18px rgba(212,175,55,0.45)",
              border: "none", cursor: "pointer",
              animation: specialBlur ? "breathe-gold 2.5s infinite" : "none",
            }}
          >
            <Lock size={16} />
            {unlockLabel || `解鎖解析 (${cost}點)`}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmModal {
  key: string;
  cost: number;
  label: string;
}

function UnlockConfirmModal({ modal, onConfirm, onClose }: { modal: ConfirmModal; onConfirm: () => void; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ background: "#080808", border: "1px solid rgba(212,175,55,0.5)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 340, boxShadow: "0 0 40px rgba(212,175,55,0.15)" }}
      >
        <GoldTitle size={24}>確認解鎖天機？</GoldTitle>
        <p style={{ fontSize: 18, color: "#FFFFFF", lineHeight: 1.8, marginTop: 16, marginBottom: 24 }}>
          本項解析將消耗 <span style={{ color: "#D4AF37", fontWeight: 700 }}>{modal.cost}</span> 點，解鎖後您可無限次重複觀看此生日之報告。
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={onConfirm}
            data-testid="button-confirm-unlock"
            style={{ width: "100%", padding: "14px 0", background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, borderRadius: 10, border: "none", cursor: "pointer", fontSize: 16, boxShadow: "0 0 14px rgba(212,175,55,0.4)" }}
          >
            確認解鎖
          </button>
          <button
            onClick={onClose}
            data-testid="button-cancel-unlock"
            style={{ width: "100%", padding: "13px 0", background: "transparent", border: "1px solid rgba(212,175,55,0.45)", color: "#D4AF37", borderRadius: 10, cursor: "pointer", fontSize: 15 }}
          >
            暫不解鎖
          </button>
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
          <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-core" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="core-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FBF5B7" />
            <stop offset="60%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8B6914" stopOpacity="0" />
          </radialGradient>
        </defs>

        <style>{`
          .ring-cw-60 { transform-box: fill-box; transform-origin: center; animation: spin-cw 60s linear infinite; }
          .ring-ccw-40 { transform-box: fill-box; transform-origin: center; animation: spin-ccw 40s linear infinite; }
          .ring-cw-22 { transform-box: fill-box; transform-origin: center; animation: spin-cw 22s linear infinite; }
          .core-pulse { transform-box: fill-box; transform-origin: center; animation: core-pulse 2.5s ease-in-out infinite; }
          .particle { transform-box: fill-box; transform-origin: center; }
          .particle-burst { animation: particle-out 0.9s ease-out infinite; }
          @keyframes spin-cw { to { transform: rotate(360deg); } }
          @keyframes spin-ccw { to { transform: rotate(-360deg); } }
          @keyframes core-pulse {
            0%,100% { opacity:0.85; r:12; filter:url(#glow-core); }
            50% { opacity:1; r:14; filter:url(#glow-core); }
          }
          @keyframes particle-out {
            0% { opacity:1; transform:scale(1) translate(0,0); }
            100% { opacity:0; transform:scale(0.3) translate(var(--px,10px),var(--py,-10px)); }
          }
        `}</style>

        {/* Outer ring — slow CW */}
        <g className="ring-cw-60">
          <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(212,175,55,0.35)" strokeWidth="1" strokeDasharray="4 3" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            const x1 = 100 + 85 * Math.sin(a);
            const y1 = 100 - 85 * Math.cos(a);
            const x2 = 100 + 91 * Math.sin(a);
            const y2 = 100 - 91 * Math.cos(a);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(212,175,55,0.55)" strokeWidth="1.5" />;
          })}
          {[0, 90, 180, 270].map((deg) => {
            const a = (deg * Math.PI) / 180;
            return <circle key={deg} cx={100 + 88 * Math.sin(a)} cy={100 - 88 * Math.cos(a)} r="3" fill="#D4AF37" filter="url(#glow-gold)" />;
          })}
        </g>

        {/* Middle ring — medium CCW */}
        <g className="ring-ccw-40">
          <circle cx="100" cy="100" r="65" fill="none" stroke="rgba(212,175,55,0.28)" strokeWidth="0.8" strokeDasharray="2 4" />
          {[45, 135, 225, 315].map((deg) => {
            const a = (deg * Math.PI) / 180;
            return <circle key={deg} cx={100 + 65 * Math.sin(a)} cy={100 - 65 * Math.cos(a)} r="2.5" fill="rgba(212,175,55,0.7)" />;
          })}
          <path
            d={`M ${100 + 65 * Math.sin(0)} ${100 - 65 * Math.cos(0)} A 65 65 0 0 1 ${100 + 65 * Math.sin(Math.PI * 0.6)} ${100 - 65 * Math.cos(Math.PI * 0.6)}`}
            fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" opacity="0.5"
          />
        </g>

        {/* Inner ring — fast CW */}
        <g className="ring-cw-22">
          <circle cx="100" cy="100" r="42" fill="none" stroke="rgba(212,175,55,0.45)" strokeWidth="1.2" />
          <path
            d="M100 58 L104 68 L100 64 L96 68 Z"
            fill="rgba(212,175,55,0.7)"
          />
          <line x1="100" y1="58" x2="100" y2="142" stroke="rgba(212,175,55,0.15)" strokeWidth="0.5" />
          <line x1="58" y1="100" x2="142" y2="100" stroke="rgba(212,175,55,0.15)" strokeWidth="0.5" />
        </g>

        {/* Core glow area */}
        <circle cx="100" cy="100" r="20" fill="rgba(212,175,55,0.06)" />
        <circle cx="100" cy="100" r="18" fill="url(#core-grad)" filter="url(#glow-core)" className="core-pulse" />
        <circle cx="100" cy="100" r="6" fill="#FBF5B7" filter="url(#glow-gold)" />

        {/* Cross hairs */}
        <line x1="100" y1="85" x2="100" y2="78" stroke="rgba(212,175,55,0.6)" strokeWidth="1.2" />
        <line x1="115" y1="100" x2="122" y2="100" stroke="rgba(212,175,55,0.6)" strokeWidth="1.2" />

        {/* Particles — only when timeInteracting */}
        {timeInteracting && [
          { angle: 30, r: 55 }, { angle: 80, r: 70 }, { angle: 130, r: 50 },
          { angle: 200, r: 65 }, { angle: 260, r: 48 }, { angle: 310, r: 72 },
          { angle: 160, r: 58 }, { angle: 350, r: 62 },
        ].map(({ angle, r }, i) => {
          const a = (angle * Math.PI) / 180;
          const px = 100 + r * Math.sin(a);
          const py = 100 - r * Math.cos(a);
          const dx = (r * Math.sin(a)) * 0.4;
          const dy = -(r * Math.cos(a)) * 0.4;
          return (
            <circle
              key={i}
              cx={px} cy={py} r="2.5"
              fill="#D4AF37"
              filter="url(#glow-gold)"
              className="particle-burst"
              style={{ "--px": `${dx}px`, "--py": `${dy}px`, animationDelay: `${i * 0.11}s` } as React.CSSProperties}
            />
          );
        })}
      </svg>
    </div>
  );
}

function GlowProgressBar({ label, pct, color, comment, nick }: { label: string; pct: number; color: string; comment: string; nick: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 18, color: "#FFFFFF", fontWeight: 700 }}>{label}</span>
        <span style={{ fontSize: 18, color: "#D4AF37", fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 100, overflow: "hidden", border: "1px solid rgba(212,175,55,0.18)", marginBottom: 10 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ height: "100%", background: `linear-gradient(90deg,${color}60,${color})`, borderRadius: 100, boxShadow: `0 0 10px ${color}80` }}
        />
      </div>
      <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", lineHeight: 1.8 }}>{renderNick(comment, nick)}</p>
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
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null);
  const [showTopup, setShowTopup] = useState(false);
  const [compatibilityResult, setCompatibilityResult] = useState<ReturnType<typeof getCompatibility> | null>(null);

  const handleUnlock = () => {
    setNickname(nicknameInput);
    setIsUnlocked(true);
    setCompatibilityResult(null);
  };

  const handleTimeInteract = useCallback((active: boolean) => {
    setTimeInteracting(active);
  }, []);

  const requestUnlock = (key: string, cost: number, label: string) => {
    if (unlockedModules[key]) return;
    if (points < cost) {
      toast({ title: "點數不足，請先充值。", description: `需要 ${cost} 點，當前餘額 ${points} 點。`, variant: "destructive" });
      return;
    }
    setConfirmModal({ key, cost, label });
  };

  const confirmUnlock = () => {
    if (!confirmModal) return;
    if (deductPoints(confirmModal.cost)) {
      setUnlockedModules((prev) => ({ ...prev, [confirmModal.key]: true }));
    }
    setConfirmModal(null);
  };

  const profile = getBirthdayProfile(birthday.month, birthday.day);
  const planets = getPlanetDeconstruction(birthday.month, birthday.day);
  const monthly = getMonthlyForecast(birthday.month, birthday.day);
  const yearly = getYearlyForecast(birthday.year, birthday.month, birthday.day);
  const soulmates = getSoulmateProfiles(birthday.month, birthday.day);
  const mercury = getMercuryRetrogradeStatus();

  const sunPct = 40;
  const moonPct = 30;
  const risingPct = 30;
  const nick = nickname.trim() || nicknameInput.trim() || "你";

  return (
    <div style={{ minHeight: "100dvh", background: "#0D0D0D", color: "#FFF", fontFamily: "'Noto Serif SC',serif", paddingBottom: isUnlocked ? 80 : 32 }}>

      {/* Top bar */}
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 200, display: "flex", gap: 8 }}>
        <button
          onClick={() => setShowTopup(true)}
          data-testid="button-topup"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(212,175,55,0.5)", borderRadius: 100, color: "#D4AF37", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          <Coins size={14} />
          {points} 點
        </button>
      </div>

      {/* === INPUT SECTION === */}
      <div style={{ padding: "40px 20px 24px", textAlign: "center" }}>
        <AnimatedAstrolabe timeInteracting={timeInteracting} />

        <GoldTitle size={28}>星穹密鑰</GoldTitle>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", margin: "6px 0 24px" }}>AI 塔羅與星盤探索</p>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.22)", borderRadius: 16, padding: "20px 16px" }}>
          {/* Nickname input */}
          <p style={{ fontSize: 18, color: "#FFFFFF", marginBottom: 14, lineHeight: 1.6 }}>
            「請輸入您的生辰軌跡以解鎖密鑰」
          </p>
          <input
            type="text"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            placeholder="請輸入您的專屬暱稱（如：小宇、William）"
            maxLength={12}
            data-testid="input-nickname"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "12px 16px",
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(212,175,55,0.4)",
              borderRadius: 10,
              color: "#D4AF37",
              fontSize: 16,
              fontFamily: "inherit",
              outline: "none",
              marginBottom: 20,
              caretColor: "#D4AF37",
            }}
          />

          {/* 5-wheel picker */}
          <BirthdayWheels
            value={birthday}
            onChange={setBirthday}
            testIdPrefix="main"
            onTimeInteract={handleTimeInteract}
          />

          <button
            onClick={handleUnlock}
            data-testid="button-unlock-main"
            style={{
              marginTop: 20, width: "100%", padding: "14px 0",
              background: "linear-gradient(90deg,#B38728,#FBF5B7)",
              color: "#000", fontWeight: 700, fontSize: 17,
              border: "none", borderRadius: 100, cursor: "pointer",
              boxShadow: "0 0 22px rgba(212,175,55,0.5)",
              letterSpacing: "0.05em",
            }}
          >
            解鎖星盤
          </button>
        </div>
      </div>

      {/* === TAB CONTENT === */}
      <AnimatePresence>
        {isUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ padding: "0 16px" }}
          >
            {/* ---- TAB 1: 星穹天機 ---- */}
            {activeTab === "tianguo" && (
              <div>
                {/* Module: 靈魂原型 (free) */}
                <SectionCard>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: "#C9A84C", border: "1px solid rgba(201,168,76,0.4)", padding: "3px 10px", borderRadius: 100 }}>
                      {profile.zodiac}
                    </span>
                    <span style={{ fontSize: 12, color: "rgba(212,175,55,0.4)" }}>免費</span>
                  </div>
                  <div style={{ marginBottom: 14 }}><GoldTitle size={26}>{profile.archetype}</GoldTitle></div>
                  <BodyText>{renderNick(profile.profile, nick)}</BodyText>
                  <div style={{ marginTop: 16, padding: "12px 0", borderTop: "1px solid rgba(212,175,55,0.12)" }}>
                    <p style={{ fontSize: 13, color: "#C9A84C", marginBottom: 4 }}>出生時辰：{String(birthday.hour).padStart(2,"0")}:{String(birthday.minute).padStart(2,"0")}</p>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                      上升星座將依此時辰精密演算，為 <span style={{ color: "#D4AF37", fontWeight: 700 }}>{nick}</span> 呈現最精準的三角星力分析。
                    </p>
                  </div>
                </SectionCard>

                {/* Module: 星球權重 (FREE now) */}
                <SectionCard>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <div><GoldTitle size={22}>三角星力矩陣</GoldTitle></div>
                    <span style={{ fontSize: 12, color: "rgba(212,175,55,0.4)" }}>免費開放</span>
                  </div>
                  <GlowProgressBar label="太陽核心" pct={sunPct} color="#D4AF37" comment={profile.sunComment} nick={nick} />
                  <GlowProgressBar label="月亮潛意識" pct={moonPct} color="#6EA8D4" comment={profile.moonComment} nick={nick} />
                  <GlowProgressBar label="上升人格" pct={risingPct} color="#9B6FD4" comment={profile.risingComment} nick={nick} />
                </SectionCard>

                {/* Module: 五行行星 (8pts) */}
                <LockedModule
                  title="五行行星現代解構"
                  cost={starTarotPricing.planetDeconstruction}
                  isUnlocked={unlockedModules.planetDeconstruction}
                  onUnlock={() => requestUnlock("planetDeconstruction", starTarotPricing.planetDeconstruction, "五行行星解構")}
                  blurContent={
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {planets.slice(0, 4).map((_, i) => <div key={i} style={{ height: 80, background: "rgba(212,175,55,0.08)", borderRadius: 10, border: "1px solid rgba(212,175,55,0.15)" }} />)}
                    </div>
                  }
                >
                  <div style={{ marginBottom: 16 }}><GoldTitle size={22}>行星解構報告</GoldTitle></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    {planets.slice(0, 2).map((p, i) => (
                      <div key={i} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 12, padding: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(212,175,55,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4AF37", fontWeight: 700, fontSize: 13 }}>{p.element}</span>
                          <span style={{ color: "#C9A84C", fontWeight: 700, fontSize: 14 }}>{p.planet}</span>
                        </div>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{p.domain}</p>
                        <p style={{ fontSize: 14, color: "#FFF", lineHeight: 1.7 }}>{renderNick(p.analysis, nick)}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {planets.slice(2).map((p, i) => (
                      <div key={i} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 12, padding: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(212,175,55,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4AF37", fontWeight: 700, fontSize: 12 }}>{p.element}</span>
                          <span style={{ color: "#C9A84C", fontWeight: 700 }}>{p.planet}</span>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginLeft: "auto" }}>{p.domain}</span>
                        </div>
                        <p style={{ fontSize: 15, color: "#FFF", lineHeight: 1.7 }}>{renderNick(p.analysis, nick)}</p>
                      </div>
                    ))}
                  </div>
                </LockedModule>
              </div>
            )}

            {/* ---- TAB 2: 時空流轉 ---- */}
            {activeTab === "shikong" && (
              <div>
                {/* Mercury (free) */}
                <SectionCard>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div><GoldTitle size={20}>實時天象防禦</GoldTitle></div>
                    <span
                      style={{
                        padding: "4px 14px", borderRadius: 100, fontSize: 13, fontWeight: 700,
                        color: mercury.isRetrograde ? "#FF6B4A" : "#4AFF8C",
                        border: `1px solid ${mercury.isRetrograde ? "#FF6B4A" : "#4AFF8C"}`,
                        boxShadow: `0 0 10px ${mercury.isRetrograde ? "rgba(255,107,74,0.4)" : "rgba(74,255,140,0.4)"}`,
                      }}
                    >
                      {mercury.statusLabel}
                    </span>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                    {mercury.tips.map((tip, i) => (
                      <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ color: "#D4AF37", marginTop: 4, flexShrink: 0 }}>•</span>
                        <BodyText>{tip}</BodyText>
                      </li>
                    ))}
                  </ul>
                </SectionCard>

                {/* Monthly (6pts) */}
                <LockedModule
                  title="本月心靈藍圖運勢"
                  cost={starTarotPricing.monthlyBlueprint}
                  isUnlocked={unlockedModules.monthlyBlueprint}
                  onUnlock={() => requestUnlock("monthlyBlueprint", starTarotPricing.monthlyBlueprint, "本月心靈藍圖")}
                  blurContent={<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{[100, 85, 70, 90].map((w, i) => <div key={i} style={{ height: 14, background: "rgba(212,175,55,0.15)", borderRadius: 6, width: `${w}%` }} />)}</div>}
                >
                  <div style={{ marginBottom: 14 }}><GoldTitle size={22}>本月心靈藍圖</GoldTitle></div>
                  <BodyText>{renderNick(monthly, nick)}</BodyText>
                </LockedModule>

                {/* Yearly (42pts) */}
                <LockedModule
                  title="今年整體大運軌跡預言書"
                  cost={starTarotPricing.yearlyAstroDestiny}
                  isUnlocked={unlockedModules.yearlyAstroDestiny}
                  onUnlock={() => requestUnlock("yearlyAstroDestiny", starTarotPricing.yearlyAstroDestiny, "年度天機密典")}
                  unlockLabel={`解鎖年度天機密典 (${starTarotPricing.yearlyAstroDestiny}點)`}
                  specialBlur
                  blurContent={<div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 60, height: 60, borderRadius: "50%", border: "3px solid rgba(212,175,55,0.3)", borderTopColor: "#D4AF37", animation: "spin-cw 1.5s linear infinite" }} /></div>}
                >
                  <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
                    <div style={{ fontSize: 13, color: "#C9A84C", marginBottom: 10, letterSpacing: "0.1em" }}>— 專屬於 <span style={{ color: "#D4AF37", fontWeight: 700 }}>{nick}</span> 的大運預言書 —</div>
                    <div style={{ marginBottom: 16 }}><GoldTitle size={26}>大運軌跡預言書</GoldTitle></div>
                  </div>
                  <BodyText>{renderNick(yearly, nick)}</BodyText>
                </LockedModule>
              </div>
            )}

            {/* ---- TAB 3: 量子共鳴 ---- */}
            {activeTab === "resonance" && (
              <div>
                {/* Soulmate grid (16pts) */}
                <LockedModule
                  title="靈魂引力場"
                  cost={starTarotPricing.fiveDimensionsSoul}
                  isUnlocked={unlockedModules.fiveDimensionsSoul}
                  onUnlock={() => requestUnlock("fiveDimensionsSoul", starTarotPricing.fiveDimensionsSoul, "靈魂引力場")}
                  blurContent={
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[1, 2, 3, 4, 5].map((i) => <div key={i} style={{ height: 52, background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 10 }} />)}
                    </div>
                  }
                >
                  <div style={{ marginBottom: 16 }}><GoldTitle size={22}>五維靈魂契合矩陣</GoldTitle></div>
                  <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 16, lineHeight: 1.7 }}>
                    以下是宇宙為 <span style={{ color: "#D4AF37", fontWeight: 700 }}>{nick}</span> 精準匹配的五大生命場景靈魂契約：
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {soulmates.map((sm, i) => (
                      <div key={i} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(212,175,55,0.28)", borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid rgba(212,175,55,0.12)" }}>
                          <span style={{ color: "#C9A84C", fontWeight: 700, fontSize: 16 }}>{sm.category}</span>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>理想月份：{sm.months.join(" · ")}</span>
                        </div>
                        <p style={{ fontSize: 15, color: "#FFF", lineHeight: 1.7, marginBottom: 8 }}>
                          核心特質：<span style={{ color: "rgba(212,175,55,0.85)" }}>{sm.traits.join(" / ")}</span>
                        </p>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {sm.zodiacs.map((z, zi) => (
                            <span key={zi} style={{ padding: "3px 10px", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 100, fontSize: 13, color: "#C9A84C" }}>{z}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </LockedModule>

                {/* Compatibility (10pts for deep) */}
                <SectionCard>
                  <div style={{ marginBottom: 14 }}><GoldTitle size={22}>量子共鳴 雙人比對</GoldTitle></div>
                  <BodyText>輸入對方生辰，進行高維度靈魂頻率比對</BodyText>
                  <div style={{ margin: "16px 0" }}>
                    <SimpleBirthdayWheels
                      value={partnerBirthday}
                      onChange={setPartnerBirthday}
                      testIdPrefix="partner"
                    />
                  </div>
                  <button
                    onClick={() => setCompatibilityResult(getCompatibility(birthday.month, birthday.day, partnerBirthday.month, partnerBirthday.day))}
                    data-testid="button-compare"
                    style={{ width: "100%", padding: "12px 0", background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.45)", borderRadius: 100, color: "#D4AF37", fontWeight: 700, fontSize: 16, cursor: "pointer", marginBottom: 16 }}
                  >
                    比對共鳴頻率
                  </button>

                  <AnimatePresence>
                    {compatibilityResult && (
                      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ borderTop: "1px solid rgba(212,175,55,0.15)", paddingTop: 20 }}>
                        <div style={{ textAlign: "center", marginBottom: 16 }}>
                          <div style={{ fontSize: 52, fontWeight: 700, color: "#D4AF37", textShadow: "0 0 20px rgba(212,175,55,0.7),0 0 40px rgba(212,175,55,0.3)", lineHeight: 1.1 }}>
                            {compatibilityResult.score}%
                          </div>
                          <p style={{ fontSize: 18, color: "#FFF", lineHeight: 1.8, marginTop: 8 }}>{compatibilityResult.summary}</p>
                        </div>

                        {!unlockedModules.friendCompatibility ? (
                          <button
                            onClick={() => requestUnlock("friendCompatibility", starTarotPricing.friendCompatibility, "深度共鳴報告")}
                            data-testid="button-unlock-compatibility"
                            style={{ width: "100%", padding: "12px 0", background: "transparent", border: "1px solid rgba(212,175,55,0.5)", borderRadius: 100, color: "#D4AF37", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                          >
                            <Lock size={15} />
                            解鎖深度共鳴報告 ({starTarotPricing.friendCompatibility}點)
                          </button>
                        ) : (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                            {[
                              { label: "相處盲區", text: compatibilityResult.sections.blindSpots },
                              { label: "互補超能力", text: compatibilityResult.sections.superPowers },
                              { label: "年度共鳴軌跡", text: compatibilityResult.sections.yearlyResonance },
                            ].map(({ label, text }) => (
                              <div key={label} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 12, padding: 16 }}>
                                <p style={{ color: "#C9A84C", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{label}</p>
                                <BodyText>{renderNick(text, nick)}</BodyText>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SectionCard>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer style={{ padding: "24px 20px 100px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#555555", lineHeight: 1.8 }}>
          💡 星穹提示：本模組之星盤推演與塔羅矩陣，均基於 AI 大數據心理學模型與符號學演算法，內容僅供個人自我理解、生活風格靈感與高科技娛樂體驗之參考，不構成任何實質醫療、法律或財務建議。
        </p>
      </footer>

      {/* Bottom Tab Bar — only when unlocked */}
      {isUnlocked && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(8,8,8,0.95)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(212,175,55,0.2)", display: "flex", zIndex: 100 }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-${tab.id}`}
                style={{
                  flex: 1, padding: "12px 0 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  background: "transparent", border: "none", cursor: "pointer",
                  color: isActive ? "#D4AF37" : "rgba(255,255,255,0.38)",
                  transition: "all 0.2s",
                  borderTop: isActive ? "2px solid #D4AF37" : "2px solid transparent",
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1, textShadow: isActive ? "0 0 10px rgba(212,175,55,0.7)" : "none" }}>{tab.glyph}</span>
                <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 400, letterSpacing: "0.04em" }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Topup modal */}
      <TopupModal open={showTopup} onOpenChange={setShowTopup} />

      {/* Unlock confirm modal */}
      {confirmModal && (
        <UnlockConfirmModal
          modal={confirmModal}
          onConfirm={confirmUnlock}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
