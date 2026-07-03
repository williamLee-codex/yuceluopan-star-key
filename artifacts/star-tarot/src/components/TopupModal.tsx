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

export function TopupModal({ open, onOpenChange }: TopupModalProps) {
  const { addPoints } = usePoints();
  const [promoCode, setPromoCode] = useState("");
  const [promoSuccess, setPromoSuccess] = useState(false);
  const [promoError, setPromoError] = useState(false);

  const handleTopupLink = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open("https://pay.startarot.com", "_blank", "noopener");
  };

  const handlePromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      addPoints(PROMO_CODES[code]);
      setPromoSuccess(true);
      setPromoError(false);
      setPromoCode("");
    } else {
      setPromoError(true);
      setPromoSuccess(false);
    }
  };

  const handleClose = () => {
    setPromoCode("");
    setPromoSuccess(false);
    setPromoError(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#080808] border border-primary/50 text-white max-w-[340px] rounded-2xl p-0 overflow-hidden">
        <div style={{ background: "linear-gradient(180deg,rgba(212,175,55,0.1) 0%,transparent 60%)", padding: "28px 24px 24px" }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 22, fontWeight: 700, color: "#D4AF37", textAlign: "center", textShadow: "0 0 12px rgba(212,175,55,0.5)", letterSpacing: "0.05em" }}>
              ✦ 星能充值中心 ✦
            </DialogTitle>
          </DialogHeader>

          {/* Promo success gold banner */}
          {promoSuccess && (
            <div style={{ margin: "18px 0 0", padding: "18px 16px", borderRadius: 14, background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.7)", textAlign: "center", boxShadow: "0 0 24px rgba(212,175,55,0.25),inset 0 0 20px rgba(212,175,55,0.05)" }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>✦</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#D4AF37", lineHeight: 1.7, textShadow: "0 0 10px rgba(212,175,55,0.5)" }}>
                【威廉特權】後臺測試模式啟動，<br />已注入 500 點測試點數！
              </p>
            </div>
          )}

          {!promoSuccess && (
            <>
              {/* External topup button */}
              <div style={{ marginTop: 20 }}>
                <button onClick={handleTopupLink} data-testid="btn-external-topup"
                  style={{ width: "100%", padding: "16px 0", borderRadius: 14, background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, fontSize: 17, border: "none", cursor: "pointer", boxShadow: "0 0 20px rgba(212,175,55,0.4)", letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  前往線上儲值 →
                </button>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center", marginTop: 8 }}>安全跳轉至儲值平台</p>
              </div>

              {/* Divider */}
              <div style={{ margin: "20px 0", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.18)" }}/>
                <span style={{ fontSize: 12, color: "rgba(212,175,55,0.5)", whiteSpace: "nowrap" }}>或輸入兌換碼</span>
                <div style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.18)" }}/>
              </div>

              {/* Promo code */}
              <div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="text" value={promoCode}
                    onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(false); }}
                    onKeyDown={e => e.key === "Enter" && handlePromo()}
                    placeholder="輸入星際兌換碼"
                    data-testid="input-promo-code" maxLength={20}
                    style={{ flex: 1, padding: "11px 14px", background: "rgba(0,0,0,0.5)", border: `1px solid ${promoError ? "rgba(255,107,74,0.6)" : "rgba(212,175,55,0.35)"}`, borderRadius: 10, color: "#D4AF37", fontSize: 14, fontFamily: "monospace", outline: "none", letterSpacing: "0.1em", caretColor: "#D4AF37", userSelect: "text", WebkitUserSelect: "text" }}
                  />
                  <button onClick={handlePromo} data-testid="button-apply-promo"
                    style={{ padding: "11px 16px", borderRadius: 10, background: "linear-gradient(90deg,#B38728,#FBF5B7)", color: "#000", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 0 10px rgba(212,175,55,0.3)", whiteSpace: "nowrap" }}>
                    兌換
                  </button>
                </div>
                {promoError && (
                  <p style={{ marginTop: 8, fontSize: 13, color: "#FF6B4A", lineHeight: 1.6 }}>✕ 無效兌換碼，請重新確認</p>
                )}
              </div>
            </>
          )}

          {/* Close */}
          {promoSuccess && (
            <button onClick={handleClose} style={{ marginTop: 18, width: "100%", padding: "12px 0", background: "transparent", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 10, color: "#D4AF37", fontSize: 15, cursor: "pointer" }}>
              關閉
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
