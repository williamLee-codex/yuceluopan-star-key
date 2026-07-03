import { createContext, useContext, useState, ReactNode } from "react";

interface NicknameContextType {
  nickname: string;
  setNickname: (n: string) => void;
}

const NicknameContext = createContext<NicknameContextType | undefined>(undefined);

export function NicknameProvider({ children }: { children: ReactNode }) {
  const [nickname, setNickname] = useState("");
  return (
    <NicknameContext.Provider value={{ nickname, setNickname }}>
      {children}
    </NicknameContext.Provider>
  );
}

export function useNickname() {
  const ctx = useContext(NicknameContext);
  if (!ctx) throw new Error("useNickname must be used within NicknameProvider");
  return ctx;
}
