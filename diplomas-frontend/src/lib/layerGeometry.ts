// DIPLOMA_EDITOR_LIBRARY_V4
// Coordenadas porcentuales del papel: el diseno mantiene proporciones
// al cambiar de formato, orientacion o zoom visual.
import type { CSSProperties } from 'react';

export type LayerField = 'xPct' | 'yPct' | 'widthPct' | 'heightPct';
export type LayerBounds = {
  xPct?: number;
  yPct?: number;
  widthPct?: number;
  heightPct?: number;
};
export type PaperLayer = LayerBounds & {
  url: string;
  opacity: number;
  visible: boolean;
  fit: 'contain' | 'cover';
};

const finite = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function normalizeLayerBounds<T extends LayerBounds>(layer: T): Required<LayerBounds> {
  const widthPct = clamp(finite(layer.widthPct, 100), 5, 100);
  const heightPct = clamp(finite(layer.heightPct, 100), 5, 100);
  return {
    widthPct,
    heightPct,
    xPct: clamp(finite(layer.xPct, 0), 0, 100 - widthPct),
    yPct: clamp(finite(layer.yPct, 0), 0, 100 - heightPct),
  };
}

export function changeLayerBounds<T extends LayerBounds>(layer: T, field: LayerField, value: number): T {
  if (!Number.isFinite(value)) return layer;
  return { ...layer, ...normalizeLayerBounds({ ...layer, [field]: value }) };
}

export function centerLayer<T extends LayerBounds>(layer: T): T {
  const dims = normalizeLayerBounds(layer);
  return { ...layer, ...dims, xPct: (100 - dims.widthPct) / 2, yPct: (100 - dims.heightPct) / 2 };
}

export function newPaperLayer(url: string, mode: 'watermark' | 'background'): PaperLayer {
  return mode === 'watermark'
    ? { url, opacity: 0.18, visible: true, fit: 'contain', xPct: 20, yPct: 15, widthPct: 60, heightPct: 70 }
    : { url, opacity: 1, visible: true, fit: 'cover', xPct: 0, yPct: 0, widthPct: 100, heightPct: 100 };
}

export function paperLayerStyle(layer: PaperLayer, zIndex: number): CSSProperties {
  const { xPct, yPct, widthPct, heightPct } = normalizeLayerBounds(layer);
  return {
    position: 'absolute', inset: 'auto', right: 'auto', bottom: 'auto',
    left: `${xPct}%`, top: `${yPct}%`,
    width: `${widthPct}%`, height: `${heightPct}%`,
    objectFit: layer.fit,
    objectPosition: 'center',
    opacity: clamp(finite(layer.opacity, 1), 0, 1),
    zIndex, pointerEvents: 'none', userSelect: 'none',
  };
}
