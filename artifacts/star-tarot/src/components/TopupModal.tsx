import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePoints } from "@/contexts/PointsContext";

interface TopupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TopupModal({ open, onOpenChange }: TopupModalProps) {
  const { addPoints } = usePoints();

  const handleTopup = (amount: number) => {
    addPoints(amount);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#080808] border border-primary/50 text-white max-w-[340px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center gold-glow">充值點數</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {[60, 120, 360].map(amount => (
            <button
              key={amount}
              onClick={() => handleTopup(amount)}
              className="flex justify-between items-center px-4 py-3 rounded-md border border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/20 transition-all group"
            >
              <span className="text-lg text-primary">{amount} 點</span>
              <span className="text-sm text-primary/70 group-hover:text-primary">模擬支付</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
