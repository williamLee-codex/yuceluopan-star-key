import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface UnlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cost: number;
  onConfirm: () => void;
}

export function UnlockModal({ open, onOpenChange, cost, onConfirm }: UnlockModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#080808] border border-primary/50 text-white max-w-[340px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center gold-glow mb-4">確認解鎖天機？</DialogTitle>
          <DialogDescription className="text-lg text-white/90 text-center leading-relaxed">
            本項解析將消耗 {cost} 點，解鎖後您可無限次重複觀看此生日之報告。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 mt-4">
          <button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="w-full py-3 bg-gradient-to-r from-[#B38728] to-[#FBF5B7] text-black font-bold rounded shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:scale-[1.02] transition-transform"
          >
            確認解鎖
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="w-full py-3 border border-primary/50 text-primary/80 hover:text-primary hover:bg-primary/10 rounded transition-colors"
          >
            暫不解鎖
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
