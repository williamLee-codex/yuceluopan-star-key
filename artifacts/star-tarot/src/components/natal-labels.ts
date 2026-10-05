import {normalizeDegrees} from '@/lib/natal/ephemeris';

// Relax adjacent labels on the circle, keeping true longitudes for the leaders.
// Ten 29-unit glyphs at radius 190 fit with a minimum 12-degree separation.
export function placePlanetLabels(longitudes: number[]): number[] {
 const labels=longitudes.map((longitude,index)=>({angle:normalizeDegrees(longitude),index})).sort((a,b)=>a.angle-b.angle);
 if(labels.length<2)return longitudes.map(normalizeDegrees);
 for(let iteration=0;iteration<500;iteration++){
  let largest=0;
  for(let i=0;i<labels.length;i++){
   const next=(i+1)%labels.length;
   const gap=next===0?labels[0].angle+360-labels[i].angle:labels[next].angle-labels[i].angle;
   const correction=Math.max(0,12-gap)/2;
   labels[i].angle-=correction;
   labels[next].angle+=correction;
   largest=Math.max(largest,correction);
  }
  if(largest<1e-7)break;
 }
 const result:number[]=[];
 for(const label of labels)result[label.index]=normalizeDegrees(label.angle);
 return result;
}
