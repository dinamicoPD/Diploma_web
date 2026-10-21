// src/components/editor/CanvasEditor.tsx
/* eslint-disable @next/next/no-img-element */

'use client';
import { DEFAULT_EDITABLE_MARGINS_CM, normalizeEditableMargins, editableBoundsPx, editableMarginsStyle, relocateElementsForMargins, type EditableMarginsCm } from '@/lib/editableArea'; // DINAMICO_EDITABLE_AREA_V6

import { DiplomaShapesLayer, DiplomaShapesPanel, type DiplomaShape } from '@/components/editor/DiplomaShapes'; // DINAMICO_DIPLOMA_SHAPES_V5
// DIPLOMA_STORAGE_V1
import { uploadImage as uploadLayerImage } from '@/lib/uploadClient';
import StorageImage from '@/components/storage/StorageImage';
import StorageLibrary, { type LibraryTarget } from '@/components/storage/StorageLibrary';
import LayerPositionControls from '@/components/storage/LayerPositionControls';
import { newPaperLayer, paperLayerStyle, type LayerBounds } from '@/lib/layerGeometry'; // DIPLOMA_EDITOR_LIBRARY_V4
import StorageStatus from '@/components/storage/StorageStatus';
import { uploadImage } from '@/lib/uploadClient';
import { reportStorageError, mergeFonts } from '@/lib/storageAssets';
import { registerFont, removeFontFace, prepareAssetsForExport } from '@/lib/storageRender';


import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ButtonGroup, Col, Form, Row, Tabs, Tab, Table } from 'react-bootstrap';
import { Rnd } from 'react-rnd';
import * as htmlToImage from 'html-to-image';
import { fetchFonts, createFont, deleteFont, fetchDesigns, createDesign, updateDesign, deleteDesign, importDesigns, FontData as ApiFontData, DesignData as ApiDesignData } from '@/lib/api';
import { getPaperSizeInches, normalizeCustomSizeCm } from '@/lib/paperSizes';

/* ===== Tipos ===== */
type Format = 'letter' | 'legal' | 'custom';
type Orientation = 'portrait' | 'landscape';

type BaseElement = { id: string; type: 'text' | 'image' | 'medal'; x: number; y: number; w: number; h: number; z: number; };
type TextElement = BaseElement & { type: 'text'; text: string; fontSize: number; color: string; fontFamily: string; bold: boolean; italic: boolean; align: 'left'|'center'|'right'; };
type ImageElement = BaseElement & { type: 'image'; src: string; lockAspect: boolean; };
type MedalVariant = 1 | 2 | 3;
type MedalElement = BaseElement & { type: 'medal'; previewVariant: MedalVariant; lockAspect: boolean; };
type CanvasElement = TextElement | ImageElement | MedalElement;

/* ===== Útiles ===== */
const genId = () => Math.random().toString(36).slice(2);
const INCH = 96;
const CM = INCH / 2.54; // ~37.795 px
const CM_TO_PX = (cm: number) => cm * CM;

/* Medallas SVG por defecto para vista previa */
const svgUri = (svg: string) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
const DEFAULT_MEDAL = (n: MedalVariant) => {
  const color = n === 1 ? '#d4af37' : n === 2 ? '#C0C0C0' : '#CD7F32';
  const label = n === 1 ? '1°' : n === 2 ? '2°' : '3°';
  return svgUri(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'>
      <defs><radialGradient id='g' cx='50%' cy='40%' r='70%'>
        <stop offset='0%' stop-color='${color}'/><stop offset='100%' stop-color='${color}' stop-opacity='.9'/></radialGradient></defs>
      <circle cx='128' cy='128' r='120' fill='url(#g)'/>
      <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle'
            font-size='110' font-weight='700' fill='white' font-family='Arial, Helvetica, sans-serif'>${label}</text>
    </svg>`
  );
};

/* ===== Persistencia en LocalStorage ===== */
const STORAGE_KEY = 'diploma_designs_v1';
type MedalImages = Partial<Record<1|2|3, string>>;

// DINAMICO_WATERMARK_PATCH_V3
type DiplomaLayer = LayerBounds & {
  url: string;
  opacity: number;
  visible: boolean;
  fit: 'contain' | 'cover';
};

type DesignData = {
  editableMarginsCm?: EditableMarginsCm;
  pageShapes?: DiplomaShape[];
  watermarkImage?: DiplomaLayer | null;
  backgroundLinkedImage?: DiplomaLayer | null;
  format: Format;
  orientation: Orientation;
  dpi: 150|200|300;
  customSizeCm?: { width: number; height: number };
  backgroundUrl?: string;
  fontAssets?: ApiFontData[];
  elements: CanvasElement[];
  /** ⬅️ NUEVO: imágenes de medallas por puesto */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  medalImages?: any;
};
type DesignSnapshot = ApiDesignData;


/* ===== Fuentes personalizadas (API + @font-face dinámico) ===== */
const guessFormat = (fileName: string): ApiFontData['format'] => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'woff2') return 'woff2';
  if (ext === 'woff') return 'woff';
  if (ext === 'otf') return 'opentype';
  return 'truetype'; // ttf por defecto
};
const mimeFor = (fmt: ApiFontData['format']) =>
  fmt === 'woff2' ? 'font/woff2' :
  fmt === 'woff'  ? 'font/woff'  :
  fmt === 'opentype' ? 'font/otf' :
  'font/ttf';
const injectFontFace = (font: ApiFontData) => { void registerFont(font).catch(reportStorageError); };
const removeInjectedFont = removeFontFace;

/* ================================================================================== */

export default function CanvasEditor({ initialFormat = 'letter' as Format }) {
  /* ===== Tamaño, orientación y exportación ===== */
  const [format, setFormat] = useState<Format>(initialFormat);
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  // Medidas fisicas personalizadas; se guardan con el diseno.
  const [customWidthCm, setCustomWidthCm] = useState<number>(8.67);
  const [customHeightCm, setCustomHeightCm] = useState<number>(13);
  const [dpi, setDpi] = useState<150 | 200 | 300>(300);
  const [backgroundUrl, setBackgroundUrl] = useState<string | undefined>();
  // DINAMICO_DIPLOMA_SHAPES_V5: formas independientes y extendidas a toda la hoja.
  const [pageShapes, setPageShapes] = useState<DiplomaShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [editingShapes, setEditingShapes] = useState(false);
  // Capas independientes del contenido editable.
  const [watermarkImage, setWatermarkImage] = useState<DiplomaLayer | null>(null);
  const [backgroundLinkedImage, setBackgroundLinkedImage] = useState<DiplomaLayer | null>(null);
  const [layerUploading, setLayerUploading] = useState<'watermark' | 'background' | null>(null);

  const paperClass = 'paper ' + (
    format === 'custom' ? 'custom-paper' :
    format === 'letter' ? (orientation === 'portrait' ? 'letter-portrait' : 'letter-landscape') :
    (orientation === 'portrait' ? 'legal-portrait' : 'legal-landscape')
  );

  const paperRef = useRef<HTMLDivElement>(null);
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const safeAreaRef = useRef<HTMLDivElement>(null); // límite = margen 2 cm
  // DINAMICO_EDITABLE_AREA_V6: zona de elementos personalizable en centimetros.
  const [editableMarginsCm, setEditableMarginsCm] = useState<EditableMarginsCm>({...DEFAULT_EDITABLE_MARGINS_CM});

  const paperInches = useMemo(() =>
    getPaperSizeInches(format, orientation, {width: customWidthCm, height: customHeightCm}),
    [format, orientation, customWidthCm, customHeightCm]
  );

  const paperSizePx = useMemo(() => ({
    w: Math.round(paperInches.w * INCH), h: Math.round(paperInches.h * INCH)
  }), [paperInches]);

  // Solo el aspecto en pantalla cambia con el zoom; no las medidas del archivo.
  const [zoomMode, setZoomMode] = useState<'fit' | 'manual'>('fit');
  const [manualZoom, setManualZoom] = useState(100);
  const [fitScale, setFitScale] = useState(1);
  useEffect(() => {
    const viewport = canvasViewportRef.current;
    if (!viewport) return;
    const update = () => {
      const w = Math.max(100, viewport.clientWidth - 40);
      const h = Math.max(100, viewport.clientHeight - 40);
      setFitScale(Math.max(0.1, Math.min(1, w / paperSizePx.w, h / paperSizePx.h)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [paperSizePx.w, paperSizePx.h]);
  const canvasScale = zoomMode === 'fit' ? fitScale : manualZoom / 100;
  const handleOrientation = (next: Orientation) => {
    if (format === 'custom' && next !== orientation && (
      (next === 'landscape' && customWidthCm < customHeightCm) ||
      (next === 'portrait' && customWidthCm > customHeightCm)
    )) {
      setCustomWidthCm(customHeightCm);
      setCustomHeightCm(customWidthCm);
    }
    setOrientation(next);
  };

  const [pngUrl, setPngUrl] = useState<string | undefined>();

  // DIPLOMA_WEB_PRINT_PROOF_V1: exportar la vista actual en medidas fisicas, sin Excel ni guardado remoto.
  const [exportingProof, setExportingProof] = useState(false);
  const downloadPrintProof = async () => {
    const paper = paperRef.current;
    if (!paper || exportingProof) return;
    setExportingProof(true);
    paper.setAttribute('data-exporting', 'true');

    try {
      // Dar tiempo a que el DOM, las fuentes y las imagenes terminen de pintar.
      await new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
      await waitForEditorImageUploads();
      const expectedElements = latestCurrentData.current().elements.filter(e => e.type === 'image').length;
      const renderedElements = paper.querySelectorAll('.safe-area img').length;
      if (renderedElements < expectedElements)
        throw new Error('Faltan imagenes del lienzo en la vista previa. No se generara un PDF incompleto.');
      await prepareAssetsForExport(paper);
      await document.fonts.ready;
      const images = Array.from(paper.querySelectorAll('img'));
      await Promise.all(images.map(async img => {
        try {
          await img.decode();
        } catch {
          throw new Error('Una imagen del diploma no pudo cargarse. Comprueba la sesion y los permisos de Storage antes de imprimir.');
        }
      }));

      const pageWidthPx = paperSizePx.w;
      const pageHeightPx = paperSizePx.h;
      if (pageWidthPx <= 0 || pageHeightPx <= 0) {
        throw new Error('Las medidas del diploma no son validas.');
      }
      // El lienzo se captura a su tamano fisico original. El zoom de pantalla
      // no cambia el tamano ni la calidad de la prueba de impresion.
      const png = await htmlToImage.toPng(paper, {
        width: pageWidthPx,
        height: pageHeightPx,
        pixelRatio: dpi / INCH,
        backgroundColor: '#ffffff',
        style: {
          transform: 'none',
          transformOrigin: 'top left',
          width: String(pageWidthPx) + 'px',
          height: String(pageHeightPx) + 'px',
          margin: '0',
          boxShadow: 'none',
          borderRadius: '0',
        },
        filter: element => {
          // No exportar guias, lineas de reglas ni manejadores de React Rnd.
          if (!(element instanceof HTMLElement)) return true;
          return !element.classList.contains('paper-guides') &&
            !element.classList.contains('react-resizable-handle') &&
            !element.classList.contains('rnd-selected-overlay');
        },
      });

      // jsPDF usa puntos: 72 puntos = 1 pulgada.
      const { jsPDF } = await import('jspdf');
      const widthPt = paperInches.w * 72;
      const heightPt = paperInches.h * 72;
      const pdf = new jsPDF({
        orientation: widthPt > heightPt ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [widthPt, heightPt],
        compress: true,
      });
      pdf.addImage(
        png, 'PNG', 0, 0,
        pdf.internal.pageSize.getWidth(),
        pdf.internal.pageSize.getHeight(),
        undefined, 'FAST'
      );
      const filename = (saveName || 'Mi_diploma').trim().replace(/[\\/:*?"<>|]/g, '_') || 'Mi_diploma';
      pdf.save('Prueba_impresion_' + filename + '.pdf');
    } catch (error) {
      console.error('No se pudo generar la prueba de impresion:', error);
      alert(error instanceof Error ? error.message : 'No se pudo generar el PDF de prueba.');
    } finally {
      paper.removeAttribute('data-exporting');
      setExportingProof(false);
    }
  };

  const exportPNG = async () => {
    if (!paperRef.current) return;
    const node = paperRef.current;
    const widthPx  = Math.round(paperInches.w * INCH);
    const heightPx = Math.round(paperInches.h * INCH);
    const pixelRatio = dpi / 96;

    try {
      node.setAttribute('data-exporting', 'true');
      await waitForEditorImageUploads(false);
      await prepareAssetsForExport(node);
      await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      // Clone the node and remove external stylesheets
      const clonedNode = node.cloneNode(true) as HTMLElement;
      const links = clonedNode.querySelectorAll('link[rel="stylesheet"]');
      links.forEach(link => link.remove());
      const styles = clonedNode.querySelectorAll('style');
      styles.forEach(style => style.remove());

      const originalConsoleError = console.error;
      console.error = () => {}; // Suppress console errors during export
      try {
        const data = await htmlToImage.toPng(clonedNode, {
          width: widthPx,
          height: heightPx,
          pixelRatio,
          backgroundColor: '#ffffff',
          cacheBust: false,
          style: { transform: 'none', width: `${widthPx}px`, height: `${heightPx}px`, margin:'0', padding:'0', boxShadow:'none' },
        });
        setPngUrl(data);
      } catch (error) {
        reportStorageError(error);
      } finally {
        console.error = originalConsoleError; // Restore console.error
      }
    } catch (error) {
      console.error('Error exporting PNG:', error);
      reportStorageError(error);
    } finally {
      node.removeAttribute('data-exporting');
    }
  };

  /* ===== Guías ===== */
  const [showRulers, setShowRulers] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showMarginBox, setShowMarginBox] = useState(true);

  /* ===== Elementos del lienzo ===== */
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => elements.find(e => e.id === selectedId), [elements, selectedId]);
  const nextZ = useMemo(() => (elements.length ? Math.max(...elements.map(e => e.z)) + 1 : 1), [elements]);

  const addText = () => {
    const id = genId();
    const el: TextElement = {
      id, type: 'text', x: CM_TO_PX(2), y: CM_TO_PX(3), w: CM_TO_PX(8), h: CM_TO_PX(2.2), z: nextZ,
      text: 'Doble clic para editar en Propiedades',
      fontSize: 28, color: '#111', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      bold: true, italic: false, align: 'left',
    };
    setElements(p => [...p, el]); setSelectedId(id);
  };

  const addImageFromDataUrl = (dataUrl: string) => {
    const id = genId();
    const el: ImageElement = { id, type:'image', x: CM_TO_PX(2), y: CM_TO_PX(4), w: CM_TO_PX(6), h: CM_TO_PX(4), z: nextZ, src: dataUrl, lockAspect: true };
    setElements(p => [...p, el]); setSelectedId(id);
  };

  const addMedalPlaceholder = () => {
    const id = genId();
    const el: MedalElement = { id, type:'medal', x: CM_TO_PX(2), y: CM_TO_PX(12), w: CM_TO_PX(6), h: CM_TO_PX(6), z: nextZ, previewVariant: 1, lockAspect: true };
    setElements(p => [...p, el]); setSelectedId(id);
  };

  const [uploadsInProgress, setUploadsInProgress] = useState(0);
  const pendingImageUploads = useRef(new Set<Promise<void>>());
  const failedImageUploads = useRef(0);
  const waitForEditorImageUploads = async (checkFailures = true) => {
    // Es posible que haya varias subidas en paralelo (logo, fondo, medallas).
    while (pendingImageUploads.current.size) {
      await Promise.allSettled(Array.from(pendingImageUploads.current));
    }
    // El estado se guarda en React; asegurar que todas las actualizaciones sean visibles.
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    if (checkFailures && failedImageUploads.current) {
      const count = failedImageUploads.current;
      failedImageUploads.current = 0;
      throw new Error(`No se guardo el diseno: fallaron ${count} subidas de imagenes. Vuelve a seleccionar esos archivos.`);
    }
  };
  const uploadToEditor = async (file: File, apply: (reference: string) => void) => {
    setUploadsInProgress(value => value + 1);
    const task = (async () => {
      const reference = await uploadImage(file);
      if (!reference.startsWith('supabase://diploma-assets/'))
        throw new Error('Storage devolvio una referencia de imagen inesperada.');
      apply(reference);
    })();
    pendingImageUploads.current.add(task);
    try { await task; }
    catch (error) { failedImageUploads.current += 1; reportStorageError(error); }
    finally {
      pendingImageUploads.current.delete(task);
      setUploadsInProgress(value => Math.max(0, value - 1));
    }
  };
  const onPickImageElement = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (file) await uploadToEditor(file, addImageFromDataUrl);
  };
  const onPickBackground = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (file) await uploadToEditor(file, setBackgroundUrl);
  };

  /* ====== Límite: que nada salga del área segura ====== */
  // DINAMICO_EDITABLE_AREA_V6: cambiar el area conserva la posicion fisica de cada objeto.
  const applyEditableMargins = (patch: Partial<EditableMarginsCm>) => {
    const before = normalizeEditableMargins(editableMarginsCm, paperSizePx.w, paperSizePx.h, CM);
    const next = normalizeEditableMargins({...before, ...patch}, paperSizePx.w, paperSizePx.h, CM);
    if (Object.keys(before).every(side => before[side as keyof EditableMarginsCm] === next[side as keyof EditableMarginsCm])) return;
    setElements(previous => relocateElementsForMargins(previous, before, next, paperSizePx.w, paperSizePx.h, CM));
    setEditableMarginsCm(next);
  };

  const clampToSafe = (rect: {x:number;y:number;w:number;h:number}) => {
    const sa = safeAreaRef.current;
    if (!sa) return rect;
    const maxW = sa.clientWidth;
    const maxH = sa.clientHeight;

    let { x, y, w, h } = rect;
    if (w > maxW) w = maxW;
    if (h > maxH) h = maxH;

    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + w > maxW) x = Math.max(0, maxW - w);
    if (y + h > maxH) y = Math.max(0, maxH - h);

    return { x, y, w, h };
  };

  const updateRect = (id: string, x: number, y: number, w: number, h: number) => {
    const clamped = clampToSafe({ x, y, w, h });
    setElements(prev => prev.map(e => (e.id === id ? { ...e, ...clamped } : e)));
  };

  const updateText = (patch: Partial<TextElement>) =>
    selected && selected.type === 'text' &&
    setElements(prev => prev.map(e => (e.id === selected.id ? { ...(e as TextElement), ...patch } : e)));

  const updateImage = (patch: Partial<ImageElement>) =>
    selected && selected.type === 'image' &&
    setElements(prev => prev.map(e => (e.id === selected.id ? { ...(e as ImageElement), ...patch } : e)));

  const updateMedal = (patch: Partial<MedalElement>) =>
    selected && selected.type === 'medal' &&
    setElements(prev => prev.map(e => (e.id === selected.id ? { ...(e as MedalElement), ...patch } : e)));

  const removeSelected = () => { if (!selectedId) return; setElements(p => p.filter(e => e.id !== selectedId)); setSelectedId(null); };

  const duplicateSelected = () => {
    if (!selected) return;
    const id = genId();
    const base: CanvasElement = { ...selected, id, x: selected.x + 20, y: selected.y + 20, z: nextZ } as CanvasElement;
    const c = clampToSafe({ x: base.x, y: base.y, w: base.w, h: base.h });
    setElements(p => [...p, { ...base, ...c }]); setSelectedId(id);
  };

  const bringToFront = () => selected && setElements(p => p.map(e => e.id === selected.id ? { ...e, z: nextZ } : e));
  const sendToBack = () => {
    if (!selected) return;
    const minZ = elements.length ? Math.min(...elements.map(e => e.z)) : 1;
    setElements(p => p.map(e => e.id === selected.id ? { ...e, z: minZ - 1 } : e));
  };

  /* Auto-export */
  useEffect(() => {
    const id = setTimeout(exportPNG, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, orientation, customWidthCm, customHeightCm, dpi, backgroundUrl, elements, showRulers, showGrid, showMarginBox]);

  /* Re-clamp al cambiar tamaño/orientación */
  useEffect(() => {
    const sa = safeAreaRef.current;
    if (!sa) return;
    setElements(prev => prev.map(e => {
      const c = clampToSafe({ x: e.x, y: e.y, w: e.w, h: e.h });
      return (c.x!==e.x || c.y!==e.y || c.w!==e.w || c.h!==e.h) ? { ...e, ...c } : e;
    }));
  }, [format, orientation, customWidthCm, customHeightCm]);

  /* ======= Guardar / Abrir ======= */
  const [designs, setDesigns] = useState<ApiDesignData[]>([]);
  const [designsLoading, setDesignsLoading] = useState(true);
  const [saveName, setSaveName] = useState<string>('Mi diseño');
  const refreshDesigns = async () => {
    const fetched = await fetchDesigns();
    setDesigns(fetched);
    setDesignsLoading(false);
  };
  useEffect(() => { refreshDesigns(); }, []);

  /** ⬅️ NUEVO: estado de imágenes de medallas */
  const [medalImages, setMedalImages] = useState<MedalImages>({});

  const currentData = (): DesignData => ({
    editableMarginsCm,
    pageShapes,
    format, orientation, dpi, backgroundUrl, elements,
    customSizeCm: {width: customWidthCm, height: customHeightCm},
    medalImages, // ⬅️ incluir en el diseño
    fontAssets: customFonts.filter(font => font.dataUrl.startsWith('supabase://')),
    watermarkImage, backgroundLinkedImage,
  });

  // DIPLOMA_IMAGE_INTEGRITY_V1: snapshot siempre actualizado tras completar subidas.
  const latestCurrentData = useRef(currentData);
  latestCurrentData.current = currentData;
  const [savingImageDesign, setSavingImageDesign] = useState(false);
  const countDesignImages = (data: DesignData) =>
    (Array.isArray(data.elements) ? data.elements.filter(e => e.type === 'image').length : 0);
  const assertPersistedAssets = (wanted: DesignData, actual: unknown) => {
    const stored = actual as { elements?: CanvasElement[]; backgroundUrl?: string; medalImages?: Record<string, string> } | undefined;
    if (!stored || !Array.isArray(stored.elements)) throw new Error('Supabase no devolvio los elementos del diseno guardado.');
    const expectedImages = wanted.elements.filter(e => e.type === 'image').map(e => (e as ImageElement).src);
    const storedImages = new Set(stored.elements.filter(e => e.type === 'image').map(e => (e as ImageElement).src));
    if (expectedImages.some(src => !src || !storedImages.has(src))) {
      throw new Error('El diseno guardado no incluye todas las imagenes. Verifica permisos y columnas de designs.');
    }
    if (wanted.backgroundUrl && stored.backgroundUrl !== wanted.backgroundUrl) {
      throw new Error('El fondo guardado no coincide con el fondo actual.');
    }
    const medals = wanted.medalImages || {};
    for (const key of Object.keys(medals)) {
      if (medals[key] && stored.medalImages?.[key] !== medals[key]) {
        throw new Error('La medalla guardada no coincide con el diseno actual.');
      }
    }
  };

  const saveDesign = async () => {
    if (layerUploading !== null) {
      alert('Espera a que termine la subida de la marca de agua o fondo vinculado antes de guardar.');
      return;
    }
    if (savingImageDesign) return;
    setSavingImageDesign(true);
    try {
      // Espera el resultado de cada subida y dos cuadros de React para leer su estado final.
      await waitForEditorImageUploads();
      const data = latestCurrentData.current();
      // Cada elemento debe conservar una referencia legible, no un blob temporal.
      for (const element of data.elements) {
        if (element.type === 'image' && (!(element as ImageElement).src || (element as ImageElement).src.startsWith('blob:')))
          throw new Error('Una imagen todavia no esta lista para guardarse. Vuelve a subirla.');
      }
      const existing = designs.find(d => d.name.trim().toLowerCase() === saveName.trim().toLowerCase());
      let saved: ApiDesignData;
      if (existing) {
        saved = await updateDesign(existing.id, { name: saveName, data });
      } else {
        saved = await createDesign({ name: saveName || `Guardar Diseño ${Date.now()}`, data, medalImages: data.medalImages });
      }
      assertPersistedAssets(data, saved.data);
      await refreshDesigns();
      alert(`Diseño guardado correctamente. Imágenes: ${countDesignImages(data)}. Fondo: ${data.backgroundUrl ? 'sí' : 'no'}.`);
    } catch (error) {
      console.error('Error saving design:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar el diseño.');
    } finally {
      setSavingImageDesign(false);
    }
  };

  const openDesign = (id: string) => {
    const d = designs.find(x => x.id === id); if (!d || !d.data || !d.data.elements) return;
    setFormat(d.data.format); setOrientation(d.data.orientation); setDpi(d.data.dpi);
    const openedSize = normalizeCustomSizeCm(d.data.customSizeCm);
    setCustomWidthCm(openedSize.width); setCustomHeightCm(openedSize.height);
    setBackgroundUrl(d.data.backgroundUrl);
    const openedEditableMargins = normalizeEditableMargins(d.data.editableMarginsCm);
    setEditableMarginsCm(openedEditableMargins);
    setPageShapes(Array.isArray(d.data.pageShapes) ? d.data.pageShapes : []);
    setSelectedShapeId(null);
    setWatermarkImage(d.data.watermarkImage ?? null);
    setBackgroundLinkedImage(d.data.backgroundLinkedImage ?? null);
    if (Array.isArray(d.data.fontAssets)) {
      setCustomFonts(prev => mergeFonts(prev, d.data.fontAssets));
      d.data.fontAssets.forEach(injectFontFace);
    }
    setMedalImages(d.data.medalImages ?? {}); // ⬅️ cargar medallas
    // clamp al cargar
    const inches = getPaperSizeInches(d.data.format, d.data.orientation, d.data.customSizeCm);
    const widthPx = Math.round(inches.w * INCH);
    const heightPx = Math.round(inches.h * INCH);
    const openedArea = editableBoundsPx(widthPx, heightPx, openedEditableMargins, CM);
    const safeW = openedArea.width;
    const safeH = openedArea.height;
    setElements((d.data.elements as CanvasElement[]).map(e => {
      let { x, y, w, h } = e;
      if (w > safeW) w = safeW;
      if (h > safeH) h = safeH;
      if (x < 0) x = 0;
      if (y < 0) y = 0;
      if (x + w > safeW) x = Math.max(0, safeW - w);
      if (y + h > safeH) y = Math.max(0, safeH - h);
      return { ...e, x, y, w, h };
    }));
    setSelectedId(null); setSaveName(d.name);
  };

  const handleDeleteDesign = async (id: string) => {
    try {
      await deleteDesign(id);
      await refreshDesigns();
    } catch (error) {
      console.error('Error deleting design:', error);
      alert('Error al eliminar el diseño.');
    }
  };

  const exportDesignJSON = (id?: string) => {
    const data = currentData();
    const snap = id ? designs.find(d => d.id === id) : { name: saveName, data };
    if (!snap) return;
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = id ? `diseno_${snap.name}.json` : `diseno_actual.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const importDesignJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(String(r.result));
        const data: DesignData = parsed.data ? parsed.data as DesignData : parsed as DesignData;
        if (!data.elements) return alert('Archivo inválido: falta elements.');
        setFormat(data.format); setOrientation(data.orientation); setDpi(data.dpi);
        const importedSize = normalizeCustomSizeCm(data.customSizeCm);
        setCustomWidthCm(importedSize.width); setCustomHeightCm(importedSize.height);
        setBackgroundUrl(data.backgroundUrl);
        const importedEditableMargins = normalizeEditableMargins(data.editableMarginsCm);
        setEditableMarginsCm(importedEditableMargins);
        setPageShapes(Array.isArray(data.pageShapes) ? data.pageShapes : []);
        setSelectedShapeId(null);
        setWatermarkImage(data.watermarkImage ?? null);
        setBackgroundLinkedImage(data.backgroundLinkedImage ?? null);
        if (Array.isArray(data.fontAssets)) {
          const savedFonts = data.fontAssets;
          setCustomFonts(prev => mergeFonts(prev, savedFonts));
          savedFonts.forEach(injectFontFace);
        }
        setMedalImages(data.medalImages ?? {}); // ⬅️ importar medallas
        const inches = getPaperSizeInches(data.format, data.orientation, data.customSizeCm);
        const widthPx = Math.round(inches.w * INCH);
        const heightPx = Math.round(inches.h * INCH);
        const openedArea = editableBoundsPx(widthPx, heightPx, importedEditableMargins, CM);
    const safeW = openedArea.width;
    const safeH = openedArea.height;
        setElements((data.elements as CanvasElement[]).map(e => {
          let { x, y, w, h } = e;
          if (w > safeW) w = safeW;
          if (h > safeH) h = safeH;
          if (x < 0) x = 0;
          if (y < 0) y = 0;
          if (x + w > safeW) x = Math.max(0, safeW - w);
          if (y + h > safeH) y = Math.max(0, safeH - h);
          return { ...e, x, y, w, h };
        }));
        setSelectedId(null);
        if ((parsed as DesignSnapshot).name) setSaveName((parsed as DesignSnapshot).name);
      } catch { alert('Archivo inválido.'); }
    };
    r.readAsText(f); e.currentTarget.value = '';
  };

  const importDesignsJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        const parsed = JSON.parse(String(r.result));
        if (Array.isArray(parsed)) {
          await importDesigns(parsed);
          await refreshDesigns();
        } else {
          alert('El archivo debe contener un array de diseños.');
        }
      } catch { alert('Archivo inválido.'); }
    };
    r.readAsText(f); e.currentTarget.value = '';
  };

  /* ======= Fuentes personalizadas ======= */
  const [customFonts, setCustomFonts] = useState<ApiFontData[]>([]);
  const [fontsLoading, setFontsLoading] = useState(true);
  useEffect(() => {
    const loadFonts = async () => {
      const fonts = await fetchFonts();
      setCustomFonts(previous => mergeFonts(previous, fonts));
      fonts.forEach(injectFontFace);
      setFontsLoading(false);
    };
    void loadFonts().catch(error => { setFontsLoading(false); reportStorageError(error); });
  }, []);

  const addFontsFromFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const list = Array.from(files);
    for (const f of list) {
      if (f.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`Fuente ${f.name} es demasiado grande. Máximo 10MB.`);
        continue;
      }
      const fmt = guessFormat(f.name);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(f);
      });
      const base = f.name.replace(/\.(woff2?|ttf|otf)$/i, '');
      const family = base.replace(/[_\-]+/g,' ').trim(); // nombre legible
      try {
        const newFont = await createFont({ family, format: fmt, dataUrl, fileName: f.name });
        injectFontFace(newFont);
        setCustomFonts(prev => [...prev, newFont]);
      } catch (error) {
        console.error('Error creating font:', error);
        alert('Error al subir la fuente.');
      }
    }
  };

  const removeFont = async (id: string) => {
    try {
      await deleteFont(id);
      setCustomFonts(prev => prev.filter(f => f.id !== id));
      removeInjectedFont(id);
    } catch (error) {
      console.error('Error deleting font:', error);
      alert('Error al eliminar la fuente.');
    }
  };

  // Opciones de fuentes en el selector de Propiedades
  const fontOptions = [
    { label: 'Sistema', value: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Times New Roman', value: 'Times New Roman, Times, serif' },
    { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
    { label: 'Robot', value: 'Roboto, Arial, sans-serif' },
    { label: 'Chomsky', value: 'Chomsky, serif' },
    ...customFonts.map(cf => ({ label: `${cf.family} (custom)`, value: `${cf.family}, serif` })),
  ];

  /* ===== Handlers Medallas (carga/limpia) ===== */
  const onPickMedal = (place: 1|2|3) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (file) await uploadToEditor(file, reference => setMedalImages(prev => ({ ...prev, [place]: reference })));
  };
  const clearMedal = (place: 1|2|3) =>
    setMedalImages(prev => {
      const copy = { ...prev };
      delete copy[place];
      return copy;
    });

  // Capas independientes, subidas directamente al cliente existente de Supabase Storage.
  const uploadBackgroundLayer = (kind: 'watermark' | 'background') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Imagen demasiado grande (maximo 10 MB).'); return; }
    setLayerUploading(kind);
    try {
      const url = await uploadLayerImage(file);
      if (!url.startsWith('supabase://diploma-assets/')) throw new Error('Storage no devolvio una referencia valida.');
      const layer: DiplomaLayer = newPaperLayer(url, kind);
      if (kind === 'watermark') setWatermarkImage(layer);
      else setBackgroundLinkedImage(layer);
    } catch (error) {
      console.error('Error al cargar capa del diploma:', error);
      alert(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
    } finally {
      setLayerUploading(null);
    }
  };

  /* ===== Render ===== */
  return (
    // ⬇️ No tocamos el papel; solo el layout de columnas
    <Row className="g-4 flex-nowrap">
      {/* ===== Panel (más ancho) ===== */}
      <Col xs="auto" className="editor-panel-col">
        <div className="sticky-panel wide">
          <h1 className="h5 fw-bold mb-3">Lienzo con guías</h1>
          <StorageStatus fontAssets={customFonts} />
          {uploadsInProgress > 0 && <p role="status" className="small text-muted">Subiendo archivo a Supabase Storage...</p>}

          <Row>
            <Col xs={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tamaño</Form.Label>
                <Form.Select value={format} onChange={e => setFormat(e.target.value as Format)}>
                  {orientation === 'portrait' ? (
                    <>
                      <option value="letter">Carta (8.5×11&quot;)</option>
                      <option value="legal">Oficio (8.5×13&quot;)</option>
                      <option value="custom">Personalizado (centímetros)</option>
                    </>
                  ) : (
                    <>
                      <option value="letter">Carta (11×8.5&quot;)</option>
                      <option value="legal">Oficio (13×8.5&quot;)</option>
                      <option value="custom">Personalizado (centímetros)</option>
                    </>
                  )}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group className="mb-3">
                <Form.Label>Orientación</Form.Label>
                <Form.Select value={orientation} onChange={e => handleOrientation(e.target.value as Orientation)}>
                  <option value="portrait">Vertical</option>
                  <option value="landscape">Horizontal</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {format === 'custom' && (
            <div className="border rounded p-2 mb-3">
              <div className="small fw-semibold mb-2">Tamaño personalizado (cm)</div>
              <Row className="g-2">
                <Col xs={6}>
                  <Form.Label className="small">Ancho</Form.Label>
                  <Form.Control type="number" min={6} max={60} step="0.01"
                    value={customWidthCm}
                    onChange={e => setCustomWidthCm(Number(e.target.value))}
                    onBlur={() => setCustomWidthCm(normalizeCustomSizeCm({width:customWidthCm,height:customHeightCm}).width)} />
                </Col>
                <Col xs={6}>
                  <Form.Label className="small">Alto</Form.Label>
                  <Form.Control type="number" min={6} max={60} step="0.01"
                    value={customHeightCm}
                    onChange={e => setCustomHeightCm(Number(e.target.value))}
                    onBlur={() => setCustomHeightCm(normalizeCustomSizeCm({width:customWidthCm,height:customHeightCm}).height)} />
                </Col>
              </Row>
              <div className="small text-body-secondary mt-2">
                Por ejemplo: 13 × 8.67 cm. Cambiar la orientación gira el papel cuando es necesario.
              </div>
            </div>
          )}
          <div className="border rounded p-2 mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <Form.Label className="small fw-semibold mb-0">Vista del lienzo</Form.Label>
              <Form.Select size="sm" style={{width:150}} value={zoomMode}
                onChange={e => setZoomMode(e.target.value as 'fit' | 'manual')}>
                <option value="fit">Ajustar a pantalla</option>
                <option value="manual">Zoom manual</option>
              </Form.Select>
            </div>
            {zoomMode === 'manual' && (
              <Form.Range min={25} max={150} step={5} value={manualZoom}
                onChange={e => setManualZoom(Number(e.target.value))}/>
            )}
            <div className="small text-body-secondary">
              Vista {Math.round(canvasScale * 100)}% · Papel {paperSizePx.w} × {paperSizePx.h} px (96 ppi)
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>DPI</Form.Label>
            <Form.Select value={dpi} onChange={e => setDpi(Number(e.target.value) as 150 | 200 | 300)}>
              <option value={150}>150</option>
              <option value={200}>200</option>
              <option value={300}>300</option>
            </Form.Select>
          </Form.Group>

          <Tabs defaultActiveKey="agregar" className="mb-3" fill justify>
            <Tab eventKey="agregar" title="Agregar">
              <div className="d-grid gap-2 mb-3">
                <Button variant="primary" onClick={addText}>Añadir Texto</Button>
                <div>
                  <Form.Label className="mb-1">Añadir Imagen</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={onPickImageElement} />
                </div>
                <div className="mb-2">
                  <Form.Label className="mb-1">Fondo del Papel</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={onPickBackground} />
                  {backgroundUrl && (
                    <Button variant="link" className="p-0 mt-1" onClick={() => setBackgroundUrl(undefined)}>
                      Quitar fondo
                    </Button>
                  )}
                </div>
                <Button variant="outline-warning" onClick={addMedalPlaceholder}>Insertar marcador de Medalla (1°/2°/3°)</Button>
              </div>
            </Tab>

            {/* ===== ⬇️ NUEVO: pestaña Medallas ===== */}
            <Tab eventKey="medals" title="Medallas">
              <div className="small text-body-secondary mb-2">
                Carga las imágenes para <strong>1°</strong>, <strong>2°</strong> y <strong>3°</strong> lugar. Estas se guardan dentro del diseño y se usan tanto aquí como en <strong>/lotes</strong>.
              </div>

              {[1,2,3].map((n) => (
                <div key={n} className="border rounded p-2 mb-2">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <strong className="me-3">{n}° lugar</strong>
                    <div className="d-flex gap-2">
                      <Form.Label className="btn btn-sm btn-outline-primary mb-0">
                        Subir imagen
                        <Form.Control type="file" accept="image/*" className="d-none" onChange={onPickMedal(n as 1|2|3)} />
                      </Form.Label>
                      {medalImages[n as 1|2|3] && (
                        <Button size="sm" variant="outline-danger" onClick={()=>clearMedal(n as 1|2|3)}>Quitar</Button>
                      )}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div style={{width:120, height:120, border:'1px dashed #ccc', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa', overflow:'hidden'}}>
                      <StorageImage
                        src={medalImages[n as 1|2|3] ?? DEFAULT_MEDAL(n as MedalVariant)}
                        alt={`Medalla ${n}°`}
                        style={{maxWidth:'100%', maxHeight:'100%', display:'block', objectFit:'contain'}}
                      />
                    </div>
                    <div className="small text-body-secondary">
                      Formatos recomendados: PNG/SVG con transparencia.<br/>
                      Tamaño sugerido (referencia): 800–1500 px por lado.
                    </div>
                  </div>
                </div>
              ))}
            </Tab>

            <Tab eventKey="prop" title="Propiedades">
              {!selected && <div className="text-body-secondary">Selecciona un elemento en el lienzo.</div>}

              {selected && selected.type === 'text' && (
                <>
                  <Form.Group className="mb-2">
                    <Form.Label>Contenido</Form.Label>
                    <Form.Control as="textarea" rows={3} value={selected.text} onChange={e => updateText({ text: e.target.value })} />
                  </Form.Group>
                  <Row className="mb-2">
                    <Col xs={6}>
                      <Form.Label>Tamaño (px)</Form.Label>
                      <Form.Control type="number" min={10} max={160} value={selected.fontSize} onChange={e => updateText({ fontSize: Number(e.target.value) })} />
                    </Col>
                    <Col xs={6}>
                      <Form.Label>Color</Form.Label>
                      <Form.Control type="color" value={selected.color} onChange={e => updateText({ color: e.target.value })} />
                    </Col>
                  </Row>
                  <Form.Group className="mb-2">
                    <Form.Label>Fuente</Form.Label>
                    <Form.Select value={selected.fontFamily} onChange={e => updateText({ fontFamily: e.target.value })}>
                      {fontOptions.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                    </Form.Select>
                  </Form.Group>
                  <Row className="mb-2">
                    <Col xs="auto" className="d-flex align-items-center gap-2">
                      <Form.Check type="switch" id="bold" label="Negrita" checked={selected.bold} onChange={e => updateText({ bold: e.target.checked })} />
                      <Form.Check type="switch" id="italic" label="Itálica" checked={selected.italic} onChange={e => updateText({ italic: e.target.checked })} />
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>Alineación</Form.Label>
                    <Form.Select value={selected.align} onChange={e => updateText({ align: e.target.value as TextElement['align'] })}>
                      <option value="left">Izquierda</option>
                      <option value="center">Centro</option>
                      <option value="right">Derecha</option>
                    </Form.Select>
                  </Form.Group>

                  <ButtonGroup className="mb-3">
                    <Button size="sm" variant="outline-secondary" className="btn-prop" onClick={duplicateSelected}>Duplicar</Button>
                    <Button size="sm" variant="outline-secondary" className="btn-prop" onClick={bringToFront}>Al frente</Button>
                    <Button size="sm" variant="outline-secondary" className="btn-prop" onClick={sendToBack}>Al fondo</Button>
                    <Button size="sm" variant="outline-danger" className="btn-prop" onClick={removeSelected}>Eliminar</Button>
                  </ButtonGroup>
                </>
              )}

              {selected && selected.type === 'image' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Check type="switch" id="lockAspect" label="Bloquear proporción" checked={(selected as ImageElement).lockAspect} onChange={e => updateImage({ lockAspect: e.target.checked })} />
                  </Form.Group>
                  <ButtonGroup className="mb-3">
                    <Button size="sm" variant="outline-secondary" className="btn-prop" onClick={duplicateSelected}>Duplicar</Button>
                    <Button size="sm" variant="outline-secondary" className="btn-prop" onClick={bringToFront}>Al frente</Button>
                    <Button size="sm" variant="outline-secondary" className="btn-prop" onClick={sendToBack}>Al fondo</Button>
                    <Button size="sm" variant="outline-danger" className="btn-prop" onClick={removeSelected}>Eliminar</Button>
                  </ButtonGroup>
                </>
              )}

              {selected && selected.type === 'medal' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Variante de vista previa</Form.Label>
                    <Form.Select value={(selected as MedalElement).previewVariant} onChange={e => updateMedal({ previewVariant: Number(e.target.value) as MedalVariant })}>
                      <option value={1}>1° (Oro)</option>
                      <option value={2}>2° (Plata)</option>
                      <option value={3}>3° (Bronce)</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check type="switch" id="lockAspectM" label="Bloquear proporción" checked={(selected as MedalElement).lockAspect} onChange={e => updateMedal({ lockAspect: e.target.checked })} />
                  </Form.Group>
                  <ButtonGroup className="mb-3">
                    <Button size="sm" variant="outline-secondary" className="btn-prop" onClick={duplicateSelected}>Duplicar</Button>
                    <Button size="sm" variant="outline-secondary" className="btn-prop" onClick={bringToFront}>Al frente</Button>
                    <Button size="sm" variant="outline-secondary" className="btn-prop" onClick={sendToBack}>Al fondo</Button>
                    <Button size="sm" variant="outline-danger" className="btn-prop" onClick={removeSelected}>Eliminar</Button>
                  </ButtonGroup>
                  <div className="small text-body-secondary">
                    Vista previa usa las imágenes de la pestaña <strong>Medallas</strong> (o el SVG por defecto).
                  </div>
                </>
              )}
            </Tab>

            {/* ===== Fuentes: subir, listar y eliminar ===== */}
            <Tab eventKey="fonts" title="Fuentes">
              <div className="mb-3">
                <Form.Label>Subir fuente (.woff2, .woff, .ttf, .otf)</Form.Label>
                <Form.Control
                  type="file"
                  accept=".woff2,.woff,.ttf,.otf"
                  multiple
                  onChange={(e) => { void addFontsFromFiles((e.target as HTMLInputElement).files); e.currentTarget.value=''; }}
                />
                <div className="small text-body-secondary mt-1">
                  Las fuentes se guardan en este navegador (LocalStorage) y se inyectan con <code>@font-face</code>.
                </div>
              </div>

              <h6 className="fw-semibold">Fuentes disponibles</h6>
              <Table bordered hover size="sm">
                <thead>
                  <tr>
                    <th style={{width: '40%'}}>Nombre</th>
                    <th>Formato</th>
                    <th>Archivo</th>
                    <th style={{width:'1%'}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Fuentes de sistema + Chomsky (solo referencia) */}
                  <tr>
                    <td>Sistema / Arial / Georgia / Times / Roboto</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>Chomsky (si está en /public/fonts)</td>
                    <td>woff2/woff</td>
                    <td>Chomsky.woff2 / .woff</td>
                    <td>—</td>
                  </tr>
                  {/* Fuentes personalizadas */}
                  {customFonts.length === 0 && (
                    <tr><td colSpan={4} className="text-body-secondary">Aún no has subido fuentes.</td></tr>
                  )}
                  {customFonts.map(f => (
                    <tr key={f.id}>
                      <td style={{fontFamily: `${f.family}, serif`}}>{f.family}</td>
                      <td>{f.format}</td>
                      <td className="text-truncate">{f.fileName}</td>
                      <td className="text-nowrap">
                        <Button size="sm" variant="outline-danger" onClick={()=>removeFont(f.id)}>Eliminar</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="small text-body-secondary">
                Para usar una fuente en un texto: selecciona el texto → pestaña <strong>Propiedades</strong> → <strong>Fuente</strong>.
              </div>
            </Tab>

            <Tab eventKey="designs" title="Diseños">
              <Form.Group className="mb-2">
                <Form.Label>Nombre del diseño</Form.Label>
                <Form.Control value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Escribe un nombre…" />
              </Form.Group>
              <div className="d-grid gap-2 mb-3">
                <Button variant="success" onClick={saveDesign} disabled={savingImageDesign || uploadsInProgress > 0}>{savingImageDesign ? 'Guardando...' : uploadsInProgress > 0 ? 'Esperando imágenes...' : 'Guardar Diseño'}</Button>
                <Button variant="outline-secondary" onClick={() => exportDesignJSON()}>Exportar diseño actual como JSON</Button>
                <div>
                  <Form.Label className="mb-1">Importar diseño desde JSON</Form.Label>
                  <Form.Control type="file" accept="application/json" onChange={importDesignJSON} />
                </div>
              </div>
              <hr />
              <div className="small text-body-secondary mb-2" role="status">En el diseño actual: {elements.filter(e => e.type === 'image').length} imágenes · Fondo: {backgroundUrl ? 'sí' : 'no'} · Subidas pendientes: {uploadsInProgress}. Después de añadir imágenes, pulsa Guardar Diseño.</div>
              <div className="small text-body-secondary mb-2">Diseños guardados:</div>
              {designs.length === 0 && <div className="text-body-secondary">No hay diseños guardados.</div>}
              {designs.slice().sort((a,b)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(d => (
                <div key={d.id} className="d-flex align-items-center justify-content-between border rounded px-2 py-1 mb-2">
                  <div>
                    <div className="fw-semibold">{d.name}</div>
                    <div className="small text-body-secondary">{new Date(d.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => openDesign(d.id)}>Cargar</Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => exportDesignJSON(d.id)}>Descargar</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDeleteDesign(d.id)}>Eliminar</Button>
                  </div>
                </div>
              ))}
            </Tab>

                        {/* DIPLOMA_EDITOR_LIBRARY_V4 - biblioteca y lista para rescatar elementos tapados */}
            <Tab eventKey="biblioteca" title="Biblioteca">
              <StorageLibrary
                currentReferences={[
                  backgroundUrl, watermarkImage?.url, backgroundLinkedImage?.url,
                  ...elements.filter(e => e.type === 'image').map(e => (e as ImageElement).src),
                  ...Object.values(medalImages),
                ].filter((v): v is string => typeof v === 'string' && v.length > 0)}
                onUse={(reference: string, target: LibraryTarget) => {
                  if (target === 'element') addImageFromDataUrl(reference);
                  else if (target === 'watermark') setWatermarkImage(newPaperLayer(reference, 'watermark'));
                  else if (target === 'linked') setBackgroundLinkedImage(newPaperLayer(reference, 'background'));
                  else setBackgroundUrl(reference);
                }}
              />
            </Tab>
            <Tab eventKey="elementos" title="Elementos">
              <p className="small text-body-secondary">Selecciona o elimina elementos desde la lista aunque esten tapados, bloqueados o no puedas hacer clic en el papel.</p>
              {elements.length === 0 && <p className="small">Todavia no hay elementos en el lienzo.</p>}
              {elements.slice().sort((a,b) => b.z - a.z).map(el => (
                <div key={el.id} className="d-flex justify-content-between align-items-center gap-2 border rounded p-2 mb-2">
                  <span className="small text-truncate" style={{maxWidth:130}} title={el.type === 'text' ? (el as TextElement).text : el.type}>
                    {el.type === 'text' ? 'Texto: ' + (el as TextElement).text.slice(0,24) : el.type === 'image' ? 'Imagen' : 'Medalla'}
                  </span>
                  <div className="d-flex gap-1">
                    <Button size="sm" variant="outline-primary" onClick={() => setSelectedId(el.id)}>Elegir</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => {
                      if (!window.confirm('¿Quitar este elemento del diseño? El archivo de Storage se conservara.')) return;
                      setElements(prev => prev.filter(item => item.id !== el.id));
                      setSelectedId(current => current === el.id ? null : current);
                    }}>Quitar</Button>
                  </div>
                </div>
              ))}
              <hr />
              <div className="small fw-semibold mb-2">Capas y fondos no seleccionables</div>
              {backgroundUrl && <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                <span className="small">Fondo principal</span>
                <Button size="sm" variant="outline-danger" onClick={() => setBackgroundUrl(undefined)}>Quitar del diseño</Button>
              </div>}
              {watermarkImage && <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                <span className="small">Marca de agua</span>
                <Button size="sm" variant="outline-danger" onClick={() => setWatermarkImage(null)}>Quitar del diseño</Button>
              </div>}
              {backgroundLinkedImage && <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                <span className="small">Fondo vinculado</span>
                <Button size="sm" variant="outline-danger" onClick={() => setBackgroundLinkedImage(null)}>Quitar del diseño</Button>
              </div>}
              {([1,2,3] as const).map(place => medalImages[place] && <div key={place} className="d-flex justify-content-between align-items-center mb-2 gap-2">
                <span className="small">Imagen de medalla {place}</span>
                <Button size="sm" variant="outline-danger" onClick={() => setMedalImages(prev => {const next={...prev};delete next[place];return next;})}>Quitar del diseño</Button>
              </div>)}
              <p className="small text-body-secondary">Quitar no borra el archivo de Storage. Pulsa Guardar Diseño para conservar estos cambios.</p>
            </Tab>
            <Tab eventKey="capas" title="Capas">
              <p className="small text-body-secondary">Las imagenes conservan su color. Las capas quedan detras de los textos, se ajustan al papel y se guardan con el diseno.</p>
              <Form.Group className="mb-3">
                <Form.Label>Agregar marca de agua</Form.Label>
                <Form.Control type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={layerUploading !== null} onChange={uploadBackgroundLayer('watermark')} />
                {watermarkImage && (
                  <div className="mt-2">
                    <Form.Label>Opacidad: {Math.round(watermarkImage.opacity * 100)}%</Form.Label>
                    <Form.Range min={5} max={100} value={Math.round(watermarkImage.opacity * 100)} onChange={e => setWatermarkImage({...watermarkImage, opacity:Number(e.target.value)/100})} />
                    <LayerPositionControls layer={watermarkImage} onChange={next => setWatermarkImage(next)} />
                    <Form.Select className="mb-2" aria-label="Ajuste marca de agua" value={watermarkImage.fit} onChange={e => setWatermarkImage({...watermarkImage, fit:e.target.value as DiplomaLayer['fit']})}>
                      <option value="contain">Mostrar imagen completa</option>
                      <option value="cover">Cubrir papel</option>
                    </Form.Select>
                    <Form.Check className="mb-2" label="Visible" checked={watermarkImage.visible} onChange={e => setWatermarkImage({...watermarkImage, visible:e.target.checked})} />
                    <Button size="sm" variant="outline-danger" onClick={() => setWatermarkImage(null)}>Quitar marca de agua</Button>
                  </div>
                )}
              </Form.Group>
              <hr />
              <Form.Group className="mb-3">
                <Form.Label>Agregar imagen vinculada al fondo</Form.Label>
                <Form.Control type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={layerUploading !== null} onChange={uploadBackgroundLayer('background')} />
                {backgroundLinkedImage && (
                  <div className="mt-2">
                    <Form.Label>Opacidad: {Math.round(backgroundLinkedImage.opacity * 100)}%</Form.Label>
                    <Form.Range min={5} max={100} value={Math.round(backgroundLinkedImage.opacity * 100)} onChange={e => setBackgroundLinkedImage({...backgroundLinkedImage, opacity:Number(e.target.value)/100})} />
                    <LayerPositionControls layer={backgroundLinkedImage} onChange={next => setBackgroundLinkedImage(next)} />
                    <Form.Select className="mb-2" aria-label="Ajuste de fondo vinculado" value={backgroundLinkedImage.fit} onChange={e => setBackgroundLinkedImage({...backgroundLinkedImage, fit:e.target.value as DiplomaLayer['fit']})}>
                      <option value="cover">Cubrir papel</option>
                      <option value="contain">Mostrar imagen completa</option>
                    </Form.Select>
                    <Form.Check className="mb-2" label="Visible" checked={backgroundLinkedImage.visible} onChange={e => setBackgroundLinkedImage({...backgroundLinkedImage, visible:e.target.checked})} />
                    <Button size="sm" variant="outline-danger" onClick={() => setBackgroundLinkedImage(null)}>Quitar fondo vinculado</Button>
                  </div>
                )}
              </Form.Group>
              {layerUploading && <p role="status">Subiendo imagen a Supabase Storage... No guardes el diseno hasta que finalice.</p>}
            </Tab>

{/* DINAMICO_DIPLOMA_SHAPES_V5: creador de marcos y formas */}
            <Tab eventKey="formas" title="Formas">
              <DiplomaShapesPanel shapes={pageShapes} onChange={setPageShapes}
                selectedId={selectedShapeId} onSelect={setSelectedShapeId}
                editing={editingShapes} onEditingChange={setEditingShapes}
                paperWidth={paperSizePx.w} paperHeight={paperSizePx.h} />
            </Tab>
            <Tab eventKey="guias" title="Guías">
              {/* DINAMICO_EDITABLE_AREA_V6: ajustar la zona donde se pueden insertar textos, imagenes y medallas. */}
              <div className="border rounded p-3 mb-3 bg-light">
                <div className="fw-semibold mb-1">Area editable del diploma</div>
                <div className="small text-body-secondary mb-2">Controla hasta donde puedes colocar y mover los elementos. Los marcos y fondos siguen ocupando toda la hoja.</div>
                <div className="d-flex gap-2 flex-wrap mb-3">
                  <Button size="sm" variant="outline-primary" onClick={() => applyEditableMargins({top:0,right:0,bottom:0,left:0})}>Toda la hoja (0 cm)</Button>
                  <Button size="sm" variant="outline-secondary" onClick={() => applyEditableMargins({...DEFAULT_EDITABLE_MARGINS_CM})}>Margen seguro (2 cm)</Button>
                </div>
                <Row className="g-2">
                  {([['top','Superior'],['right','Derecho'],['bottom','Inferior'],['left','Izquierdo']] as Array<[keyof EditableMarginsCm,string]>).map(([side,label]) => (
                    <Col xs={6} key={side}>
                      <Form.Label className="small mb-1">{label} (cm)</Form.Label>
                      <Form.Control size="sm" type="number" min={0} max={8} step={0.1}
                        value={editableMarginsCm[side]}
                        onChange={event => applyEditableMargins({[side]:Number(event.target.value)})}/>
                    </Col>
                  ))}
                </Row>
                <div className="small text-body-secondary mt-2">Al cambiar los margenes, conservamos la posicion de los elementos cuando es posible. Para imprimir sin recortes, deja una separacion prudente del borde.</div>
              </div>

              <Form.Check className="mb-2" type="switch" id="showRulers" label="Mostrar reglas (cm)" checked={showRulers} onChange={e => setShowRulers(e.target.checked)} />
              <Form.Check className="mb-2" type="switch" id="showGrid" label="Mostrar cuadrícula 1 cm (5 cm marcados)" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
              <Form.Check className="mb-2" type="switch" id="showMargin" label="Mostrar limite visual del area editable" checked={showMarginBox} onChange={e => setShowMarginBox(e.target.checked)} />
              <div className="small text-body-secondary mt-2">Las guías no se incluyen en la exportación PNG.</div>
            </Tab>

            <Tab eventKey="export" title="Exportar">
              <div className="d-grid gap-2 mb-2">
                <Button variant="primary" onClick={exportPNG}>Generar PNG</Button>
                <Button variant="outline-success" onClick={downloadPrintProof} disabled={exportingProof}>
                  {exportingProof ? 'Preparando PDF...' : 'Descargar PDF de prueba de impresion'}
                </Button>
                <div className="small text-body-secondary">
                  Imprime sin cargar Excel ni datos. Conserva el tamano del papel y los DPI elegidos; al imprimir selecciona escala real (100%).
                </div>
              </div>
              {pngUrl ? (
                <>
                  <StorageImage src={pngUrl} alt="Vista exportada" className="img-fluid mb-2" />
                  <div className="d-grid">
                    <a className="btn btn-outline-secondary" href={pngUrl} download={`lienzo_${format}_${orientation}_${dpi}dpi.png`}>Descargar PNG</a>
                  </div>
                </>
              ) : (
                <div className="text-body-secondary">Genera el PNG para previsualizar y descargar.</div>
              )}
              <small className="text-body-secondary d-block mt-2">
                Tamaño real: {paperSizePx.w}×{paperSizePx.h}px a 96 ppi. Exportado a {dpi} DPI.
              </small>
            </Tab>
          </Tabs>
        </div>
      </Col>

      {/* ===== Papel + Guías + Lienzo ===== */}
      <Col className="editor-canvas-col">
        <div className="editor-canvas-scroll" ref={canvasViewportRef}>
          <div className="editor-paper-stage" style={{width: paperSizePx.w * canvasScale, height: paperSizePx.h * canvasScale}}>
          <div ref={paperRef} className={paperClass} style={{
            width: paperSizePx.w,
            height: paperSizePx.h,
            transform: `scale(${canvasScale})`,
            transformOrigin: 'top left',
          }}>
            {/* Fondo a tamaño completo */}
            {backgroundUrl && <StorageImage className="paper-bg" src={backgroundUrl} alt="" />}

            {/* Guías visuales */}
            
            {/* DINAMICO_WATERMARK_PATCH_V3: capas conservan sus colores y escala del papel */}
            {backgroundLinkedImage?.visible && <StorageImage
              className="paper-bg" src={backgroundLinkedImage.url} alt="Fondo vinculado" draggable={false}
              style={paperLayerStyle(backgroundLinkedImage, 0)}
            />}
            {watermarkImage?.visible && <StorageImage
              className="paper-bg" src={watermarkImage.url} alt="Marca de agua" draggable={false}
              style={paperLayerStyle(watermarkImage, 2)}
            />}

{/* DINAMICO_DIPLOMA_SHAPES_V5: capa de formas en el PAPEL completo */}
            <DiplomaShapesLayer shapes={pageShapes} editable={editingShapes}
              selectedId={selectedShapeId} onSelect={setSelectedShapeId}
              onChange={setPageShapes} paperWidth={paperSizePx.w}
              paperHeight={paperSizePx.h} scale={canvasScale} />
            <div className="paper-guides">
              {showRulers && (<div className="ruler-top" />)}
              {showRulers && (<div className="ruler-left" />)}
              {showGrid && (<div className="paper-grid" />)}
              {showMarginBox && (<div className="margin-box" style={editableMarginsStyle(editableMarginsCm, paperSizePx.w, paperSizePx.h, CM)} />)}
              <div className="paper-size-badge">
                {format === 'custom' ? `Personalizado ${(paperInches.w * 2.54).toFixed(2)} × ${(paperInches.h * 2.54).toFixed(2)} cm` : format === 'letter'
                  ? (orientation === 'portrait' ? 'Carta 8.5×11"' : 'Carta 11×8.5"')
                  : (orientation === 'portrait' ? 'Oficio 8.5×13"' : 'Oficio 13×8.5"')}
              </div>
            </div>

            {/* Área editable configurable, incluidos los bordes del papel */}
            <div className="content">
              <div ref={safeAreaRef} className="safe-area" style={editableMarginsStyle(editableMarginsCm, paperSizePx.w, paperSizePx.h, CM)} onMouseDown={() => setSelectedId(null)}>
                {elements
                  .sort((a, b) => a.z - b.z)
                  .map(el => (
                    <Rnd
                      key={el.id}
                      bounds="parent"                   // límite = área segura
                      scale={canvasScale}
                      size={{ width: el.w, height: el.h }}
                      position={{ x: el.x, y: el.y }}
                      onDragStop={(_, d) => updateRect(el.id, d.x, d.y, el.w, el.h)}
                      onResizeStop={(_, __, ref, ___, pos) => updateRect(el.id, pos.x, pos.y, ref.offsetWidth, ref.offsetHeight)}
                      lockAspectRatio={
                        el.type === 'image' ? (el as ImageElement).lockAspect :
                        el.type === 'medal' ? (el as MedalElement).lockAspect : false
                      }
                      enableResizing={{ top:true, right:true, bottom:true, left:true, topRight:true, bottomRight:true, bottomLeft:true, topLeft:true }}
                      style={{ zIndex: el.z }}
                      className={selectedId === el.id ? 'rnd-selected' : ''}
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSelectedId(el.id); }}
                    >
                      {el.type === 'image' ? (
                        <StorageImage src={(el as ImageElement).src} alt="Imagen" style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} draggable={false} />
                      ) : el.type === 'medal' ? (
                        (() => {
                          const m = el as MedalElement;
                          const src = medalImages[m.previewVariant as 1|2|3] ?? DEFAULT_MEDAL(m.previewVariant);
                          return <StorageImage src={src} alt="Medalla" style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} draggable={false} />;
                        })()
                      ) : (
                        <div
                          className="canvas-text"
                          style={{
                            textAlign: (el as TextElement).align,
                            fontSize: (el as TextElement).fontSize,
                            color: (el as TextElement).color,
                            fontFamily: (el as TextElement).fontFamily,
                            fontWeight: (el as TextElement).bold ? '800' : '400',
                            fontStyle: (el as TextElement).italic ? 'italic' : 'normal',
                            padding: '4px',
                          }}
                        >
                          {(el as TextElement).text}
                        </div>
                      )}
                    </Rnd>
                  ))}
              </div>
            </div>
          </div>
          </div>
        </div>
      </Col>
    </Row>
  );
}

