import { describe,it,expect } from 'vitest';
import { resolveBirthTime } from './time';
const base={birthDate:'2024-01-15',birthTime:'12:00',timeZone:'Asia/Taipei',latitude:25,longitude:121};
describe('birth time resolution',()=>{
 it.each([['Asia/Taipei','2024-01-15','2024-01-15T04:00:00.000Z'],['America/New_York','2024-01-15','2024-01-15T17:00:00.000Z'],['America/New_York','2024-07-15','2024-07-15T16:00:00.000Z']])('converts %s %s', (timeZone,birthDate,utc)=>expect(resolveBirthTime({...base,timeZone,birthDate})).toEqual({status:'ready',utc}));
 it('rejects skipped DST time',()=>expect(resolveBirthTime({...base,birthDate:'2024-03-10',birthTime:'02:30',timeZone:'America/New_York'}).status).toBe('invalid-input'));
 it('returns both repeated DST instants',()=>expect(resolveBirthTime({...base,birthDate:'2024-11-03',birthTime:'01:30',timeZone:'America/New_York'})).toEqual({status:'ambiguous-time',candidates:['2024-11-03T05:30:00.000Z','2024-11-03T06:30:00.000Z']}));
 it.each([['2024-03-10',23],['2024-11-03',25]])('preserves unknown time day length %s',(birthDate,hours)=>{const r=resolveBirthTime({...base,birthDate,birthTime:null,timeZone:'America/New_York'});expect(r.status).toBe('unknown-time');if(r.status==='unknown-time')expect((Date.parse(r.endUtc)-Date.parse(r.startUtc))/3600000).toBe(hours)});
 it.each([{birthDate:'2024-02-30'},{latitude:91},{longitude:181},{timeZone:'invalid/time'},{birthTime:'24:00'},{latitude:NaN}])('rejects invalid input %j', overrides=>expect(resolveBirthTime({...base,...overrides}).status).toBe('invalid-input'));
 it('supports years before 100 without 1900 offset',()=>expect(resolveBirthTime({...base,birthDate:'0099-01-15',timeZone:'UTC'})).toEqual({status:'ready',utc:'0099-01-15T12:00:00.000Z'}));
 it('rejects missing coordinates',()=>expect(resolveBirthTime({...base,latitude:undefined as unknown as number}).status).toBe('invalid-input'));
});
