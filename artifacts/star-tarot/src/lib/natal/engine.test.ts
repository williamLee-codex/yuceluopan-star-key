import {describe,it,expect} from 'vitest';import {calculateNatalChart} from './engine';
const birth={birthDate:'2024-01-15',birthTime:'20:00',timeZone:'Asia/Taipei',latitude:25.033,longitude:121.5654};
describe('unified natal results',()=>{
 it('preserves reproducible complete chart metadata',()=>{const r=calculateNatalChart(birth);expect(r.status).toBe('ready');expect(r).toEqual(calculateNatalChart(birth));if(r.status==='ready'){expect(r.planets).toHaveLength(10);expect(r.metadata.input).toEqual(birth);expect(r.metadata.houseSystem).toBe('placidus')}});
 it('never invents houses for unknown time',()=>{const r=calculateNatalChart({...birth,birthDate:'2024-01-16',birthTime:null});expect(r.status).toBe('unknown-time');expect(r).not.toHaveProperty('houses');expect(r).not.toHaveProperty('utc');if(r.status==='unknown-time'){expect(Object.keys(r.possibleSigns)).toHaveLength(10);expect(r.possibleSigns.moon.length).toBeGreaterThan(1)}});
 it('retains planets where polar houses unavailable',()=>{const r=calculateNatalChart({...birth,latitude:89});expect(r.status).toBe('houses-unavailable');if(r.status==='houses-unavailable')expect(r.planets).toHaveLength(10)});
 it('does not guess a repeated time',()=>expect(calculateNatalChart({...birth,birthDate:'2024-11-03',birthTime:'01:30',timeZone:'America/New_York'}).status).toBe('ambiguous-time'));
});
