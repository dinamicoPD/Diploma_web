/* eslint-disable @next/next/no-img-element,@typescript-eslint/no-unused-vars */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Row, Col, Form, Button, Table, Alert, ProgressBar } from 'react-bootstrap';
import * as htmlToImage from 'html-to-image';
import * as XLSX from 'xlsx';
import { fetchDesigns, DesignData as ApiDesignData } from '@/lib/api';

/* ==== Tipos ==== */
type Format = 'letter' | 'legal';
type Orientation = 'portrait' | 'landscape';
type BaseElement = { id: string; type: 'text' | 'image' | 'medal'; x: number; y: number; w: number; h: number; z: number; };
type TextElement = BaseElement & { type: 'text'; text: string; fontSize: number; color: string; fontFamily: string; bold: boolean; italic: boolean; align: 'left'|'center'|'right'; };
type ImageElement = BaseElement & { type: 'image'; src: string; lockAspect: boolean; };
type MedalElement = BaseElement & { type: 'medal'; previewVariant: 1|2|3; lockAspect: boolean; };
type CanvasElement = TextElement | ImageElement | MedalElement;

type MedalImages = Partial<Record<1|2|3, string>>;
type DesignData = { format: Format; orientation: Orientation; dpi: 150|200|300; backgroundUrl?: string; elements: CanvasElement[]; medalImages?: MedalImages; };
type DesignSnapshot = ApiDesignData;

/* ==== Utils ==== */
const STORAGE_KEY = 'diploma_designs_v1';
const INCH = 96;
const CM = INCH / 2.54;

const svgUri = (svg: string) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
const DEFAULT_MEDAL = (n: 1|2|3) => {
  const color = n === 1 ? '#d4af37' : n === 2 ? '#C0C0C0' : '#CD7F32';
  const label = n === 1 ? '1°' : n === 2 ? '2°' : '3°';
  return svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'>
    <defs><radialGradient id='g' cx='50%' cy='40%' r='70%'>
      <stop offset='0%' stop-color='${color}'/><stop offset='100%' stop-color='${color}' stop-opacity='.9'/></radialGradient></defs>
    <circle cx='128' cy='128' r='120' fill='url(#g)'/>
    <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-size='110' font-weight='700' fill='white' font-family='Arial, Helvetica, sans-serif'>${label}</text>
  </svg>`);
};

const normalizePlace = (v: unknown): 1|2|3 => {
  const s = String(v ?? '').trim().toLowerCase();
  if (s === '1' || s.startsWith('1') || s.includes('primer')) return 1;
  if (s === '2' || s.startsWith('2') || s.includes('segundo')) return 2;
  return 3;
};
const placeToLabel = (n: 1|2|3) => (n===1?'PRIMER LUGAR':n===2?'SEGUNDO LUGAR':'TERCER LUGAR');

const toDDMMYYYY = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
const fromExcelSerial = (n: number): Date | null => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const code = (XLSX as any).SSF?.parse_date_code?.(n);
  if (!code) return null;
  return new Date(Date.UTC(code.y, (code.m || 1)-1, code.d || 1));
};
const normalizeDateValue = (v: unknown): string => {
  if (!v && v !== 0) return '';
  if (v instanceof Date && !isNaN(v.getTime())) return toDDMMYYYY(v);
  if (typeof v === 'number') { const d = fromExcelSerial(v); return d ? toDDMMYYYY(d) : String(v); }
  if (typeof v === 'string') {
    const s = v.trim();
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) { const d=new Date(parseInt(m[3].length===2?('20'+m[3]):m[3],10), parseInt(m[2],10)-1, parseInt(m[1],10)); return isNaN(d.getTime())?s:toDDMMYYYY(d); }
    const d = new Date(s); return isNaN(d.getTime())?s:toDDMMYYYY(d);
  }
  return String(v);
};
const buildCiudadDepto = (row: Record<string, unknown>): string => {
  const cd = String(row.ciudadDepartamento ?? '').trim();
  const c  = String(row.ciudad ?? '').trim();
  const d  = String(row.departamento ?? '').trim();
  if (cd) return cd;
  if (c && d) return `${c} - ${d}`;
  return c || d || '';
};

/* ==== helpers de exportación ==== */
const waitForFonts = async () => {
  if (document.fonts?.ready) { try { await document.fonts.ready; } catch {} }
};
const waitForImages = async (root: HTMLElement) => {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(imgs.map(img => {
    if ((img as HTMLImageElement).complete) return Promise.resolve();
    return new Promise<void>(resolve => {
      (img as HTMLImageElement).decode?.().then(()=>resolve()).catch(()=>resolve());
      img.addEventListener('load', ()=>resolve(), { once:true });
      img.addEventListener('error', ()=>resolve(), { once:true });
    });
  }));
};

/* ================================================================== */

export default function LotesPage() {
  // Diseños
  const [designs, setDesigns] = useState<ApiDesignData[]>([]);
  const [designsLoading, setDesignsLoading] = useState(true);
  const [designId, setDesignId] = useState<string>('');
  const selected = useMemo(() => designs.find(d => d.id === designId), [designs, designId]);
  useEffect(() => {
    const loadDesigns = async () => {
      const fetched = await fetchDesigns();
      setDesigns(fetched);
      setDesignsLoading(false);
    };
    loadDesigns();
  }, []);

  const exportDesignJSON = () => {
    if (!selected) return;
    const snap = { name: selected.name, data: selected.data };
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diseno_${selected.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Mapear campos
  const textElements = useMemo(() => {
    if (!selected || !selected.data || !selected.data.elements) return [];
    return (selected.data.elements.filter((e: CanvasElement) => e.type === 'text') as TextElement[]);
  }, [selected]);
  const [mapInstituto, setMapInstituto] = useState<string>('');
  const [mapEstudiante, setMapEstudiante] = useState<string>('');
  const [mapLugar, setMapLugar] = useState<string>('');
  const [mapGrado, setMapGrado] = useState<string>('');
  const [mapFecha, setMapFecha] = useState<string>('');
  const [mapCiudadDepto, setMapCiudadDepto] = useState<string>('');
  const [mapSede, setMapSede] = useState<string>('');
  // NUEVO: firmas
  const [mapRector, setMapRector] = useState<string>('');
  const [mapDirector, setMapDirector] = useState<string>('');

  useEffect(() => {
    setMapInstituto(''); setMapEstudiante(''); setMapLugar('');
    setMapGrado(''); setMapFecha(''); setMapCiudadDepto('');
    setMapSede(''); setMapRector(''); setMapDirector('');
  }, [designId]);

  // Excel
  type RowData = {
    instituto?: string; estudiante?: string; lugar?: string; grado?: string; fecha?: unknown;
    ciudadDepartamento?: string; ciudad?: string; departamento?: string; sede?: string;
    rector?: string; director?: string;
    [k: string]: unknown
  };
  const [rows, setRows] = useState<RowData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const onPickXlsx = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const wb = XLSX.read(reader.result, { type: 'binary', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<RowData>(ws, { defval: '' });

      const norm = (s: string) => s.toLowerCase().trim();
      const mapped = json.map(obj => {
        const keys = Object.keys(obj);
        const get1 = (needles: string[]) => {
          const k = keys.find(k0 => needles.includes(norm(k0)));
          return k ? (obj as Record<string, unknown>)[k] : '';
        };
        const instituto = get1(['instituto','colegio','institución','institucion']);
        const estudiante = get1(['estudiante','alumno','nombre']);
        const lugar = get1(['lugar','puesto','posición','posicion']);
        const grado = get1(['grado','curso']);
        const fechaRaw = get1(['fecha','fecha del evento','fecha evento']);
        const ciudadDepartamento = get1(['ciudad-departamento','ciudad_departamento','ciudad departamento','ciudad - departamento']);
        const ciudad = get1(['ciudad','municipio','localidad']);
        const departamento = get1(['departamento','provincia','estado']);
        const sede = get1(['sede','campus','sucursal']);
        // NUEVO: firmas (rector/director de grado)
        const rector = get1(['rector','rector(a)']);
        const director = get1(['director','director de grado','director(a)','docente','coordinador']);

        return {
          ...obj,
          instituto: String(instituto ?? ''), estudiante: String(estudiante ?? ''), lugar: String(lugar ?? ''),
          grado: String(grado ?? ''), fecha: fechaRaw,
          ciudadDepartamento: String(ciudadDepartamento ?? ''), ciudad: String(ciudad ?? ''), departamento: String(departamento ?? ''),
          sede: String(sede ?? ''), rector: String(rector ?? ''), director: String(director ?? ''),
        } as RowData;
      });

      setRows(mapped);
      setSelectedIndex(0);
    };
    reader.readAsBinaryString(f);
    e.currentTarget.value = '';
  };

  // Medallas (desde diseño; se pueden reemplazar aquí)
  const [medal1, setMedal1] = useState<string>(DEFAULT_MEDAL(1));
  const [medal2, setMedal2] = useState<string>(DEFAULT_MEDAL(2));
  const [medal3, setMedal3] = useState<string>(DEFAULT_MEDAL(3));
  const [medalMode, setMedalMode] = useState<'auto' | '1' | '2' | '3'>('auto');
  useEffect(() => {
    if (!selected || !selected.data) return;
    const m = (selected.data as DesignData).medalImages ?? {};
    setMedal1(m[1] ?? DEFAULT_MEDAL(1));
    setMedal2(m[2] ?? DEFAULT_MEDAL(2));
    setMedal3(m[3] ?? DEFAULT_MEDAL(3));
  }, [selected]);

  const paperRef = useRef<HTMLDivElement>(null);

  // ===== Barra de progreso (PDF) =====
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0); // 0..100

  // Sustitución para preview/export
  const substitutedElements = useMemo(() => {
    if (!selected || !selected.data || !selected.data.elements) return [];
    const r = rows[selectedIndex] || {};
    const place = medalMode === 'auto' ? normalizePlace(r.lugar) : (Number(medalMode) as 1|2|3);
    const placeLabel = placeToLabel(place);
    const fechaFmt = normalizeDateValue(r.fecha);
    const ciudadDepto = buildCiudadDepto(r);
    const sede = String(r.sede ?? '');

    // Clamp elements to safe area
    const inches = selected.data.format === 'letter'
      ? (selected.data.orientation === 'portrait' ? { w: 8.5, h: 11 } : { w: 11, h: 8.5 })
      : (selected.data.orientation === 'portrait' ? { w: 8.5, h: 13 } : { w: 13, h: 8.5 });
    const widthPx = Math.round(inches.w * INCH);
    const heightPx = Math.round(inches.h * INCH);
    const safeW = widthPx - 4 * CM;
    const safeH = heightPx - 4 * CM;
    const clampedElements = (selected.data.elements as CanvasElement[]).map(e => {
      let { x, y, w, h } = e;
      if (w > safeW) w = safeW;
      if (h > safeH) h = safeH;
      if (x < 0) x = 0;
      if (y < 0) y = 0;
      if (x + w > safeW) x = Math.max(0, safeW - w);
      if (y + h > safeH) y = Math.max(0, safeH - h);
      return { ...e, x, y, w, h };
    });

    return clampedElements.map(el => {
      if (el.type === 'text') {
        const t = el as TextElement;
        if (t.id === mapInstituto)   return { ...t, text: String(r.instituto ?? '').toUpperCase() };
        if (t.id === mapEstudiante)  return { ...t, text: String(r.estudiante ?? '') };
        if (t.id === mapLugar)       return { ...t, text: placeLabel };
        if (t.id === mapGrado)       return { ...t, text: String(r.grado ?? '') };
        if (t.id === mapFecha)       return { ...t, text: fechaFmt };
        if (t.id === mapCiudadDepto) return { ...t, text: ciudadDepto };
        if (t.id === mapSede)        return { ...t, text: sede };
        // NUEVO: firmas
        if (t.id === mapRector)      return { ...t, text: String(r.rector ?? 'Rector(a)') };
        if (t.id === mapDirector)    return { ...t, text: String(r.director ?? 'Director de grado') };
        return t;
      }
      if (el.type === 'medal') {
        return { ...(el as MedalElement), previewVariant: place } as MedalElement;
      }
      return el;
    }) as CanvasElement[];
  }, [
    selected, rows, selectedIndex,
    mapInstituto, mapEstudiante, mapLugar, mapGrado, mapFecha, mapCiudadDepto, mapSede,
    mapRector, mapDirector, medalMode
  ]);

  // Export PNG (fila actual)
  const exportRowPNG = async () => {
    if (!selected || !selected.data || !paperRef.current) return;
    const { format, orientation, dpi } = selected.data;
    const inches = format === 'letter'
      ? (orientation === 'portrait' ? { w: 8.5, h: 11 } : { w: 11, h: 8.5 })
      : (orientation === 'portrait' ? { w: 8.5, h: 13 } : { w: 13, h: 8.5 });
    const widthPx  = Math.round(inches.w * INCH);
    const heightPx = Math.round(inches.h * INCH);
    paperRef.current.setAttribute('data-exporting', 'true');
    await waitForFonts();
    await waitForImages(paperRef.current);
    const data = await htmlToImage.toPng(paperRef.current!, {
      width: widthPx, height: heightPx, pixelRatio: (selected.data.dpi ?? 300)/96,
      backgroundColor:'#ffffff', cacheBust:true,
      style:{transform:'none',width:`${widthPx}px`,height:`${heightPx}px`,margin:'0',padding:'0',boxShadow:'none'},
      filter: (el) => !(el instanceof HTMLElement && (el.classList.contains('paper-guides') || el.classList.contains('paper-size-badge'))),
    });
    paperRef.current.removeAttribute('data-exporting');
    const name = rows[selectedIndex]?.estudiante ? String(rows[selectedIndex].estudiante).replace(/[^\w\- ]+/g,'') : 'diploma';
    const a = document.createElement('a'); a.href = data; a.download = `${name}.png`; a.click();
  };

  // Export TODO a un PDF (con progreso)
  const exportAllToPDF = async () => {
    if (!selected || !selected.data || !paperRef.current || rows.length === 0) return;

    setExporting(true);
    setExportProgress(0);

    try {
      const { jsPDF } = await import('jspdf');
      const { format, orientation, dpi } = selected.data;
      const inches = format === 'letter'
        ? (orientation === 'portrait' ? { w: 8.5, h: 11 } : { w: 11, h: 8.5 })
        : (orientation === 'portrait' ? { w: 8.5, h: 13 } : { w: 13, h: 8.5 });
      const pageWpt = inches.w * 72;
      const pageHpt = inches.h * 72;
      const pdf = new jsPDF({ orientation: orientation === 'landscape' ? 'landscape' : 'portrait', unit:'pt', format:[pageWpt,pageHpt], compress:true });

      const widthPx  = Math.round(inches.w * INCH);
      const heightPx = Math.round(inches.h * INCH);
      const pxRatio  = (dpi ?? 300)/96;

      for (let i=0;i<rows.length;i++){
        setSelectedIndex(i);
        setExportProgress(Math.round((i / rows.length) * 100));

        // Deja que React pinte el registro seleccionado
        await new Promise<void>(r => requestAnimationFrame(()=>requestAnimationFrame(()=>r())));

        // Espera fuentes e imágenes del papel real
        if (!paperRef.current) break;
        paperRef.current.setAttribute('data-exporting', 'true');
        await waitForFonts();
        await waitForImages(paperRef.current);

        const dataUrl = await htmlToImage.toPng(paperRef.current, {
          width:widthPx, height:heightPx, pixelRatio:pxRatio, backgroundColor:'#ffffff', cacheBust:true,
          style:{transform:'none',width:`${widthPx}px`,height:`${heightPx}px`,margin:'0',padding:'0',boxShadow:'none'},
          filter: (el) => !(el instanceof HTMLElement && (el.classList.contains('paper-guides') || el.classList.contains('paper-size-badge'))),
        });

        paperRef.current.removeAttribute('data-exporting');

        if (i>0) pdf.addPage([pageWpt,pageHpt], orientation === 'landscape' ? 'landscape' : 'portrait');
        pdf.addImage(dataUrl,'PNG',0,0,pageWpt,pageHpt);

        setExportProgress(Math.round(((i+1) / rows.length) * 100));
        await new Promise<void>(r => setTimeout(r, 0));
      }

      pdf.save(`diplomas_${rows.length}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  const paperClass = useMemo(() => {
    if (!selected || !selected.data) return 'paper letter-portrait';
    const { format, orientation } = selected.data;
    return 'paper ' + (format === 'letter'
      ? (orientation === 'portrait' ? 'letter-portrait' : 'letter-landscape')
      : (orientation === 'portrait' ? 'legal-portrait'  : 'legal-landscape'));
  }, [selected]);

  return (
    <div className="py-4 page-content">
      <h1 className="h4 fw-bold mb-3">Lotes: diseños + Excel + medallas</h1>

      <Row className="g-4">
        {/* Panel izquierdo */}
        <Col lg={4}>
          <Form.Group className="mb-3">
            <Form.Label>Diseño guardado</Form.Label>
            <Form.Select value={designId} onChange={e => setDesignId(e.target.value)} disabled={exporting}>
              <option value="">— Selecciona —</option>
              {designs.slice().sort((a,b)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(d => (
                <option key={d.id} value={d.id}>{d.name} ({new Date(d.createdAt).toLocaleString()})</option>
              ))}
            </Form.Select>
          </Form.Group>

          <div className="d-flex gap-2 mb-3">
            <Button variant="outline-secondary" onClick={exportDesignJSON} disabled={!selected || exporting}>Descargar diseño como JSON</Button>
          </div>

          <fieldset className="mb-3" disabled={!selected || exporting}>
            <legend className="fs-6">Vincular campos → elementos</legend>
            {[
              {label:'Instituto', v:mapInstituto, set:setMapInstituto},
              {label:'Estudiante', v:mapEstudiante, set:setMapEstudiante},
              {label:'Lugar', v:mapLugar, set:setMapLugar},
              {label:'Grado', v:mapGrado, set:setMapGrado},
              {label:'Fecha', v:mapFecha, set:setMapFecha},
              {label:'Ciudad – Departamento', v:mapCiudadDepto, set:setMapCiudadDepto},
              {label:'Sede', v:mapSede, set:setMapSede},
              // NUEVO: firmas
              {label:'Rector(a)', v:mapRector, set:setMapRector},
              {label:'Director de grado', v:mapDirector, set:setMapDirector},
            ].map(({label,v,set})=>(
              <Form.Group className="mb-2" key={label}>
                <Form.Label>{label}</Form.Label>
                <Form.Select value={v} onChange={e => set(e.target.value)}>
                  <option value="">— Elegir elemento de texto —</option>
                  {textElements.map(t => <option key={t.id} value={t.id}>{t.text.slice(0,50) || '(vacío)'} · {Math.round(t.fontSize)}px</option>)}
                </Form.Select>
              </Form.Group>
            ))}
          </fieldset>

          <Form.Group className="mb-3">
            <div className="d-flex justify-content-between align-items-end gap-2">
              <div className="flex-grow-1">
                <Form.Label>Archivo Excel (.xlsx)</Form.Label>
                <Form.Control type="file" accept=".xlsx" onChange={onPickXlsx} disabled={!selected || exporting}/>
              </div>
              <div className="pb-1">
                <Button
                  variant="outline-secondary"
                  onClick={()=>{
                    const wb = XLSX.utils.book_new();
                    const sample = [
                      { instituto:'INSTITUTO EJEMPLO', estudiante:'Ana Pérez', lugar:'1', grado:'11°', fecha:'15/11/2025', 'ciudad-departamento':'Bogotá - Cundinamarca', sede:'Sede Norte', rector:'Dr. Carlos López', director:'Mtra. Julia Díaz' },
                      { instituto:'INSTITUTO EJEMPLO', estudiante:'Luis Díaz', lugar:'2', grado:'11°', fecha:'15/11/2025', 'ciudad-departamento':'Medellín - Antioquia', sede:'Sede Centro', rector:'Dr. Carlos López', director:'Mtra. Julia Díaz' },
                      { instituto:'INSTITUTO EJEMPLO', estudiante:'Sara Gómez', lugar:'3', grado:'11°', fecha:'15/11/2025', 'ciudad-departamento':'Cali - Valle del Cauca', sede:'Sede Sur', rector:'Dr. Carlos López', director:'Mtra. Julia Díaz' },
                    ];
                    const ws = XLSX.utils.json_to_sheet(sample, { skipHeader:false });
                    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
                    XLSX.writeFile(wb, 'plantilla_diplomas.xlsx');
                  }}
                  disabled={exporting}
                >
                  Descargar plantilla
                </Button>
              </div>
            </div>
            <div className="small text-body-secondary mt-1">
              Columnas: <code>instituto</code>, <code>estudiante</code>, <code>lugar</code>, <code>grado</code>, <code>fecha</code>,
              <code> ciudad-departamento</code> (o <code>ciudad</code>/<code>departamento</code>), <code>sede</code>, <code>rector</code>, <code>director</code>.
            </div>
          </Form.Group>

          {rows.length > 0 && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="small text-body-secondary">Registros: {rows.length}</div>
                <div className="d-flex gap-2">
                  <Button size="sm" variant="outline-secondary" disabled={selectedIndex<=0 || exporting} onClick={()=>setSelectedIndex(i=>i-1)}>Anterior</Button>
                  <Button size="sm" variant="outline-secondary" disabled={selectedIndex>=rows.length-1 || exporting} onClick={()=>setSelectedIndex(i=>i+1)}>Siguiente</Button>
                </div>
              </div>
              <div style={{maxHeight:260, overflow:'auto'}} className="mb-3 table-responsive">
                <Table striped size="sm" hover>
                  <thead>
                    <tr>
                      <th>#</th><th>Instituto</th><th>Estudiante</th><th>Lugar</th><th>Grado</th><th>Fecha</th><th>Ciudad–Depto</th><th>Sede</th><th>Rector</th><th>Director</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx)=>{
                      const fechaFmt = normalizeDateValue(r.fecha);
                      const ciudadDepto = buildCiudadDepto(r);
                      return (
                        <tr key={idx} onClick={()=>!exporting && setSelectedIndex(idx)} style={{cursor: exporting?'default':'pointer'}} className={idx===selectedIndex?'table-primary':''}>
                          <td>{idx+1}</td><td>{r.instituto}</td><td>{r.estudiante}</td>
                          <td>{normalizePlace(r.lugar)} ({String(r.lugar)})</td><td>{r.grado}</td>
                          <td>{fechaFmt}</td><td>{ciudadDepto}</td><td>{r.sede}</td><td>{r.rector}</td><td>{r.director}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </>
          )}

          <div className="d-grid gap-2">
            <Button variant="primary" onClick={exportRowPNG} disabled={!selected || rows.length===0 || exporting}>Exportar PNG del diploma actual</Button>
            <Button variant="success" onClick={exportAllToPDF} disabled={!selected || rows.length===0 || exporting}>
              {exporting ? 'Generando PDF…' : 'Exportar todos los diplomas a un PDF'}
            </Button>
          </div>

          {/* Barra de progreso */}
          {exporting && (
            <div className="mt-3">
              <div className="d-flex justify-content-between mb-1 small">
                <span>Progreso</span>
                <span>{exportProgress}%</span>
              </div>
              <ProgressBar now={exportProgress} animated striped />
              <div className="small text-body-secondary mt-1">
                No cierres esta pestaña hasta que termine la descarga del PDF.
              </div>
            </div>
          )}

          {!selected && (
            <Alert variant="secondary" className="mt-3">
              Elige un <strong>diseño</strong>, vincula los <strong>campos</strong> y carga un <strong>.xlsx</strong>.
            </Alert>
          )}
        </Col>

        {/* Vista previa */}
        <Col lg={8} className="lotes-preview-col">
          {selected && selected.data ? (
            <div ref={paperRef} className={paperClass}>
              {selected.data.backgroundUrl && <img className="paper-bg" src={selected.data.backgroundUrl} alt="" />}

              <div className="content">
                {/* Mantén márgenes de 2 cm */}
                <div className="safe-area">
                  {substitutedElements.slice().sort((a,b)=>a.z-b.z).map(el => {
                    const styleCommon: React.CSSProperties = { position:'absolute', left: el.x, top: el.y, width: el.w, height: el.h, zIndex: el.z };
                    if (el.type === 'image') {
                      return <div key={el.id} style={styleCommon}><img src={(el as ImageElement).src} alt="" style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}/></div>;
                    }
                    if (el.type === 'medal') {
                      const place = (el as MedalElement).previewVariant as 1|2|3;
                      const src = place === 1 ? medal1 : place === 2 ? medal2 : medal3;
                      return <div key={el.id} style={styleCommon}><img src={src} alt={`Medalla ${place}`} style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}/></div>;
                    }
                    const t = el as TextElement;
                    return (
                      <div key={el.id} style={styleCommon}>
                        <div style={{
                          width:'100%',height:'100%',display:'flex',alignItems:'center',
                          justifyContent: t.align==='left'?'flex-start':t.align==='right'?'flex-end':'center',
                          textAlign: t.align, fontSize: t.fontSize, color: t.color, fontFamily: t.fontFamily,
                          fontWeight:t.bold?800:400,fontStyle:t.italic?'italic':'normal',padding:4
                        }}>
                          {t.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <Alert variant="light">Selecciona un diseño para ver la previsualización.</Alert>
          )}
        </Col>
      </Row>
    </div>
  );
}

