import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface PointsContextType {
  points: number;
  addPoints: (amount: number) => void;
  deductPoints: (amount: number) => boolean;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);
const LS_KEY = "starTarot_points";

export function PointsProvider({ children }: { children: ReactNode }) {
  const [points, setPoints] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(LS_KEY) || "0") || 0; } catch { return 0; }
  });

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, String(points)); } catch {}
  }, [points]);

  const addPoints = (amount: number) => setPoints(prev => prev + amount);

  const deductPoints = (amount: number) => {
    if (points >= amount) {
      setPoints(prev => prev - amount);
      return true;
    }
    return false;
  };

  return (
    <PointsContext.Provider value={{ points, addPoints, deductPoints }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const context = useContext(PointsContext);
  if (context === undefined) throw new Error("usePoints must be used within a PointsProvider");
  return context;
}
