import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePoints } from "@/contexts/PointsContext";

interface TopupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROMO_CODES: Record<string, number> = {
  WEILIAM500: 500,
  STARMASTER: 500,
};

const TOPUP_OPTIONS = [
  { amount: 60, label: "入門星能", desc: "適合解鎖 1-2 個模組" },
  { amount: 120, label: "進階星力", desc: "適合解鎖主要功能" },
  { amount: 360, label: "完全解鎖", desc: "解鎖全站所有天機" },
];

export function TopupModal({ open, onOpenChange }: TopupModalProps) {
  const { addPoints } = usePoints();
  const [promoCode, setPromoCode] = useState("");
  const [promoMsg, setPromoMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const handleTopup = (amount: number) => {
    addPoints(amount);
    onOpenChange(false);
  };

  const handlePromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      addPoints(PROMO_CODES[code]);
      setPromoMsg({ text: `✦ 兌換成功！已注入 ${PROMO_CODES[code]} 星能點數`, ok: true });
      setPromoCode("");
      setTimeout(() => {
        setPromoMsg(null);
        onOpenChange(false);
      }, 1800);
    } else {
      setPromoMsg({ text: "✕ 無效兌換碼，請重新確認", ok: false });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#080808] border border-primary/50 text-white max-w-[340px] rounded-2xl p-0 overflow-hidden">
        <div style={{ background: "linear-gradient(180deg,rgba(212,175,55,0.1) 0%,transparent 60%)", padding: "28px 24px 24px" }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 22, fontWeight: 700, color: "#D4AF37", textAlign: "center", textShadow: "0 0 12px rgba(212,175,55,0.5)", letterSpacing: "0.05em" }}>
              ✦ 充值星能點數 ✦
            </DialogTitle>
          </DialogHeader>

          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {TOPUP_OPTIONS.map(({ amount, label, desc }) => (
              <button
                key={amount}
                onClick={() => handleTopup(amount)}
                data-testid={`topup-${amount}`}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 16px", borderRadius: 12,
                  background: "rgba(212,175,55,0.06)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  cursor: "pointer", transition: "all 0.15s",
                  color: "#FFF",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(212,175,55,0.14)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "rgba(212,175,55,0.06)")}
              >
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#D4AF37" }}>{label}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{desc}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#D4AF37" }}>{amount}</div>
                  <div style={{ fontSize: 11, color: "rgba(212,175,55,0.6)" }}>點數</div>
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 20, borderTop: "1px solid rgba(212,175,55,0.15)", paddingTop: 18 }}>
            <p style={{ fontSize: 13, color: "rgba(212,175,55,0.7)", marginBottom: 10, letterSpacing: "0.05em" }}>輸入星際兌換碼</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoMsg(null); }}
                onKeyDown={(e) => e.key === "Enter" && handlePromo()}
                placeholder="輸入兌換碼"
                data-testid="input-promo-code"
                maxLength={20}
                style={{
                  flex: 1, padding: "10px 14px",
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(212,175,55,0.35)",
                  borderRadius: 10, color: "#D4AF37",
                  fontSize: 14, fontFamily: "monospace",
                  outline: "none", letterSpacing: "0.1em",
                  caretColor: "#D4AF37",
                }}
              />
              <button
                onClick={handlePromo}
                data-testid="button-apply-promo"
                style={{
                  padding: "10px 16px", borderRadius: 10,
                  background: "linear-gradient(90deg,#B38728,#FBF5B7)",
                  color: "#000", fontWeight: 700, fontSize: 14,
                  border: "none", cursor: "pointer",
                  boxShadow: "0 0 10px rgba(212,175,55,0.3)",
                  whiteSpace: "nowrap",
                }}
              >
                兌換
              </button>
            </div>
            {promoMsg && (
              <p style={{ marginTop: 10, fontSize: 14, color: promoMsg.ok ? "#4AFF8C" : "#FF6B4A", lineHeight: 1.6 }}>
                {promoMsg.text}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
