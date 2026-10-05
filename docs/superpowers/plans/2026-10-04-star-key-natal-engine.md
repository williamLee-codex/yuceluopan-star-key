# 星穹密鑰正式排盤 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 用真實天文位置與經驗證的 Placidus 十二宮建立本命星盤。
**Architecture:** 純計算層依序處理出生時間、天文位置、四軸與宮位，再經單一 adapter 提供 UI。未知時間與計算失敗採明確狀態，不製造精確值。
**Tech Stack:** TypeScript、Astronomy Engine、Vitest、React、SVG；現有 Vite。
**Spec:** ../specs/2026-10-04-star-key-natal-engine-design.md

## Global Constraints
- 不修改 launchToken、/api/platform/launch/validate、會員與 SELF profile。
- 回歸黃道、地心位置、黃道與春分點為觀測日期；Placidus 十二宮。
- 太陽、月亮、水星、金星、火星、木星、土星、天王星、海王星、冥王星。
- 同框架行星黃經差目標不超過 0.05度；ASC/MC 與十二宮差目標不超過 0.1度。
- 未知時間不顯示 ASC、MC、宮位；高緯度失敗不得偷偷切换宮位制。
- 不修改付款、定價及永久解鎖邏輯；不將本命完成說成行運／合盤全部完成。
- 未通過外部數值與瀏覽器驗證不得宣告正式星盤完成，也不直接合併部署。

## Review Focus
1. 不存在曆日及非法座標應拒絕，不自動修成另一日期。
2. 夏令時間重複時刻應要求確認，不猜測使用者的 UTC。
3. 跨午夜与未知時間跨星座應呈現區間，不顯示假精度。
4. 360度附近宮位與行星應正確分配，視覺防碰撞不改角度。
5. 舊解鎖報告不應混入生日 seed 的假落座；接口与钱包不變。

## 檔案分工
以下路徑相對 artifacts/star-tarot。
- src/lib/natal/types.ts：輸入與結果契約。
- src/lib/natal/time.ts：時間與輸入驗證。
- src/lib/natal/ephemeris.ts：天文庫封裝。
- src/lib/natal/houses.ts：四軸、Placidus 與宮位分配。
- src/lib/natal/engine.ts：結果組合。
- src/lib/natal/reading-adapter.ts：現有解讀銜接。
- src/components/NatalChart.tsx、NatalChart.css：繪圖與互動。
- src/lib/natal/*.test.ts：各層測試。
- src/lib/natal/fixtures/*.json：帶來源與座標框架的外部參考。
- src/pages/Home.tsx、src/lib/astrology.ts、src/lib/planets.ts：最小範圍整合。
- package.json、../../pnpm-lock.yaml：鎖定依賴與執行腳本。

### Task 1：輸入與時間解析
**Interfaces**
BirthInput = { birthDate:string; birthTime:string|null; timeZone:string; latitude:number; longitude:number }。
resolveBirthTime(input:BirthInput): TimeResolution。
TimeResolution 是 discriminated union：ready {utc:string}、unknown-time {startUtc:string,endUtc:string}、invalid-input {reason:string}、ambiguous-time {candidates:string[]}。

- [ ] 在 time.test.ts 建立失敗測試：台北 2024-01-15 12:00 → 04:00Z；紐約冬季 →17:00Z、夏季 →16:00Z；2024-03-10 02:30 紐約為 invalid-input；2024-11-03 01:30 為 ambiguous-time 並含 05:30Z、06:30Z。
- [ ] 建立未知時間測試：當日區間須包含歷史時區實際日長，紐約切換日分別 23、25 小時；2024-02-30、緯度91、經度181、無效時區皆 invalid-input。
- [ ] 以 Vitest 執行並確認因未實作失敗。
- [ ] 在 types.ts、time.ts 實作契約；反查本地時間匹配候選，禁止 Date 自動正規化當成有效輸入。
- [ ] 執行目標與既有測試，通過後提交。

### Task 2：正式天體位置
**Interfaces**
PlanetId = sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto。
PlanetPosition = {id:PlanetId; longitude:number; signIndex:number; degreeInSign:number; speedDegPerDay:number; motion:direct|retrograde|stationary}。
calculatePlanets(utc:string): PlanetPosition[]。
normalizeDegrees(value:number):number；angularDifference(a:number,b:number):number。

- [ ] 核驗 Astronomy Engine 當前 API、版本與 MIT 授權，加入確定版本及 lockfile；文件記錄地心與日期黃道的轉換。
- [ ] 收集獨立 JPL Horizons 或同框架星曆 fixtures，記錄來源 URL、查詢時間、觀測原點、坐標框架、修正設定與精度。不得用待測函式生成預期值；無來源案例不得視為 gate。
- [ ] 測試 normalizeDegrees(-1)=359、angularDifference(1,359)=2；十天體 0≤longitude<360，signIndex=floor(longitude/30)，degreeInSign=longitude%30。
- [ ] 參考案例測試角差≤0.05度，覆盖順行、逆行与跨0度；stationary 閾值定為絕對速度≤0.0001度/日。
- [ ] 確認測試失敗，實作 ephemeris.ts；以 UTC 前後各半日角差計算速度。不要使用日心黃經替代地心黃經。
- [ ] 全套測試與 typecheck 通過後提交，保留庫授權。

### Task 3：Placidus 與四軸
**Interfaces**
HouseResult = ready {asc:number;mc:number;dsc:number;ic:number;cusps:number[]} | houses-unavailable {reason:string}。
calculateHouses(utc:string,latitude:number,longitude:number):HouseResult。
assignHouse(longitude:number,cusps:number[]):number（1至12）。

- [ ] 收集獨立 Placidus 參考：台北、南半球、北半球、中高緯與極區；保留來源、UTC、座標与框架。參考若用 Swiss Ephemeris，只作外部驗證資料，不將其程式碼複製為 MIT 實作。
- [ ] 測試 ASC/MC/十二宮對參考角差≤0.1度，DSC=ASC+180、IC=MC+180、12個有限宮頭；極區不收斂為 houses-unavailable。
- [ ] 測試宮頭 [350,20,50,80,110,140,170,200,230,260,290,320]：350及0屬1宮、20屬2宮；邊界包含起點。
- [ ] 確認失敗後獨立實作 houses.ts，採半弧迭代、明確最大200次與角度收斂1e-7度；辨識不成立半弧及不收斂，禁止無限迴圈或默認宮位。
- [ ] 全套測試通過，記錄外部參考結果後提交。超差查明框架或算法，不能放寬 gate。

### Task 4：單一排盤結果與解讀 adapter
**Interfaces**
calculateNatalChart(input:BirthInput):NatalResult。
NatalResult 狀態延續時間契約；ready 含 planets、houses、metadata；unknown-time 含 timeRange、possibleSigns 與 metadata，不含四軸宮位。houses-unavailable 仍保留 planets。
metadata = {engineVersion:string;ephemerisVersion:string;zodiac:tropical;origin:geocentric;houseSystem:placidus;input:BirthInput}。
buildNatalReadingFacts(result:NatalResult): ReadingFacts。

- [ ] engine.test.ts 驗證同輸入結果一致、未知時間跨星座顯示候選、未知時間完全無 ASC/宮位、高緯度保留行星。
- [ ] 未知時間可能星座由當日區間自適應採樣并檢查轉界生成；不是只取中午或只比較兩端。
- [ ] adapter.test.ts 驗證圖表與太陽/月亮/上升卡使用相同結果；birthTime=null 不帶上升推論。
- [ ] 確認失敗後實作 engine.ts、reading-adapter.ts；Home.tsx 改用結果。現有行星模板改吃 sign，不再依生日 seed；不以改標籤冒充星軌行運內容。
- [ ] 確認誕生日鑑、合盤等尚未迁移模組的假落座不可作正式盤面輸出；記錄未完成項目。
- [ ] 回歸17項既有測試、build、typecheck，確認 launch 與钱包檔案無 diff，提交。

### Task 5：SVG 星盤及端到端驗收
**Interfaces**
NatalChart({chart:NatalResult}):ReactElement。
行星與宮位選擇只影響顯示，不修改計算資料。

- [ ] 先建立 UI 測試：行星資料表與 SVG 原始角度一致；未知時間畫面無十二宮/ASC；錯誤狀態有可讀訊息。
- [ ] 實作 NatalChart.tsx、NatalChart.css：可縮放星盤、鍵盤可選行星、原始角度連接防碰撞標籤、同一資料表、減少動畫偏好。
- [ ] 以1440px桌機、390px手機驗證：無橫向溢出、導覽不遮內容、實際背景載入、星盤與資料表一致。測試只 mock 已驗證 profile，不能依賴實際會員資料。
- [ ] 未知時間、正常盤、高緯度及失敗四狀態做畫面驗收；無瀏覽器環境先修復驗收能力，不以建置代替。
- [ ] 執行所有測試、build、typecheck、diff檢查與外部 fixture Gate，更新 PR 說明，提交。
- [ ] 使用者審閱具體結果後才合併或部署。

## 執行與驗證指令
專案 root 用 pnpm --filter @workspace/star-tarot test、build、typecheck。目前環境 pnpm wrapper 可能反覆自動 install；可在 artifacts/star-tarot 使用 node node_modules/vitest/vitest.mjs run、node node_modules/vite/bin/vite.js build、node ../../node_modules/typescript/bin/tsc -p tsconfig.json --noEmit，功能相同。
每個任務先確認新增測試失敗，再實作與全套回歸，不創建僅對應 source 字串的假測試。

## 自審
時間歧義、未知時間、極區、角度環繞、外部數值驗證、圖文一致、授權、資料與付款邊界均有對應任務。
本計畫為本命引擎與展示；不承諾本階段已完成五項內容或金幣水晶整合。
