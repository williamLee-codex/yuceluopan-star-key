import { getMercuryRetrogradeStatus } from "@/lib/mercury";

export function MercuryStatus() {
  const { isRetrograde, statusLabel, tips } = getMercuryRetrogradeStatus();
  
  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-[#111] to-black p-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl text-primary font-bold">實時天象防禦</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-bold shadow-[0_0_10px_currentColor] ${isRetrograde ? 'text-destructive border border-destructive' : 'text-green-500 border border-green-500'}`}>
          {statusLabel}
        </span>
      </div>
      <ul className="space-y-3">
        {tips.map((tip, i) => (
          <li key={i} className="text-[18px] text-white leading-[1.8] flex items-start gap-2">
            <span className="text-primary mt-1.5">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
