/**
 * Converts a GeoJSON LineString coordinates array to GPX format.
 */
export function traceToGpx(
  coordinates: number[][],
  trailName: string,
  completedAt: string,
): string {
  const trackPoints = coordinates
    .map((coord) => {
      const lon = coord[0];
      const lat = coord[1];
      const ele = coord.length > 2 ? coord[2] : null;
      const eleLine = ele !== null && ele !== undefined ? `\n        <ele>${ele.toFixed(1)}</ele>` : '';
      return `      <trkpt lat="${lat}" lon="${lon}">${eleLine}\n      </trkpt>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Randonnee Reunion"
  xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(trailName)}</name>
    <time>${completedAt}</time>
  </metadata>
  <trk>
    <name>${escapeXml(trailName)}</name>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
