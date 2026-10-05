import {resolveBirthTime} from './time';import {calculatePlanets,planetLongitude,EPHEMERIS_VERSION,angularDifference,normalizeDegrees} from './ephemeris';import {calculateHouses} from './houses';import {PLANET_IDS,type BirthInput,type NatalResult,type Metadata,type PlanetId} from './types';
export function calculateNatalChart(input:BirthInput):NatalResult {
 const time=resolveBirthTime(input);if(time.status==='invalid-input'||time.status==='ambiguous-time')return time;
 const metadata:Metadata={engineVersion:'STAR_KEY_NATAL_v1',ephemerisVersion:EPHEMERIS_VERSION,zodiac:'tropical',origin:'geocentric',houseSystem:'placidus',input:{...input}};
 if(time.status==='unknown-time'){
  const start=Date.parse(time.startUtc),end=Date.parse(time.endUtc)-1;
  const possibleSigns={} as Record<PlanetId,number[]>;
  for(const id of PLANET_IDS){const signs=new Set<number>();const value=(ms:number)=>planetLongitude(id,new Date(ms).toISOString());
   const sample=(a:number,b:number,la:number,lb:number,depth:number)=>{signs.add(Math.floor(la/30));signs.add(Math.floor(lb/30));const mid=(a+b)/2,lm=value(mid);signs.add(Math.floor(lm/30));const linear=normalizeDegrees(la+angularDifference(lb,la)/2);const deviation=Math.abs(angularDifference(lm,linear));const distance=Math.min(lm%30,30-lm%30);if(depth<10&&(b-a>1800000||distance<Math.abs(angularDifference(lb,la))+deviation*4+0.0001)&&b-a>1000){sample(a,mid,la,lm,depth+1);sample(mid,b,lm,lb,depth+1)}};
   sample(start,end,value(start),value(end),0);possibleSigns[id]=[...signs].sort((a,b)=>a-b);
  }
  return {status:'unknown-time',timeRange:{startUtc:time.startUtc,endUtc:time.endUtc},possibleSigns,metadata};
 }
 const planets=calculatePlanets(time.utc),houses=calculateHouses(time.utc,input.latitude,input.longitude);
 if(houses.status==='houses-unavailable')return {status:'houses-unavailable',utc:time.utc,planets,reason:houses.reason,metadata};
 return {status:'ready',utc:time.utc,planets,houses,metadata};
}
