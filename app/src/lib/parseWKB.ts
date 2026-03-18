export function parseWKBPoint(hex: string): { latitude: number; longitude: number } | null {
  try {
    // EWKB Point: 01(byte_order) + 01000020(type+srid_flag) + E6100000(srid) + x(8bytes) + y(8bytes)
    const coordsHex = hex.substring(18);
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      bytes[i] = parseInt(coordsHex.substring(i * 2, i * 2 + 2), 16);
    }
    const view = new DataView(bytes.buffer);
    const longitude = view.getFloat64(0, true);
    const latitude = view.getFloat64(8, true);
    return { latitude, longitude };
  } catch {
    return null;
  }
}
