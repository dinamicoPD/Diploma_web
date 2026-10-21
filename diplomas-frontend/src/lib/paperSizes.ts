/** Dimensiones fisicas del papel para editor, lotes, PNG y PDF. */
export type PaperFormat = 'letter' | 'legal' | 'custom';
export type PaperOrientation = 'portrait' | 'landscape';
export type CustomSizeCm = {width:number; height:number};
const CM_PER_INCH = 2.54;

// Evita lienzos demasiado pequenos o inmanejables en memoria.
const normalizeSide = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 6 && value <= 60
    ? value
    : fallback;

export function normalizeCustomSizeCm(size?: Partial<CustomSizeCm> | null): CustomSizeCm {
  return {
    width: normalizeSide(size?.width, 8.67),
    height: normalizeSide(size?.height, 13),
  };
}

export function getPaperSizeInches(
  format: PaperFormat,
  orientation: PaperOrientation,
  customSizeCm?: Partial<CustomSizeCm> | null,
): {w:number;h:number} {
  if (format === 'custom') {
    const size = normalizeCustomSizeCm(customSizeCm);
    return {w:size.width / CM_PER_INCH, h:size.height / CM_PER_INCH};
  }
  const size = format === 'legal' ? {w:8.5,h:13} : {w:8.5,h:11};
  return orientation === 'portrait' ? size : {w:size.h,h:size.w};
}
