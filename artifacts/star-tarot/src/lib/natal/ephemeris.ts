import {Body,GeoVector,Ecliptic} from 'astronomy-engine';
import {PLANET_IDS,type PlanetId,type PlanetPosition} from './types';
export const EPHEMERIS_VERSION='astronomy-engine@2.1.19';
export const normalizeDegrees=(value:number)=>((value%360)+360)%360;
export const angularDifference=(a:number,b:number)=>normalizeDegrees(a-b+180)-180;
const bodies:Record<PlanetId,Body>={sun:Body.Sun,moon:Body.Moon,mercury:Body.Mercury,venus:Body.Venus,mars:Body.Mars,jupiter:Body.Jupiter,saturn:Body.Saturn,uranus:Body.Uranus,neptune:Body.Neptune,pluto:Body.Pluto};
export function planetLongitude(id:PlanetId,utc:string):number {
 // GeoVector is geocentric EQJ with light time/aberration; Ecliptic transforms to true ecliptic of date.
 return normalizeDegrees(Ecliptic(GeoVector(bodies[id],new Date(utc),true)).elon);
}
export function calculatePlanets(utc:string):PlanetPosition[]{
 const instant=Date.parse(utc);if(!Number.isFinite(instant))throw new Error('invalid-utc');
 const before=new Date(instant-43200000).toISOString(),after=new Date(instant+43200000).toISOString();
 return PLANET_IDS.map(id=>{const longitude=planetLongitude(id,utc);const speedDegPerDay=angularDifference(planetLongitude(id,after),planetLongitude(id,before));return {id,longitude,signIndex:Math.floor(longitude/30),degreeInSign:longitude%30,speedDegPerDay,motion:Math.abs(speedDegPerDay)<=0.0001?'stationary':speedDegPerDay<0?'retrograde':'direct'}});
}
