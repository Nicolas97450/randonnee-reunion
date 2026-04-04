/**
 * Unit tests for gpxExport.ts
 * Tests GPX XML generation from coordinate traces
 */

import { traceToGpx } from '../../lib/gpxExport';

describe('gpxExport.ts', () => {
  describe('traceToGpx', () => {
    it('should generate valid GPX structure with XML header', () => {
      const coordinates = [[55.5, -21.1, 100]];
      const result = traceToGpx(coordinates, 'Test Trail', '2026-04-04T10:00:00Z');

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<gpx version="1.1" creator="Randonnee Reunion"');
      expect(result).toContain('xmlns="http://www.topografix.com/GPX/1/1">');
    });

    it('should include metadata with trail name', () => {
      const coordinates = [[55.5, -21.1, 100]];
      const trailName = 'Cirque de Mafate';
      const result = traceToGpx(coordinates, trailName, '2026-04-04T10:00:00Z');

      expect(result).toContain('<metadata>');
      expect(result).toContain(`<name>${trailName}</name>`);
      expect(result).toContain('</metadata>');
    });

    it('should include completion timestamp in metadata', () => {
      const coordinates = [[55.5, -21.1, 100]];
      const timestamp = '2026-04-04T10:30:00Z';
      const result = traceToGpx(coordinates, 'Test Trail', timestamp);

      expect(result).toContain(`<time>${timestamp}</time>`);
    });

    it('should create track segment with track points', () => {
      const coordinates = [[55.5, -21.1, 100]];
      const result = traceToGpx(coordinates, 'Test Trail', '2026-04-04T10:00:00Z');

      expect(result).toContain('<trk>');
      expect(result).toContain('<trkseg>');
      expect(result).toContain('<trkpt');
      expect(result).toContain('</trkseg>');
      expect(result).toContain('</trk>');
    });

    it('should include latitude and longitude for each point', () => {
      const coordinates = [
        [55.5, -21.1, 100],
        [55.6, -21.2, 150],
      ];
      const result = traceToGpx(coordinates, 'Test Trail', '2026-04-04T10:00:00Z');

      expect(result).toContain('lat="-21.1"');
      expect(result).toContain('lon="55.5"');
      expect(result).toContain('lat="-21.2"');
      expect(result).toContain('lon="55.6"');
    });

    it('should include elevation when available', () => {
      const coordinates = [[55.5, -21.1, 1234.5]];
      const result = traceToGpx(coordinates, 'Test Trail', '2026-04-04T10:00:00Z');

      expect(result).toContain('<ele>1234.5</ele>');
    });

    it('should round elevation to 1 decimal place', () => {
      const coordinates = [[55.5, -21.1, 1234.56789]];
      const result = traceToGpx(coordinates, 'Test Trail', '2026-04-04T10:00:00Z');

      expect(result).toContain('<ele>1234.6</ele>');
      expect(result).not.toContain('1234.56789');
    });

    it('should handle coordinates without elevation (2D)', () => {
      const coordinates = [[55.5, -21.1], [55.6, -21.2]];
      const result = traceToGpx(coordinates, 'Test Trail', '2026-04-04T10:00:00Z');

      expect(result).toContain('lat="-21.1"');
      expect(result).toContain('lon="55.5"');
      // Should not have elevation element for 2D points
      const lines = result.split('\n');
      const relevantLines = lines.filter(
        (line) => line.includes('lat="-21.1"') || line.includes('lat="-21.2"'),
      );
      relevantLines.forEach((line) => {
        if (line.includes('lat="-21.1"')) {
          expect(line).not.toContain('<ele>');
        }
      });
    });

    it('should handle mixed 2D and 3D coordinates', () => {
      const coordinates = [[55.5, -21.1], [55.6, -21.2, 100], [55.7, -21.3]];
      const result = traceToGpx(coordinates, 'Test Trail', '2026-04-04T10:00:00Z');

      expect(result).toContain('lat="-21.2"');
      expect(result).toContain('<ele>100.0</ele>');
    });

    it('should escape XML special characters in trail name', () => {
      const coordinates = [[55.5, -21.1]];
      const trailName = 'Trail & "Quotes" <tag> \'apostrophe\'';
      const result = traceToGpx(coordinates, trailName, '2026-04-04T10:00:00Z');

      expect(result).toContain('&amp;');
      expect(result).toContain('&quot;');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&apos;');
      expect(result).not.toContain('<tag>');
      expect(result).not.toContain('"Quotes"');
    });

    it('should escape XML special characters in trail name in metadata', () => {
      const coordinates = [[55.5, -21.1]];
      const trailName = 'Test & Trail < > "quoted"';
      const result = traceToGpx(coordinates, trailName, '2026-04-04T10:00:00Z');

      // Should have escaped version in both metadata and track name
      const metadataSection = result.substring(result.indexOf('<metadata>'), result.indexOf('</metadata>'));
      const trkSection = result.substring(result.indexOf('<trk>'), result.indexOf('</trk>'));

      expect(metadataSection).toContain('&amp;');
      expect(trkSection).toContain('&amp;');
    });

    it('should handle ampersand escaping correctly', () => {
      const coordinates = [[55.5, -21.1]];
      const trailName = 'Trail & More & Even More';
      const result = traceToGpx(coordinates, trailName, '2026-04-04T10:00:00Z');

      // Count ampersands — should all be escaped
      const unescapedAmpersands = (result.match(/&(?!amp;|quot;|lt;|gt;|apos;)/g) || []).length;
      expect(unescapedAmpersands).toBe(0);
    });

    it('should handle single quotes in trail name', () => {
      const coordinates = [[55.5, -21.1]];
      const trailName = "It's a beautiful trail";
      const result = traceToGpx(coordinates, trailName, '2026-04-04T10:00:00Z');

      expect(result).toContain('It&apos;s a beautiful trail');
    });

    it('should generate valid GPX for single point', () => {
      const coordinates = [[55.5, -21.1, 1000]];
      const result = traceToGpx(coordinates, 'Single Point', '2026-04-04T10:00:00Z');

      expect(result).toContain('lat="-21.1"');
      expect(result).toContain('lon="55.5"');
      expect(result).toContain('<ele>1000.0</ele>');
      expect(result).toContain('</gpx>');
    });

    it('should generate valid GPX for multiple points', () => {
      const coordinates = [
        [55.5, -21.1, 100],
        [55.51, -21.11, 110],
        [55.52, -21.12, 120],
        [55.53, -21.13, 130],
      ];
      const result = traceToGpx(coordinates, 'Multi Point', '2026-04-04T10:00:00Z');

      expect(result).toContain('lat="-21.1"');
      expect(result).toContain('lat="-21.11"');
      expect(result).toContain('lat="-21.12"');
      expect(result).toContain('lat="-21.13"');
      expect(result.match(/<trkpt/g)).toHaveLength(4);
      expect(result.match(/<ele>/g)).toHaveLength(4);
    });

    it('should handle empty elevation (null)', () => {
      const coordinates: number[][] = [[55.5, -21.1]];
      const result = traceToGpx(coordinates, 'No Elevation', '2026-04-04T10:00:00Z');

      expect(result).toContain('lat="-21.1"');
      expect(result).toContain('lon="55.5"');
      // Should not have ele element for this coordinate
      const pointLine = result.split('\n').find((l) => l.includes('lat="-21.1"'));
      expect(pointLine).not.toContain('<ele>');
    });

    it('should handle zero elevation', () => {
      const coordinates = [[55.5, -21.1, 0]];
      const result = traceToGpx(coordinates, 'Zero Elevation', '2026-04-04T10:00:00Z');

      expect(result).toContain('<ele>0.0</ele>');
    });

    it('should handle negative elevation (below sea level)', () => {
      const coordinates = [[55.5, -21.1, -100]];
      const result = traceToGpx(coordinates, 'Below Sea', '2026-04-04T10:00:00Z');

      expect(result).toContain('<ele>-100.0</ele>');
    });

    it('should handle very large elevation (high peaks)', () => {
      const coordinates = [[55.5, -21.1, 3071]];
      const result = traceToGpx(coordinates, 'Piton des Neiges', '2026-04-04T10:00:00Z');

      expect(result).toContain('<ele>3071.0</ele>');
    });

    it('should have proper XML closing tag', () => {
      const coordinates = [[55.5, -21.1]];
      const result = traceToGpx(coordinates, 'Test', '2026-04-04T10:00:00Z');

      expect(result.endsWith('</gpx>')).toBe(true);
    });

    it('should maintain coordinate order', () => {
      const coordinates = [
        [55.1, -21.1, 100],
        [55.2, -21.2, 200],
        [55.3, -21.3, 300],
      ];
      const result = traceToGpx(coordinates, 'Ordered', '2026-04-04T10:00:00Z');

      const lon55_1Index = result.indexOf('lon="55.1"');
      const lon55_2Index = result.indexOf('lon="55.2"');
      const lon55_3Index = result.indexOf('lon="55.3"');

      expect(lon55_1Index).toBeLessThan(lon55_2Index);
      expect(lon55_2Index).toBeLessThan(lon55_3Index);
    });

    it('should format timestamp correctly', () => {
      const coordinates = [[55.5, -21.1]];
      const timestamp = '2026-04-04T15:30:45Z';
      const result = traceToGpx(coordinates, 'Test', timestamp);

      expect(result).toContain(`<time>${timestamp}</time>`);
    });

    it('should include trail name in both metadata and track', () => {
      const coordinates = [[55.5, -21.1]];
      const trailName = 'Mafate';
      const result = traceToGpx(coordinates, trailName, '2026-04-04T10:00:00Z');

      const metadataNameCount = (result.match(/<metadata>[\s\S]*<name>Mafate<\/name>/)?.[0] || '').length;
      const trackNameCount = (result.match(/<trk>[\s\S]*<name>Mafate<\/name>/)?.[0] || '').length;

      expect(result).toContain('<name>Mafate</name>');
      // Both metadata and track should have the name
      expect(result.split('<name>Mafate</name>').length - 1).toBeGreaterThanOrEqual(2);
    });

    it('should handle special French characters in trail name', () => {
      const coordinates = [[55.5, -21.1]];
      const trailName = 'Cirque de Mafate - Aller-retour';
      const result = traceToGpx(coordinates, trailName, '2026-04-04T10:00:00Z');

      expect(result).toContain('Cirque de Mafate - Aller-retour');
    });
  });
});
