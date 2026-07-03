import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BirthdayWheels } from "@/components/BirthdayWheels";
import { ModuleCard } from "@/components/ModuleCard";
import { MercuryStatus } from "@/components/MercuryStatus";
import { PointsDisplay } from "@/components/PointsDisplay";
import { getBirthdayProfile } from "@/lib/astrology";
import { getPlanetDeconstruction } from "@/lib/planets";
import { getMonthlyForecast, getYearlyForecast } from "@/lib/forecast";
import { getSoulmateProfiles } from "@/lib/soulmate";
import { getCompatibility } from "@/lib/compatibility";

const starTarotPricing = {
  planetDeconstruction: 8,
  astroTriangleRatio: 12,
  monthlyBlueprint: 6,
  yearlyAstroDestiny: 30,
  fiveDimensionsSoul: 16,
  friendCompatibility: 10
};

export default function Home() {
  const [birthday, setBirthday] = useState({ year: 1990, month: 1, day: 1 });
  const [partnerBirthday, setPartnerBirthday] = useState({ year: 1990, month: 1, day: 1 });
  
  const [isMainUnlocked, setIsMainUnlocked] = useState(false);
  const [unlockedModules, setUnlockedModules] = useState<Record<string, boolean>>({});

  const unlockModule = (key: string) => {
    setUnlockedModules(prev => ({ ...prev, [key]: true }));
  };

  const handleMainUnlock = () => {
    setIsMainUnlocked(true);
    // Scroll to next module after a short delay
    setTimeout(() => {
      document.getElementById('module-2')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const profile = getBirthdayProfile(birthday.month, birthday.day);
  const planets = getPlanetDeconstruction(birthday.month, birthday.day);
  const monthly = getMonthlyForecast(birthday.month, birthday.day);
  const yearly = getYearlyForecast(birthday.year, birthday.month, birthday.day);
  const soulmates = getSoulmateProfiles(birthday.month, birthday.day);
  const compatibility = getCompatibility(birthday.month, birthday.day, partnerBirthday.month, partnerBirthday.day);

  // Module 4: Astro Triangle Ratio mock data based on seed
  const sunRatio = 30 + (birthday.day % 20);
  const moonRatio = 30 + (birthday.month % 15);
  const risingRatio = 100 - sunRatio - moonRatio;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <PointsDisplay />
      
      <main className="max-w-[430px] mx-auto px-4 py-8 space-y-12">
        {/* Module 1: 量子星宇輸入端 */}
        <section className="text-center pt-8">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 mx-auto mb-6 relative"
          >
            {/* SVG Astrolabe */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-primary drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" />
              <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
              <circle cx="50" cy="50" r="8" fill="currentColor" />
              <circle cx="25" cy="25" r="3" fill="currentColor" className="gold-glow-animated" />
              <circle cx="80" cy="60" r="4" fill="currentColor" className="gold-glow-animated" />
            </svg>
          </motion.div>
          
          <h1 className="text-[28px] font-bold gold-glow mb-2">星穹密鑰</h1>
          <p className="text-[18px] text-white mb-8">「AI 塔羅與星盤探索」</p>
          
          <div className="bg-card/50 border border-primary/20 rounded-2xl p-6 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            <p className="text-[18px] text-white mb-6">「請輸入您的生辰軌跡以解鎖密鑰」</p>
            <BirthdayWheels value={birthday} onChange={setBirthday} />
            <button 
              onClick={handleMainUnlock}
              className="mt-8 w-full py-4 rounded-full bg-gradient-to-r from-[#B38728] to-[#FBF5B7] text-black font-bold text-lg shadow-[0_0_20px_rgba(212,175,55,0.5)] hover:scale-[1.02] transition-transform"
              data-testid="button-unlock-main"
            >
              解鎖星盤
            </button>
          </div>
        </section>

        {/* Module 2: 366天生日人格與靈魂原型 */}
        <AnimatePresence>
          {isMainUnlocked && (
            <motion.section 
              id="module-2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="text-center space-y-4 rounded-xl border border-primary/30 bg-gradient-to-b from-[#151515] to-black p-8 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <span className="inline-block px-4 py-1 rounded-full border border-primary/50 text-[#C9A84C] text-[16px] mb-2">
                  {profile.zodiac}
                </span>
                <h2 className="text-[28px] gold-glow mb-6 leading-tight">{profile.archetype}</h2>
                <p className="text-[18px] text-white leading-[1.8] text-left">
                  {profile.profile}
                </p>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Module 3: 實時天象防禦（水逆） */}
        <section>
          <MercuryStatus />
        </section>

        <AnimatePresence>
          {isMainUnlocked && (
            <>
              {/* Module 4: 星球權重（太/月/上） */}
              <ModuleCard 
                cost={starTarotPricing.astroTriangleRatio}
                isUnlocked={unlockedModules.astroTriangleRatio}
                onUnlock={() => unlockModule('astroTriangleRatio')}
                title="星球權重"
                unlockText={`解鎖三角星力 (${starTarotPricing.astroTriangleRatio}點)`}
                blurPreview={
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2"><span className="text-white">太陽</span><span className="text-white">40%</span></div>
                      <div className="h-2 bg-primary/20 rounded-full overflow-hidden"><div className="h-full bg-primary w-[40%]" /></div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2"><span className="text-white">月亮</span><span className="text-white">30%</span></div>
                      <div className="h-2 bg-primary/20 rounded-full overflow-hidden"><div className="h-full bg-primary w-[30%]" /></div>
                    </div>
                  </div>
                }
              >
                <h3 className="text-2xl gold-glow text-center mb-8">三角星力矩陣</h3>
                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-[18px] text-white font-bold">太陽核心</span><span className="text-primary">{sunRatio}%</span></div>
                    <div className="h-3 bg-black border border-primary/30 rounded-full overflow-hidden mb-3">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${sunRatio}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-primary/50 to-primary" />
                    </div>
                    <p className="text-[16px] text-white/80 leading-[1.8]">代表你外在展現的意志力與人生追求方向。這個比例顯示你在群體中容易成為焦點。</p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-[18px] text-white font-bold">月亮潛意識</span><span className="text-primary">{moonRatio}%</span></div>
                    <div className="h-3 bg-black border border-primary/30 rounded-full overflow-hidden mb-3">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${moonRatio}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-gradient-to-r from-blue-900 to-blue-500" />
                    </div>
                    <p className="text-[16px] text-white/80 leading-[1.8]">掌管你的情緒安全感與內在需求。你需要充足的獨處時間來消化外界資訊。</p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-[18px] text-white font-bold">上升人格</span><span className="text-primary">{risingRatio}%</span></div>
                    <div className="h-3 bg-black border border-primary/30 rounded-full overflow-hidden mb-3">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${risingRatio}%` }} transition={{ duration: 1, delay: 0.4 }} className="h-full bg-gradient-to-r from-purple-900 to-purple-500" />
                    </div>
                    <p className="text-[16px] text-white/80 leading-[1.8]">這是你靈魂選擇戴上的面具，也是你防禦外在世界的盔甲。它決定了你的第一印象。</p>
                  </div>
                </div>
              </ModuleCard>

              {/* Module 5: 五行行星現代解構 */}
              <ModuleCard 
                cost={starTarotPricing.planetDeconstruction}
                isUnlocked={unlockedModules.planetDeconstruction}
                onUnlock={() => unlockModule('planetDeconstruction')}
                title="五行行星現代解構"
                blurPreview={
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-primary/10 rounded-lg border border-primary/20"></div>
                    <div className="h-24 bg-primary/10 rounded-lg border border-primary/20"></div>
                    <div className="h-24 bg-primary/10 rounded-lg border border-primary/20 col-span-2"></div>
                  </div>
                }
              >
                <h3 className="text-2xl gold-glow text-center mb-6">行星解構報告</h3>
                <div className="grid grid-cols-2 gap-4">
                  {planets.slice(0, 2).map((p, i) => (
                    <div key={i} className="bg-black/50 border border-primary/30 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{p.element}</span>
                        <span className="text-[#C9A84C] font-bold">{p.planet}</span>
                      </div>
                      <p className="text-[14px] text-white/60 mb-2">{p.domain}</p>
                      <p className="text-[16px] text-white leading-[1.6] line-clamp-3">{p.analysis}</p>
                    </div>
                  ))}
                  <div className="col-span-2 space-y-4">
                    {planets.slice(2).map((p, i) => (
                      <div key={i} className="bg-black/50 border border-primary/30 p-4 rounded-xl flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{p.element}</span>
                          <span className="text-[#C9A84C] font-bold">{p.planet}</span>
                          <span className="text-[14px] text-white/60 ml-auto">{p.domain}</span>
                        </div>
                        <p className="text-[16px] text-white leading-[1.6]">{p.analysis}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ModuleCard>

              {/* Module 6: 本月心靈藍圖運勢 */}
              <ModuleCard 
                cost={starTarotPricing.monthlyBlueprint}
                isUnlocked={unlockedModules.monthlyBlueprint}
                onUnlock={() => unlockModule('monthlyBlueprint')}
                title="本月心靈藍圖運勢"
                blurPreview={
                  <div className="space-y-3">
                    <div className="h-4 bg-primary/20 rounded w-full"></div>
                    <div className="h-4 bg-primary/20 rounded w-5/6"></div>
                    <div className="h-4 bg-primary/20 rounded w-4/6"></div>
                  </div>
                }
              >
                <h3 className="text-2xl gold-glow mb-6 text-center">本月心靈藍圖</h3>
                <p className="text-[18px] text-white leading-[1.8] text-justify">
                  {monthly}
                </p>
              </ModuleCard>

              {/* Module 7: 今年整體風格大運軌跡預言書 */}
              <ModuleCard 
                cost={starTarotPricing.yearlyAstroDestiny}
                isUnlocked={unlockedModules.yearlyAstroDestiny}
                onUnlock={() => unlockModule('yearlyAstroDestiny')}
                unlockText={`解鎖年度天機密典 (${starTarotPricing.yearlyAstroDestiny}點)`}
                specialReveal={true}
                blurPreview={
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                  </div>
                }
              >
                <div className="py-6">
                  <h3 className="text-[28px] gold-glow mb-8 text-center gold-glow-animated">大運軌跡預言書</h3>
                  <div className="relative">
                    <div className="absolute -left-4 -top-4 text-[60px] text-primary/20 leading-none font-serif">"</div>
                    <p className="text-[18px] text-white leading-[1.8] text-justify px-4 relative z-10">
                      {yearly}
                    </p>
                    <div className="absolute -right-4 -bottom-8 text-[60px] text-primary/20 leading-none font-serif">"</div>
                  </div>
                </div>
              </ModuleCard>

              {/* Module 8: 靈魂引力場（適合的另一半） */}
              <ModuleCard 
                cost={starTarotPricing.fiveDimensionsSoul}
                isUnlocked={unlockedModules.fiveDimensionsSoul}
                onUnlock={() => unlockModule('fiveDimensionsSoul')}
                title="靈魂引力場"
                blurPreview={
                  <div className="space-y-4">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="h-16 bg-primary/10 border border-primary/20 rounded-xl"></div>
                    ))}
                  </div>
                }
              >
                <h3 className="text-2xl gold-glow mb-6 text-center">五維靈魂契合矩陣</h3>
                <div className="space-y-4">
                  {soulmates.map((sm, i) => (
                    <div key={i} className="bg-black border border-primary/30 rounded-xl p-5 hover:border-primary/60 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-[18px] text-[#C9A84C] font-bold border-b border-primary/30 pb-1">{sm.category}</h4>
                        <span className="text-[14px] text-white/50">理想月份：{sm.months.join(', ')}</span>
                      </div>
                      <p className="text-[16px] text-white leading-[1.6] mb-3">
                        核心特質：<span className="text-primary/90">{sm.traits.join(' / ')}</span>
                      </p>
                      <div className="flex gap-2">
                        {sm.zodiacs.map((z, zi) => (
                          <span key={zi} className="px-2 py-1 bg-primary/10 text-[#C9A84C] text-[14px] rounded">{z}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ModuleCard>

              {/* Module 9: 量子共鳴（雙人生日契合度） */}
              <div className="rounded-xl border border-primary/30 bg-card overflow-hidden p-6 space-y-6">
                <h3 className="text-[24px] gold-glow text-center">量子共鳴（雙人比對）</h3>
                <p className="text-[18px] text-white text-center">請輸入對方的生辰以進行高維度比對</p>
                
                <BirthdayWheels value={partnerBirthday} onChange={setPartnerBirthday} />
                
                {!unlockedModules.friendCompatibility ? (
                  <div className="space-y-6 mt-6 pt-6 border-t border-primary/20">
                    <div className="text-center">
                      <div className="text-[48px] font-bold gold-glow mb-2">{compatibility.score}%</div>
                      <p className="text-[18px] text-white">{compatibility.summary}</p>
                    </div>
                    
                    <button
                      onClick={() => unlockModule('friendCompatibility')}
                      className="w-full py-4 rounded-full border border-primary/50 text-primary hover:bg-primary/10 font-bold text-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      解鎖深度共鳴報告 ({starTarotPricing.friendCompatibility}點)
                    </button>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-6 mt-6 pt-6 border-t border-primary/20"
                  >
                    <div className="text-center mb-8">
                      <div className="text-[48px] font-bold gold-glow mb-2">{compatibility.score}%</div>
                      <p className="text-[18px] text-white">{compatibility.summary}</p>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-black/50 p-5 rounded-xl border border-primary/20">
                        <h4 className="text-[#C9A84C] text-[18px] font-bold mb-2">相處盲區</h4>
                        <p className="text-white text-[16px] leading-[1.8]">{compatibility.sections.blindSpots}</p>
                      </div>
                      <div className="bg-black/50 p-5 rounded-xl border border-primary/20">
                        <h4 className="text-[#C9A84C] text-[18px] font-bold mb-2">互補超能力</h4>
                        <p className="text-white text-[16px] leading-[1.8]">{compatibility.sections.superPowers}</p>
                      </div>
                      <div className="bg-black/50 p-5 rounded-xl border border-primary/20">
                        <h4 className="text-[#C9A84C] text-[18px] font-bold mb-2">年度共鳴軌跡</h4>
                        <p className="text-white text-[16px] leading-[1.8]">{compatibility.sections.yearlyResonance}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-[430px] mx-auto text-center py-8 px-6 mt-12 border-t border-primary/10">
        <p className="text-[12px] text-[#555555] leading-relaxed">
          💡 星穹提示：本模組之星盤推演與塔羅矩陣，均基於 AI 大數據心理學模型與符號學演算法，內容僅供個人自我理解、生活風格靈感與高科技娛樂體驗之參考，不構成任何實質醫療、法律或財務建議。
        </p>
      </footer>
    </div>
  );
}
