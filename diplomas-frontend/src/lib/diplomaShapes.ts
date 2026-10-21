/** DINAMICO_DIPLOMA_SHAPES_V5
 * Las coordenadas se guardan como porcentajes del papel (no del zoom).
 * Se conservan al cambiar Carta/Oficio o el tamano personalizado.
 */
export type ShapeKind = 'rectangle' | 'ellipse' | 'line';
export type ShapeBorder = 'solid' | 'dashed' | 'dotted';
export type ShapeLineDirection = 'horizontal' | 'vertical' | 'diagonal';

export interface DiplomaShape {
  id: string;
  kind: ShapeKind;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  color: string;
  strokeWidth: number;
  borderStyle: ShapeBorder;
  opacity: number;
  fillColor: string | null;
  radius: number;
  lineDirection: ShapeLineDirection;
  locked: boolean;
  visible: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

export function normalizeShape(shape: DiplomaShape): DiplomaShape {
  const xPct = clamp(shape.xPct, 0, 99);
  const yPct = clamp(shape.yPct, 0, 99);
  return {
    ...shape,
    xPct,
    yPct,
    widthPct: clamp(shape.widthPct, 1, 100 - xPct),
    heightPct: clamp(shape.heightPct, 1, 100 - yPct),
    strokeWidth: clamp(shape.strokeWidth, 0.5, 30),
    radius: clamp(shape.radius, 0, 200),
    opacity: clamp(shape.opacity, 0, 1),
  };
}

let serial = 0;
function newId() {
  serial += 1;
  return `forma_${Date.now().toString(36)}_${serial}_${Math.random().toString(36).slice(2, 7)}`;
}

export function newShape(kind: ShapeKind): DiplomaShape {
  const isLine = kind === 'line';
  return normalizeShape({
    id: newId(),
    kind,
    xPct: isLine ? 15 : 25,
    yPct: isLine ? 50 : 25,
    widthPct: isLine ? 70 : 50,
    heightPct: isLine ? 2 : 50,
    color: '#174A5B',
    strokeWidth: 2.5,
    borderStyle: 'solid',
    opacity: 1,
    fillColor: null,
    radius: 0,
    lineDirection: 'horizontal',
    locked: false,
    visible: true,
  });
}

export function newFrame(marginPercent = 3, radius = 0): DiplomaShape {
  return {
    ...newShape('rectangle'),
    xPct: marginPercent,
    yPct: marginPercent,
    widthPct: 100 - marginPercent * 2,
    heightPct: 100 - marginPercent * 2,
    radius,
  };
}

export function duplicateShape(shape: DiplomaShape): DiplomaShape {
  return normalizeShape({
    ...shape,
    id: newId(),
    xPct: Math.min(shape.xPct + 2, 99),
    yPct: Math.min(shape.yPct + 2, 99),
  });
}

export function setShapeBounds(shape: DiplomaShape, key: 'xPct' | 'yPct' | 'widthPct' | 'heightPct', value: number) {
  return normalizeShape({ ...shape, [key]: value });
}
