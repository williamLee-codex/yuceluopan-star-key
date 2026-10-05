import {describe,it,expect} from 'vitest';import {calculateHouses,assignHouse} from './houses';import {angularDifference} from './ephemeris';
describe('Placidus houses',()=>{
 it('allocates house boundaries across zero',()=>{const c=[350,20,50,80,110,140,170,200,230,260,290,320];expect(assignHouse(350,c)).toBe(1);expect(assignHouse(0,c)).toBe(1);expect(assignHouse(20,c)).toBe(2)});
 it('returns complete opposite axes',()=>{const r=calculateHouses('2024-01-15T12:00:00Z',25.033,121.5654);expect(r.status).toBe('ready');if(r.status==='ready'){expect(r.cusps).toHaveLength(12);expect(Math.abs(angularDifference(r.dsc,r.asc+180))).toBeLessThan(1e-7);expect(Math.abs(angularDifference(r.ic,r.mc+180))).toBeLessThan(1e-7)}});
 it('does not silently replace polar houses',()=>expect(calculateHouses('2024-01-15T12:00:00Z',89,10).status).toBe('houses-unavailable'));
});
