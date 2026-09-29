import { describe, expect, it } from 'vitest';
import { COUNTRIES, COUNTRY_ZONES, GMT_OFFSETS, countryGmtOffset, zoneGmtOffset } from './locations';

const OFFSETS = new Set(GMT_OFFSETS.map((o) => o.value));

describe('contact form locations', () => {
  it('maps every country, and only listed countries, to a time zone', () => {
    expect(COUNTRIES.filter((c) => !COUNTRY_ZONES[c])).toEqual([]);
    expect(Object.keys(COUNTRY_ZONES).filter((c) => !COUNTRIES.includes(c))).toEqual([]);
  });

  // January and July cover both hemispheres' summer and winter time.
  it('resolves every zone, in every season, to an offset in the time zone dropdown', () => {
    const dates = [new Date('2026-01-15T12:00:00Z'), new Date('2026-07-15T12:00:00Z')];
    const bad = Object.entries(COUNTRY_ZONES).flatMap(([country, zones]) =>
      zones.flatMap((z) => dates.map((d) => [country, z, zoneGmtOffset(z, d)])).filter(([, , o]) => !OFFSETS.has(o)),
    );
    expect(bad).toEqual([]);
  });

  it('formats offsets to match the dropdown values', () => {
    expect(zoneGmtOffset('Asia/Kolkata')).toBe('GMT+05:30');
    expect(zoneGmtOffset('Asia/Kathmandu')).toBe('GMT+05:45');
    expect(['GMT+00:00', 'GMT+01:00']).toContain(zoneGmtOffset('Europe/London'));
    expect(['GMT−05:00', 'GMT−04:00']).toContain(zoneGmtOffset('America/New_York'));
    expect(zoneGmtOffset('Not/AZone')).toBe('');
  });

  it('defaults a country to its main zone', () => {
    expect(countryGmtOffset('India')).toBe('GMT+05:30');
    expect(countryGmtOffset('Nowhere')).toBe('');
  });
});
