import { usePoints } from "@/contexts/PointsContext";
import { Coins } from "lucide-react";
import { TopupModal } from "./TopupModal";
import { useState } from "react";

export function PointsDisplay() {
  const { points } = usePoints();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur border border-primary/50 rounded-full text-primary hover:bg-primary/10 transition-colors"
        data-testid="button-topup"
      >
        <Coins size={16} />
        <span className="text-sm font-medium">{points} 點</span>
      </button>
      <TopupModal open={open} onOpenChange={setOpen} />
    </>
  );
}
