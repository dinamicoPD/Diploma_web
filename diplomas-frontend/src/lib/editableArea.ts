/** DINAMICO_EDITABLE_AREA_V6 - margenes del area editable del diploma. */
export type EditableMarginsCm = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const DEFAULT_EDITABLE_MARGINS_CM: EditableMarginsCm = {
  top: 2, right: 2, bottom: 2, left: 2,
};

const finite = (v: unknown, fallback: number) => {
  const number = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(number) ? Math.max(0, Math.min(8, number)) : fallback;
};

/** Impide que los margenes se crucen o dejen un area de menos de 1 cm. */
export function normalizeEditableMargins(
  input: unknown,
  paperWidthPx?: number,
  paperHeightPx?: number,
  pxPerCm = 96 / 2.54,
): EditableMarginsCm {
  const obj = input && typeof input === 'object' ? input as Partial<EditableMarginsCm> : {};
  const m: EditableMarginsCm = {
    top: finite(obj.top, 2), right: finite(obj.right, 2),
    bottom: finite(obj.bottom, 2), left: finite(obj.left, 2),
  };
  const limitW = Number.isFinite(paperWidthPx) && (paperWidthPx ?? 0) > 0
    ? Math.max(0, (paperWidthPx as number) / pxPerCm - 1) : Infinity;
  const limitH = Number.isFinite(paperHeightPx) && (paperHeightPx ?? 0) > 0
    ? Math.max(0, (paperHeightPx as number) / pxPerCm - 1) : Infinity;
  if (m.left + m.right > limitW) {
    // Mantener el margen izquierdo primero. Recortar el derecho si hace falta.
    m.left = Math.min(m.left, limitW);
    m.right = Math.max(0, limitW - m.left);
  }
  if (m.top + m.bottom > limitH) {
    m.top = Math.min(m.top, limitH);
    m.bottom = Math.max(0, limitH - m.top);
  }
  return m;
}

export function editableBoundsPx(
  paperWidthPx: number, paperHeightPx: number, margins: unknown, pxPerCm = 96 / 2.54,
) {
  const m = normalizeEditableMargins(margins, paperWidthPx, paperHeightPx, pxPerCm);
  return {
    width: Math.max(1, paperWidthPx - (m.left + m.right) * pxPerCm),
    height: Math.max(1, paperHeightPx - (m.top + m.bottom) * pxPerCm),
    margins: m,
  };
}

export function editableMarginsStyle(
  margins: unknown, paperWidthPx?: number, paperHeightPx?: number, pxPerCm = 96 / 2.54,
) {
  const m = normalizeEditableMargins(margins, paperWidthPx, paperHeightPx, pxPerCm);
  return {
    top: m.top * pxPerCm,
    right: m.right * pxPerCm,
    bottom: m.bottom * pxPerCm,
    left: m.left * pxPerCm,
  };
}

/** Coordenadas de los elementos son relativas al area editable, no al papel. */
export function clampToEditableBounds<T extends {x:number;y:number;w:number;h:number}>(
  rect: T, paperWidthPx: number, paperHeightPx: number, margins: unknown, pxPerCm = 96 / 2.54,
): T {
  const area = editableBoundsPx(paperWidthPx, paperHeightPx, margins, pxPerCm);
  const w = Math.min(Math.max(1, rect.w), area.width);
  const h = Math.min(Math.max(1, rect.h), area.height);
  return {
    ...rect,
    x: Math.max(0, Math.min(area.width-w, rect.x)),
    y: Math.max(0, Math.min(area.height-h, rect.y)),
    w, h,
  };
}

/** Conserva en la medida de lo posible la posicion absoluta en el papel. */
export function relocateElementsForMargins<T extends {x:number;y:number;w:number;h:number}>(
  elements: T[],
  oldMargins: unknown,
  newMargins: unknown,
  paperWidthPx: number,
  paperHeightPx: number,
  pxPerCm = 96 / 2.54,
): T[] {
  const oldM = normalizeEditableMargins(oldMargins, paperWidthPx, paperHeightPx, pxPerCm);
  const newM = normalizeEditableMargins(newMargins, paperWidthPx, paperHeightPx, pxPerCm);
  return elements.map(el => clampToEditableBounds({
    ...el,
    x: el.x + (oldM.left - newM.left) * pxPerCm,
    y: el.y + (oldM.top - newM.top) * pxPerCm,
  }, paperWidthPx, paperHeightPx, newM, pxPerCm));
}
