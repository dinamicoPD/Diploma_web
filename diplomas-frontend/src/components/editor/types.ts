export type Format = 'letter' | 'legal';

export type BaseElement = {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;           // z-index lógico
};

export type TextElement = BaseElement & {
  type: 'text';
  text: string;
  fontSize: number;    // px
  color: string;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
};

export type ImageElement = BaseElement & {
  type: 'image';
  src: string;
  lockAspect: boolean;
};

export type CanvasElement = TextElement | ImageElement;
