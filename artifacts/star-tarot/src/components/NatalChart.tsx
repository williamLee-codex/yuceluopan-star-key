import React,{useState} from 'react';
import type {NatalResult,PlanetId} from '@/lib/natal/types';import {SIGN_NAMES} from '@/lib/natal/reading-adapter';import {assignHouse} from '@/lib/natal/houses';import {normalizeDegrees} from '@/lib/natal/ephemeris';import './NatalChart.css';import {placePlanetLabels} from './natal-labels';
const NAMES:Record<PlanetId,string>={sun:'太陽',moon:'月亮',mercury:'水星',venus:'金星',mars:'火星',jupiter:'木星',saturn:'土星',uranus:'天王星',neptune:'海王星',pluto:'冥王星'};
const GLYPHS:Record<PlanetId,string>={sun:'☉',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',uranus:'♅',neptune:'♆',pluto:'♇'};
const ZODIAC=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const degree=(n:number)=>`${n.toFixed(2)}°`;
export function NatalChart({chart}:{chart:NatalResult}) {
 const [zoom,setZoom]=useState(1),[selected,setSelected]=useState<PlanetId>('sun'),[house,setHouse]=useState<number|null>(null);
 if(chart.status==='invalid-input')return <section className="sk-natal-state" role="alert"><h2>暫時無法顯示星盤</h2><p>出生日期、時間或地點尚未完整確認。請先到御策羅盤檢查出生資料，再回來查看。</p></section>;
 if(chart.status==='ambiguous-time')return <section className="sk-natal-state" role="alert"><h2>出生時間需要確認</h2><p>出生地調整時鐘的那一天，這個時間出現了兩次。兩次對應的星盤不同。</p><p>目前無法分辨是哪一次，暫時不能提供完整星盤。</p></section>;
 if(chart.status==='unknown-time')return <section className="sk-natal-state"><h2>本命星盤・沒有出生時間</h2><p>沒有出生時間，無法確定上升星座與十二宮。下方列出行星在出生當天可能所在的星座；出現兩個星座時，表示當天曾跨越星座。</p><dl className="sk-unknown-signs">{Object.entries(chart.possibleSigns).map(([id,signs])=><div key={id}><dt>{NAMES[id as PlanetId]}</dt><dd>{signs.map(i=>SIGN_NAMES[i]).join('／')}</dd></div>)}</dl></section>;
 const houses=chart.status==='ready'?chart.houses:null,orientation=houses?.asc??0;
 const point=(lon:number,r:number)=>{const a=(180+orientation-lon)*Math.PI/180;return {x:300+r*Math.cos(a),y:300-r*Math.sin(a)}};
 const chosen=chart.planets.find(p=>p.id===selected)!;
 // Place labels apart; their leader lines always terminate at original longitude.
 const labelLongitudes=placePlanetLabels(chart.planets.map(p=>p.longitude));
 return <section className="sk-natal-layout" aria-label="本命星盤">
 <div className="sk-natal-card"><h2>本命星盤</h2><p className="sk-natal-meta">依出生日期、時間與地點排列・{houses?'十二宮':'暫時無法顯示宮位'}</p>
 {!houses&&<p role="status">出生地靠近極地，或宮位目前無法確定。你仍可查看行星所在的星座；上升與十二宮暫不顯示。</p>}
 <div className="sk-natal-viewport"><svg viewBox="0 0 600 600" style={{width:`${zoom*100}%`}} aria-label="本命星盤行星位置圖">
 <circle cx="300" cy="300" r="278" className="sk-wheel-fill"/>{[278,235,218,125].map(r=><circle key={r} cx="300" cy="300" r={r} className="sk-wheel-line"/>)}
 {Array.from({length:12},(_,i)=>{const a=point(i*30,235),b=point(i*30,278),g=point(i*30+15,257);return <g key={i}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="sk-wheel-line"/><text x={g.x} y={g.y} className="sk-zodiac-glyph">{ZODIAC[i]}</text></g>})}
 {houses&&houses.cusps.map((lon,i)=>{const a=point(lon,125),b=point(lon,235);const mid=normalizeDegrees(lon+normalizeDegrees(houses.cusps[(i+1)%12]-lon)/2),n=point(mid,142);return <g key={i}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={i%3===0?'sk-axis-line':'sk-wheel-line'}/><text x={n.x} y={n.y} className="sk-house-number">{i+1}</text></g>})}
 <text x="300" y="286" className="sk-center-title">星穹密鑰</text><text x="300" y="314" className="sk-center-copy">本命星盤</text>
 {chart.planets.map((p,index)=>{const dot=point(p.longitude,218),label=point(labelLongitudes[index],190);return <g key={p.id} data-longitude={p.longitude}><line x1={dot.x} y1={dot.y} x2={label.x} y2={label.y} className="sk-wheel-line"/><circle cx={dot.x} cy={dot.y} r="3" className="sk-planet-dot"/><text x={label.x} y={label.y} className={selected===p.id?'sk-planet-glyph is-selected':'sk-planet-glyph'}>{GLYPHS[p.id]}</text></g>})}
 {houses&&<text x="12" y="300" className="sk-asc-label">上升</text>}
 </svg></div>
 <div className="sk-chart-tools"><button onClick={()=>setZoom(z=>Math.max(1,z-0.25))} disabled={zoom<=1} aria-label="縮小星盤">−</button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(z=>Math.min(2.5,z+0.25))} disabled={zoom>=2.5} aria-label="放大星盤">＋</button><button onClick={()=>setZoom(1)}>重設</button></div>
 </div>
 <div className="sk-natal-card"><h2>行星與宮位</h2><p className="sk-natal-meta">選擇行星，查看星座、角度與宮位。</p><div className="sk-planet-buttons">{chart.planets.map(p=><button key={p.id} className={selected===p.id?'is-active':''} aria-pressed={selected===p.id} onClick={()=>setSelected(p.id)}>{GLYPHS[p.id]} {NAMES[p.id]}</button>)}</div>
 <p className="sk-selected-planet" aria-live="polite">{NAMES[chosen.id]}在{SIGN_NAMES[chosen.signIndex]} {degree(chosen.degreeInSign)}{houses?`・第${assignHouse(chosen.longitude,houses.cusps)}宮`:''}・{chosen.motion==='retrograde'?'逆行':chosen.motion==='stationary'?'留':'順行'}</p>
 <div className="sk-planet-table-wrap"><table><caption>本命行星位置</caption><thead><tr><th>行星</th><th>星座</th><th>角度</th>{houses&&<th>宮位</th>}</tr></thead><tbody>{chart.planets.map(p=><tr key={p.id}><th>{NAMES[p.id]}{p.motion==='retrograde'?' ℞':''}</th><td>{SIGN_NAMES[p.signIndex]}</td><td>{degree(p.degreeInSign)}</td>{houses&&<td>{assignHouse(p.longitude,houses.cusps)}</td>}</tr>)}</tbody></table></div>
 {houses&&<><div className="sk-house-buttons">{houses.cusps.map((_,i)=><button key={i} aria-label={`選擇第${i+1}宮`} aria-pressed={house===i+1} onClick={()=>setHouse(i+1)}>{i+1}宮</button>)}</div>{house&&<p aria-live="polite">第{house}宮宮頭：{SIGN_NAMES[Math.floor(houses.cusps[house-1]/30)]} {degree(houses.cusps[house-1]%30)}</p>}<p className="sk-natal-meta">上升：{SIGN_NAMES[Math.floor(houses.asc/30)]} {degree(houses.asc%30)}・天頂：{SIGN_NAMES[Math.floor(houses.mc/30)]} {degree(houses.mc%30)}</p></>}
 <details className="sk-natal-meta"><summary>出生資料與星盤怎麼看</summary><p>出生日期：{chart.metadata.input.birthDate}・時間：{chart.metadata.input.birthTime}（出生地當地時間）</p><p>星座旁的角度，表示行星在該星座中的位置。「逆行」指從地球看，行星暫時像是往回走；「留」表示它正在轉換方向。</p><p>十二宮用來觀察不同生活主題；上升看你給人的第一印象，天頂看工作與對外表現。</p></details>
 </div></section>;
}
