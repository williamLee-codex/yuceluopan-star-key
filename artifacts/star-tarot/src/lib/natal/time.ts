import type {BirthInput,TimeResolution} from './types';
const HOUR=3600000;
function utcWall(year:number,month:number,day:number,hour=0,minute=0,second=0):number {
 const d=new Date(0); d.setUTCFullYear(year,month-1,day);d.setUTCHours(hour,minute,second,0);return d.getTime();
}
export function resolveBirthTime(input:BirthInput):TimeResolution {
 const invalid=(reason:string):TimeResolution=>({status:'invalid-input',reason});
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate))return invalid('invalid-date');
 const [y,m,d]=input.birthDate.split('-').map(Number);const wall=utcWall(y,m,d);const date=new Date(wall);
 if(y<1||date.getUTCFullYear()!==y||date.getUTCMonth()!==m-1||date.getUTCDate()!==d)return invalid('invalid-date');
 if(!Number.isFinite(input.latitude)||Math.abs(input.latitude)>90||!Number.isFinite(input.longitude)||Math.abs(input.longitude)>180)return invalid('invalid-coordinates');
 let formatter:Intl.DateTimeFormat;
 try{formatter=new Intl.DateTimeFormat('en-CA',{timeZone:input.timeZone,calendar:'gregory',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});formatter.format(new Date(wall))}catch{return invalid('invalid-timezone')}
 const parts=(ms:number)=>{const p=formatter.formatToParts(new Date(ms));const v=(key:string)=>Number(p.find(x=>x.type===key)?.value);return {year:v('year'),month:v('month'),day:v('day'),hour:v('hour'),minute:v('minute'),second:v('second')}};
 const dateKey=(ms:number)=>{const p=parts(ms);return utcWall(p.year,p.month,p.day)};
 if(input.birthTime===null){
  // Find date boundaries in UTC; DST changes cannot be approximated as 24h.
  const boundary=(target:number)=>{let lo=target-48*HOUR,hi=target+48*HOUR;while(hi-lo>1){const mid=Math.floor((lo+hi)/2);if(dateKey(mid)<target)lo=mid;else hi=mid}return hi};
  const start=boundary(wall),end=boundary(wall+24*HOUR);
  if(start>=end||dateKey(start)!==wall)return invalid('nonexistent-date');
  return {status:'unknown-time',startUtc:new Date(start).toISOString(),endUtc:new Date(end).toISOString()};
 }
 if(!/^\d{2}:\d{2}$/.test(input.birthTime))return invalid('invalid-time');
 const [hour,minute]=input.birthTime.split(':').map(Number);if(hour>23||minute>59)return invalid('invalid-time');
 const target=wall+hour*HOUR+minute*60000;const offsets=new Set<number>();
 for(let delta=-48;delta<=48;delta++){const instant=target+delta*HOUR;const p=parts(instant);offsets.add(utcWall(p.year,p.month,p.day,p.hour,p.minute,p.second)-instant)}
 const candidates=[...offsets].map(offset=>target-offset).filter(ms=>{const p=parts(ms);return p.year===y&&p.month===m&&p.day===d&&p.hour===hour&&p.minute===minute&&p.second===0}).sort((a,b)=>a-b).map(ms=>new Date(ms).toISOString());
 if(!candidates.length)return invalid('nonexistent-time');if(candidates.length>1)return {status:'ambiguous-time',candidates};return {status:'ready',utc:candidates[0]};
}
