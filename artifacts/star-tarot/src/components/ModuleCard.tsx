import { ReactNode, useState } from "react";
import { Lock } from "lucide-react";
import { UnlockModal } from "./UnlockModal";
import { usePoints } from "@/contexts/PointsContext";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface ModuleCardProps {
  title?: string;
  cost: number;
  isUnlocked: boolean;
  onUnlock: () => void;
  children: ReactNode;
  blurPreview?: ReactNode;
  unlockText?: string;
  specialReveal?: boolean;
}

export function ModuleCard({ title, cost, isUnlocked, onUnlock, children, blurPreview, unlockText, specialReveal }: ModuleCardProps) {
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const { points, deductPoints } = usePoints();
  const { toast } = useToast();

  const handleUnlockRequest = () => {
    if (points < cost) {
      toast({
        title: "點數不足，請先充值。",
        variant: "destructive",
      });
      return;
    }
    setShowUnlockModal(true);
  };

  const handleConfirm = () => {
    if (deductPoints(cost)) {
      onUnlock();
    }
  };

  if (!isUnlocked) {
    return (
      <div className="relative rounded-xl border border-primary/20 bg-card overflow-hidden">
        {title && (
          <div className="p-4 border-b border-primary/10">
            <h3 className="text-xl text-primary/50 text-center">{title}</h3>
          </div>
        )}
        <div className={`relative p-6 ${specialReveal ? 'min-h-[200px]' : ''}`}>
          <div className={`absolute inset-0 ${specialReveal ? 'backdrop-blur-[20px]' : 'backdrop-blur-sm'} z-10 flex flex-col items-center justify-center bg-black/40`}>
            <button
              onClick={handleUnlockRequest}
              className={`flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#B38728] to-[#FBF5B7] text-black font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:scale-105 transition-transform ${specialReveal ? 'gold-glow-animated' : ''}`}
            >
              <Lock size={18} />
              <span>{unlockText || `解鎖解析 (${cost}點)`}</span>
            </button>
          </div>
          <div className="opacity-30 pointer-events-none select-none filter blur-[4px]">
            {blurPreview}
          </div>
        </div>
        <UnlockModal 
          open={showUnlockModal} 
          onOpenChange={setShowUnlockModal} 
          cost={cost} 
          onConfirm={handleConfirm} 
        />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/30 bg-gradient-to-b from-[#111] to-black p-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
    >
      {children}
    </motion.div>
  );
}
