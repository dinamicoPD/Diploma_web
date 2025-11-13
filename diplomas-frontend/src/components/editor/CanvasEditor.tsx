// src/components/editor/CanvasEditor.tsx
/* eslint-disable @next/next/no-img-element */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ButtonGroup, Col, Form, Row, Tabs, Tab, Table } from 'react-bootstrap';
import { Rnd } from 'react-rnd';
import * as htmlToImage from 'html-to-image';
import { fetchFonts, createFont, deleteFont, fetchDesigns, createDesign, updateDesign, deleteDesign, importDesigns, saveImage, FontData as ApiFontData, DesignData as ApiDesignData } from '@/lib/api';

/* ===== Tipos ===== */
type Format = 'letter' | 'legal';
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

type DesignData = {
  format: Format;
  orientation: Orientation;
  dpi: 150|200|300;
  backgroundUrl?: string;
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
const injectFontFace = (font: ApiFontData) => {
  // Evita inyectar dos veces
  const tagId = `font-${font.id}`;
  if (document.getElementById(tagId)) return;
  const style = document.createElement('style');
  style.id = tagId;
  style.textContent = `
@font-face{
  font-family: "${font.family}";
  src: url("${font.dataUrl}") format("${font.format}");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}`;
  document.head.appendChild(style);
};
const removeInjectedFont = (id: string) => {
  const el = document.getElementById(`font-${id}`);
  if (el && el.parentNode) el.parentNode.removeChild(el);
};

/* ================================================================================== */

export default function CanvasEditor({ initialFormat = 'letter' as Format }) {
  /* ===== Tamaño, orientación y exportación ===== */
  const [format, setFormat] = useState<Format>(initialFormat);
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [dpi, setDpi] = useState<150 | 200 | 300>(300);
  const [backgroundUrl, setBackgroundUrl] = useState<string | undefined>();

  const paperClass =
    'paper ' +
    (format === 'letter'
      ? orientation === 'portrait' ? 'letter-portrait' : 'letter-landscape'
      : orientation === 'portrait' ? 'legal-portrait'  : 'legal-landscape');

  const paperRef = useRef<HTMLDivElement>(null);
  const safeAreaRef = useRef<HTMLDivElement>(null); // límite = margen 2 cm

  const paperInches = useMemo(() => {
    if (format === 'letter') return orientation === 'portrait' ? { w: 8.5, h: 11 } : { w: 11, h: 8.5 };
    return orientation === 'portrait' ? { w: 8.5, h: 13 } : { w: 13, h: 8.5 };
  }, [format, orientation]);

  const paperSizePx = useMemo(() => ({ w: Math.round(paperInches.w * INCH), h: Math.round(paperInches.h * INCH) }), [paperInches]);

  const [pngUrl, setPngUrl] = useState<string | undefined>();

  const exportPNG = async () => {
    if (!paperRef.current) return;
    const node = paperRef.current;
    const widthPx  = Math.round(paperInches.w * INCH);
    const heightPx = Math.round(paperInches.h * INCH);
    const pixelRatio = dpi / 96;

    try {
      node.setAttribute('data-exporting', 'true');
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
          cacheBust: true,
          style: { transform: 'none', width: `${widthPx}px`, height: `${heightPx}px`, margin:'0', padding:'0', boxShadow:'none' },
        });
        setPngUrl(data);
      } catch (error) {
        alert('Error al generar PNG. Intenta recargar la página.');
      } finally {
        console.error = originalConsoleError; // Restore console.error
      }
    } catch (error) {
      console.error('Error exporting PNG:', error);
      alert('Error al exportar PNG. Intenta recargar la página.');
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

  const onPickImageElement = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = async () => {
      const dataUrl = String(r.result);
      const filename = `image_${Date.now()}_${f.name}`;
      await saveImage(dataUrl, filename);
      addImageFromDataUrl(dataUrl);
    }; r.readAsDataURL(f);
  };
  const onPickBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = async () => {
      const dataUrl = String(r.result);
      const filename = `background_${Date.now()}_${f.name}`;
      await saveImage(dataUrl, filename);
      setBackgroundUrl(dataUrl);
    }; r.readAsDataURL(f);
  };

  /* ====== Límite: que nada salga del área segura ====== */
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
  }, [format, orientation, dpi, backgroundUrl, elements, showRulers, showGrid, showMarginBox]);

  /* Re-clamp al cambiar tamaño/orientación */
  useEffect(() => {
    const sa = safeAreaRef.current;
    if (!sa) return;
    setElements(prev => prev.map(e => {
      const c = clampToSafe({ x: e.x, y: e.y, w: e.w, h: e.h });
      return (c.x!==e.x || c.y!==e.y || c.w!==e.w || c.h!==e.h) ? { ...e, ...c } : e;
    }));
  }, [format, orientation]);

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
    format, orientation, dpi, backgroundUrl, elements,
    medalImages, // ⬅️ incluir en el diseño
  });

  const saveDesign = async () => {
    try {
      const data = currentData();
      const existing = designs.find(d => d.name.trim().toLowerCase() === saveName.trim().toLowerCase());
      if (existing) {
        await updateDesign(existing.id, { name: saveName, data });
      } else {
        await createDesign({ name: saveName || `Guardar Diseño ${Date.now()}`, data, medalImages: data.medalImages });
      }
      await refreshDesigns();
    } catch (error) {
      console.error('Error saving design:', error);
      alert('Error al guardar el diseño.');
    }
  };

  const openDesign = (id: string) => {
    const d = designs.find(x => x.id === id); if (!d || !d.data || !d.data.elements) return;
    setFormat(d.data.format); setOrientation(d.data.orientation); setDpi(d.data.dpi);
    setBackgroundUrl(d.data.backgroundUrl);
    setMedalImages(d.data.medalImages ?? {}); // ⬅️ cargar medallas
    // clamp al cargar
    const inches = d.data.format === 'letter'
      ? (d.data.orientation === 'portrait' ? { w: 8.5, h: 11 } : { w: 11, h: 8.5 })
      : (d.data.orientation === 'portrait' ? { w: 8.5, h: 13 } : { w: 13, h: 8.5 });
    const widthPx = Math.round(inches.w * INCH);
    const heightPx = Math.round(inches.h * INCH);
    const safeW = widthPx - 4 * CM;
    const safeH = heightPx - 4 * CM;
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
        setBackgroundUrl(data.backgroundUrl);
        setMedalImages(data.medalImages ?? {}); // ⬅️ importar medallas
        const inches = data.format === 'letter'
          ? (data.orientation === 'portrait' ? { w: 8.5, h: 11 } : { w: 11, h: 8.5 })
          : (data.orientation === 'portrait' ? { w: 8.5, h: 13 } : { w: 13, h: 8.5 });
        const widthPx = Math.round(inches.w * INCH);
        const heightPx = Math.round(inches.h * INCH);
        const safeW = widthPx - 4 * CM;
        const safeH = heightPx - 4 * CM;
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
      setCustomFonts(fonts);
      fonts.forEach(injectFontFace);
      setFontsLoading(false);
    };
    loadFonts();
  }, []);

  const addFontsFromFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const list = Array.from(files);
    for (const f of list) {
      const fmt = guessFormat(f.name);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(`data:${mimeFor(fmt)};base64,${btoa(String.fromCharCode(...new Uint8Array(r.result as ArrayBuffer)))}`);
        r.onerror = () => reject(r.error);
        r.readAsArrayBuffer(f);
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
  const onPickMedal = (place: 1|2|3) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = async () => {
      const dataUrl = String(r.result);
      const filename = `medal_${place}_${Date.now()}_${f.name}`;
      await saveImage(dataUrl, filename);
      setMedalImages(prev => ({ ...prev, [place]: dataUrl }));
    };
    r.readAsDataURL(f);
    e.currentTarget.value = '';
  };
  const clearMedal = (place: 1|2|3) =>
    setMedalImages(prev => {
      const copy = { ...prev };
      delete copy[place];
      return copy;
    });

  /* ===== Render ===== */
  return (
    // ⬇️ No tocamos el papel; solo el layout de columnas
    <Row className="g-4 flex-nowrap">
      {/* ===== Panel (más ancho) ===== */}
      <Col xs="auto" className="editor-panel-col">
        <div className="sticky-panel wide">
          <h1 className="h5 fw-bold mb-3">Lienzo con guías</h1>

          <Row>
            <Col xs={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tamaño</Form.Label>
                <Form.Select value={format} onChange={e => setFormat(e.target.value as Format)}>
                  {orientation === 'portrait' ? (
                    <>
                      <option value="letter">Carta (8.5×11&quot;)</option>
                      <option value="legal">Oficio (8.5×13&quot;)</option>
                    </>
                  ) : (
                    <>
                      <option value="letter">Carta (11×8.5&quot;)</option>
                      <option value="legal">Oficio (13×8.5&quot;)</option>
                    </>
                  )}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group className="mb-3">
                <Form.Label>Orientación</Form.Label>
                <Form.Select value={orientation} onChange={e => setOrientation(e.target.value as Orientation)}>
                  <option value="portrait">Vertical</option>
                  <option value="landscape">Horizontal</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

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
                      <img
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
                <Button variant="success" onClick={saveDesign}>Guardar Diseño</Button>
                <Button variant="outline-secondary" onClick={() => exportDesignJSON()}>Exportar diseño actual como JSON</Button>
                <div>
                  <Form.Label className="mb-1">Importar diseño desde JSON</Form.Label>
                  <Form.Control type="file" accept="application/json" onChange={importDesignJSON} />
                </div>
              </div>
              <hr />
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

            <Tab eventKey="guias" title="Guías">
              <Form.Check className="mb-2" type="switch" id="showRulers" label="Mostrar reglas (cm)" checked={showRulers} onChange={e => setShowRulers(e.target.checked)} />
              <Form.Check className="mb-2" type="switch" id="showGrid" label="Mostrar cuadrícula 1 cm (5 cm marcados)" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
              <Form.Check className="mb-2" type="switch" id="showMargin" label="Mostrar margen seguro 2 cm" checked={showMarginBox} onChange={e => setShowMarginBox(e.target.checked)} />
              <div className="small text-body-secondary mt-2">Las guías no se incluyen en la exportación PNG.</div>
            </Tab>

            <Tab eventKey="export" title="Exportar">
              <div className="d-grid gap-2 mb-2">
                <Button variant="primary" onClick={exportPNG}>Generar PNG</Button>
              </div>
              {pngUrl ? (
                <>
                  <img src={pngUrl} alt="Vista exportada" className="img-fluid mb-2" />
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
        <div className="editor-canvas-scroll">
          <div ref={paperRef} className={paperClass}>
            {/* Fondo a tamaño completo */}
            {backgroundUrl && <img className="paper-bg" src={backgroundUrl} alt="" />}

            {/* Guías visuales */}
            <div className="paper-guides">
              {showRulers && (<div className="ruler-top" />)}
              {showRulers && (<div className="ruler-left" />)}
              {showGrid && (<div className="paper-grid" />)}
              {showMarginBox && (<div className="margin-box" />)}
              <div className="paper-size-badge">
                {format === 'letter'
                  ? (orientation === 'portrait' ? 'Carta 8.5×11"' : 'Carta 11×8.5"')
                  : (orientation === 'portrait' ? 'Oficio 8.5×13"' : 'Oficio 13×8.5"')}
              </div>
            </div>

            {/* Área editable = SOLO dentro del margen: .safe-area */}
            <div className="content">
              <div ref={safeAreaRef} className="safe-area" onMouseDown={() => setSelectedId(null)}>
                {elements
                  .sort((a, b) => a.z - b.z)
                  .map(el => (
                    <Rnd
                      key={el.id}
                      bounds="parent"                   // límite = área segura
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
                        <img src={(el as ImageElement).src} alt="Imagen" style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} draggable={false} />
                      ) : el.type === 'medal' ? (
                        (() => {
                          const m = el as MedalElement;
                          const src = medalImages[m.previewVariant as 1|2|3] ?? DEFAULT_MEDAL(m.previewVariant);
                          return <img src={src} alt="Medalla" style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} draggable={false} />;
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
      </Col>
    </Row>
  );
}

