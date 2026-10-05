import {describe,it,expect} from 'vitest';
import {calculatePlanets,normalizeDegrees,angularDifference} from './ephemeris';
describe('geocentric ephemeris',()=>{
 it('wraps negative and signed circular angles',()=>{expect(normalizeDegrees(-1)).toBe(359);expect(angularDifference(1,359)).toBe(2);expect(angularDifference(359,1)).toBe(-2)});
 it('calculates ten real positions consistently',()=>{const r=calculatePlanets('2024-01-15T12:00:00Z');expect(r).toHaveLength(10);for(const p of r){expect(p.longitude).toBeGreaterThanOrEqual(0);expect(p.longitude).toBeLessThan(360);expect(p.signIndex).toBe(Math.floor(p.longitude/30));expect(p.degreeInSign).toBeCloseTo(p.longitude%30,8)}expect(r.find(p=>p.id==='moon')?.longitude).not.toBe(calculatePlanets('2024-01-16T12:00:00Z').find(p=>p.id==='moon')?.longitude)});
 it('detects mercury retrograde without a birthday seed',()=>{expect(calculatePlanets('2024-04-10T12:00:00Z').find(p=>p.id==='mercury')?.motion).toBe('retrograde');expect(calculatePlanets('2024-05-10T12:00:00Z').find(p=>p.id==='mercury')?.motion).toBe('direct')});
});
