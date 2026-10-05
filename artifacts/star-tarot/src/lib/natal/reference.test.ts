import {describe,it,expect} from 'vitest';import reference from './fixtures/swiss-reference.json';import {calculatePlanets,angularDifference} from './ephemeris';import {calculateHouses} from './houses';
describe('independent Swiss reference gate',()=>{for(const c of reference.cases){
 it(c.name+' planets within 0.05 degrees',()=>{for(const p of calculatePlanets(c.utc))expect(Math.abs(angularDifference(p.longitude,c.planets[p.id])),p.id).toBeLessThanOrEqual(0.05)});
 it(c.name+' Placidus within 0.1 degrees',()=>{const r=calculateHouses(c.utc,c.latitude,c.longitude);expect(r.status).toBe('ready');if(r.status==='ready'){expect(Math.abs(angularDifference(r.asc,c.asc))).toBeLessThanOrEqual(0.1);expect(Math.abs(angularDifference(r.mc,c.mc))).toBeLessThanOrEqual(0.1);r.cusps.forEach((x,i)=>expect(Math.abs(angularDifference(x,c.cusps[i])),'house '+(i+1)).toBeLessThanOrEqual(0.1))}});
}});
