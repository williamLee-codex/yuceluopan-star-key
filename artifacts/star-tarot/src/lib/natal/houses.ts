import {MakeTime,e_tilt,SiderealTime} from 'astronomy-engine';
import {normalizeDegrees,angularDifference} from './ephemeris';
import type {HouseResult} from './types';
const RAD=Math.PI/180;
export function calculateHouses(utc:string,latitude:number,longitude:number):HouseResult {
 const unavailable=(reason:string):HouseResult=>({status:'houses-unavailable',reason});
 if(!Number.isFinite(Date.parse(utc))||!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180)return unavailable('invalid-input');
 const t=MakeTime(new Date(utc)),eps=e_tilt(t).tobl*RAD,theta=normalizeDegrees(SiderealTime(t)*15+longitude);
 // Placidus semi-diurnal arcs are not defined for circumpolar ecliptic segments.
 if(Math.abs(latitude)>=90-eps/RAD)return unavailable('polar-placidus-undefined');
 const phi=latitude*RAD;
 const mc=normalizeDegrees(Math.atan2(Math.sin(theta*RAD)/Math.cos(eps),Math.cos(theta*RAD))/RAD);
 const asc=normalizeDegrees(Math.atan2(-Math.cos(theta*RAD),Math.sin(theta*RAD)*Math.cos(eps)+Math.tan(phi)*Math.sin(eps))/RAD+180);
 const dsc=normalizeDegrees(asc+180),ic=normalizeDegrees(mc+180);
 function equation(lon:number,fraction:number,east:boolean):number {
  const l=lon*RAD,ra=normalizeDegrees(Math.atan2(Math.sin(l)*Math.cos(eps),Math.cos(l))/RAD),dec=Math.asin(Math.sin(eps)*Math.sin(l));
  const c=-Math.tan(phi)*Math.tan(dec);if(Math.abs(c)>=1)return NaN;
  const semiArc=Math.acos(c)/RAD;
  return (east?angularDifference(ra,theta):angularDifference(theta,ra))-fraction*semiArc;
 }
 function solve(end:number,fraction:number,east:boolean):number|null {
  const span=east?normalizeDegrees(end-mc):normalizeDegrees(mc-end);let lo=0,hi=span;
  for(let i=0;i<200;i++){const mid=(lo+hi)/2,lon=mc+(east?mid:-mid),v=equation(lon,fraction,east);if(!Number.isFinite(v))return null;if(v>0)hi=mid;else lo=mid;if(hi-lo<1e-7)return normalizeDegrees(lon)}return null;
 }
 const h11=solve(asc,1/3,true),h12=solve(asc,2/3,true),h9=solve(dsc,1/3,false),h8=solve(dsc,2/3,false);
 if(h11===null||h12===null||h9===null||h8===null)return unavailable('placidus-nonconvergence');
 const cusps=[asc,normalizeDegrees(h8+180),normalizeDegrees(h9+180),ic,normalizeDegrees(h11+180),normalizeDegrees(h12+180),dsc,h8,h9,mc,h11,h12];
 return {status:'ready',asc,mc,dsc,ic,cusps};
}
export function assignHouse(longitude:number,cusps:number[]):number {
 if(cusps.length!==12||!cusps.every(Number.isFinite)||!Number.isFinite(longitude))throw new Error('invalid-house-input');
 for(let i=0;i<12;i++){const arc=normalizeDegrees(cusps[(i+1)%12]-cusps[i]),offset=normalizeDegrees(longitude-cusps[i]);if(offset<arc)return i+1}throw new Error('invalid-house-order');
}
