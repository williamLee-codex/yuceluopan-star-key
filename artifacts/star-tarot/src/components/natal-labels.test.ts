import {expect,it} from 'vitest';
import {placePlanetLabels} from './natal-labels';
it.each([[292.751,292.769,292.888,294],[359.9,0.01,0.02,0.03]])('separates conjunction and circular boundary labels: %j',(...longitudes)=>{
 const labels=placePlanetLabels(longitudes);
 for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
 const separation=Math.abs(((labels[i]-labels[j]+540)%360)-180);
 expect(separation).toBeGreaterThanOrEqual(11.99);
 }
});
