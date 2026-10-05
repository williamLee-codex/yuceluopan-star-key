export type BirthInput = { birthDate:string; birthTime:string|null; timeZone:string; latitude:number; longitude:number };
export type TimeResolution = {status:'ready';utc:string}|{status:'unknown-time';startUtc:string;endUtc:string}|{status:'invalid-input';reason:string}|{status:'ambiguous-time';candidates:string[]};
export const PLANET_IDS=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'] as const;
export type PlanetId=typeof PLANET_IDS[number];
export type PlanetPosition={id:PlanetId;longitude:number;signIndex:number;degreeInSign:number;speedDegPerDay:number;motion:'direct'|'retrograde'|'stationary'};
export type HouseResult={status:'ready';asc:number;mc:number;dsc:number;ic:number;cusps:number[]}|{status:'houses-unavailable';reason:string};
export type Metadata={engineVersion:string;ephemerisVersion:string;zodiac:'tropical';origin:'geocentric';houseSystem:'placidus';input:BirthInput};
export type NatalResult=
 | {status:'ready';utc:string;planets:PlanetPosition[];houses:Extract<HouseResult,{status:'ready'}>;metadata:Metadata}
 | {status:'houses-unavailable';utc:string;planets:PlanetPosition[];reason:string;metadata:Metadata}
 | {status:'unknown-time';timeRange:{startUtc:string;endUtc:string};possibleSigns:Record<PlanetId,number[]>;metadata:Metadata}
 | {status:'invalid-input';reason:string}
 | {status:'ambiguous-time';candidates:string[]};
