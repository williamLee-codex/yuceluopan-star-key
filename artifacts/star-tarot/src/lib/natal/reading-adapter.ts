import type {NatalResult,PlanetId} from './types';
export const SIGN_NAMES=['牡羊座','金牛座','雙子座','巨蟹座','獅子座','處女座','天秤座','天蠍座','射手座','魔羯座','水瓶座','雙魚座'];
export type ReadingFacts={signs:Partial<Record<PlanetId,string>>;risingSign:string|null;canReadTriangle:boolean};
export function buildNatalReadingFacts(chart:NatalResult):ReadingFacts {
 const signs:Partial<Record<PlanetId,string>>={};let risingSign:string|null=null;
 if(chart.status==='ready'||chart.status==='houses-unavailable')for(const p of chart.planets)signs[p.id]=SIGN_NAMES[p.signIndex];
 if(chart.status==='unknown-time')for(const [id,values] of Object.entries(chart.possibleSigns))signs[id as PlanetId]=values.map(i=>SIGN_NAMES[i]).join('／');
 if(chart.status==='ready')risingSign=SIGN_NAMES[Math.floor(chart.houses.asc/30)];
 return {signs,risingSign,canReadTriangle:chart.status==='ready'};
}
