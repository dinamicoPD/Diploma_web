'use client';
/* DINAMICO_DIPLOMA_SHAPES_V5: Formas en toda la superficie del papel. */
import { Button, Form } from 'react-bootstrap';
import { Rnd } from 'react-rnd';
import {
  type DiplomaShape, type ShapeKind, type ShapeBorder,
  type ShapeLineDirection, newShape, newFrame, duplicateShape,
  normalizeShape, setShapeBounds,
} from '@/lib/diplomaShapes';

export type { DiplomaShape } from '@/lib/diplomaShapes';

const PX_PER_CM = 96 / 2.54;
const n = (x: number) => Math.round(x * 100) / 100;

function ShapeDrawing({ shape }: { shape: DiplomaShape }) {
  if (shape.kind === 'line') {
    const line = shape.lineDirection === 'vertical'
      ? {x1: 50, y1: 0, x2: 50, y2: 100}
      : shape.lineDirection === 'diagonal'
        ? {x1: 0, y1: 0, x2: 100, y2: 100}
        : {x1: 0, y1: 50, x2: 100, y2: 50};
    return <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%"
      style={{display:'block', overflow:'visible', opacity:shape.opacity}} aria-hidden="true">
      <line {...line} stroke={shape.color} strokeWidth={shape.strokeWidth}
        vectorEffect="non-scaling-stroke" strokeLinecap="round"
        strokeDasharray={shape.borderStyle === 'dashed' ? '9 7' : shape.borderStyle === 'dotted' ? '1 7' : undefined} />
    </svg>;
  }
  return <div aria-hidden="true" style={{
    width:'100%', height:'100%', boxSizing:'border-box',
    border:`${shape.strokeWidth}px ${shape.borderStyle} ${shape.color}`,
    borderRadius:shape.kind === 'ellipse' ? '50%' : `${shape.radius}px`,
    backgroundColor:shape.fillColor || 'transparent', opacity:shape.opacity,
    pointerEvents:'none',
  }} />;
}

interface LayerProps {
  shapes: DiplomaShape[];
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onChange?: (next: DiplomaShape[]) => void;
  paperWidth?: number;
  paperHeight?: number;
  scale?: number;
}

export function DiplomaShapesLayer({
  shapes, editable = false, selectedId = null, onSelect, onChange,
  paperWidth = 0, paperHeight = 0, scale = 1,
}: LayerProps) {
  const safeShapes = Array.isArray(shapes) ? shapes.map(normalizeShape) : [];
  const changeShape = (id: string, patch: Partial<DiplomaShape>) => {
    if (!onChange) return;
    onChange(safeShapes.map(shape => shape.id === id ? normalizeShape({...shape, ...patch}) : shape));
  };
  return <>
    {/* Esta capa SIEMPRE se exporta: no depende de si el editor esta en modo formas. */}
    <div className="diploma-shapes-static" style={{
      position:'absolute', inset:0, zIndex:2, pointerEvents:'none', overflow:'hidden',
    }}>
      {safeShapes.filter(s => s.visible).map(shape => <div key={shape.id} style={{
        position:'absolute', left:`${shape.xPct}%`, top:`${shape.yPct}%`,
        width:`${shape.widthPct}%`, height:`${shape.heightPct}%`,
        pointerEvents:'none',
      }}><ShapeDrawing shape={shape} /></div>)}
    </div>
    {/* Superficie de seleccion solo durante la edicion; no sale en PNG/PDF. */}
    {editable && onChange && paperWidth > 0 && paperHeight > 0 && <div
      className="diploma-shapes-edit-overlay"
      style={{position:'absolute', inset:0, zIndex:12, pointerEvents:'auto'}}
      onMouseDown={e => { if (e.target === e.currentTarget) onSelect?.(null); }}>
      {safeShapes.filter(s => s.visible).map(shape => {
        const px = {
          x: shape.xPct * paperWidth / 100,
          y: shape.yPct * paperHeight / 100,
          width: shape.widthPct * paperWidth / 100,
          height: shape.heightPct * paperHeight / 100,
        };
        return <Rnd key={shape.id} bounds="parent" scale={scale > 0 ? scale : 1}
          position={{x:px.x,y:px.y}} size={{width:px.width,height:px.height}}
          disableDragging={shape.locked} enableResizing={!shape.locked}
          onDragStart={() => onSelect?.(shape.id)}
          onMouseDown={e => {e.stopPropagation();onSelect?.(shape.id);}}
          onDragStop={(_, d) => changeShape(shape.id, {
            xPct: d.x / paperWidth * 100, yPct: d.y / paperHeight * 100,
          })}
          onResizeStart={() => onSelect?.(shape.id)}
          onResizeStop={(_, __, ref, ___, pos) => changeShape(shape.id, {
            xPct: pos.x / paperWidth * 100, yPct: pos.y / paperHeight * 100,
            widthPct: ref.offsetWidth / paperWidth * 100,
            heightPct: ref.offsetHeight / paperHeight * 100,
          })}
          style={{boxSizing:'border-box', background:'transparent', cursor:shape.locked?'default':'move',
            outline:shape.id === selectedId ? '2px dashed #0E8596' : '1px dotted rgba(14,133,150,.55)',
          }}>
          <span style={{display:'block',width:'100%',height:'100%'}} aria-label={`Seleccionar forma ${shape.id}`} />
        </Rnd>;
      })}
    </div>}
  </>;
}

interface PanelProps {
  shapes: DiplomaShape[];
  onChange: (next: DiplomaShape[]) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  editing: boolean;
  onEditingChange: (value: boolean) => void;
  paperWidth: number;
  paperHeight: number;
}

export function DiplomaShapesPanel({
  shapes, onChange, selectedId, onSelect, editing, onEditingChange,
  paperWidth, paperHeight,
}: PanelProps) {
  const list = Array.isArray(shapes) ? shapes : [];
  const selected = list.find(s => s.id === selectedId) || null;
  const add = (type: ShapeKind | 'frame' | 'double' | 'rounded') => {
    const added = type === 'double' ? [newFrame(2.7), newFrame(4.4)]
      : type === 'frame' ? [newFrame(3)]
      : type === 'rounded' ? [newFrame(3, 28)]
      : [newShape(type)];
    onChange([...list, ...added]);
    onSelect(added[added.length - 1].id);
    onEditingChange(true);
  };
  const change = (patch: Partial<DiplomaShape>) => {
    if (!selected) return;
    onChange(list.map(s => s.id === selected.id ? normalizeShape({...s,...patch}) : s));
  };
  const moveOrder = (direction: -1 | 1) => {
    if (!selected) return;
    const index = list.findIndex(s=>s.id === selected.id);
    const newIndex = index+direction;
    if(index<0 || newIndex<0 || newIndex>=list.length) return;
    const copy=list.slice();
    [copy[index],copy[newIndex]]=[copy[newIndex],copy[index]];
    onChange(copy);
  };
  const cmFields: Array<{key:'xPct'|'yPct'|'widthPct'|'heightPct';label:string;paperPx:number}> = [
    {key:'xPct', label:'Desde la izquierda (cm)', paperPx:paperWidth},
    {key:'yPct', label:'Desde arriba (cm)', paperPx:paperHeight},
    {key:'widthPct', label:'Ancho (cm)', paperPx:paperWidth},
    {key:'heightPct', label:'Alto (cm)', paperPx:paperHeight},
  ];
  return <div className="diploma-shapes-panel">
    <p className="small text-body-secondary">Las formas ocupan todo el papel, incluidos los margenes. Se dibujan debajo de los textos e imagenes y se guardan con el diseno.</p>
    <Form.Check type="switch" id="editar-formas-papel" label="Modo editar formas en el papel"
      className="mb-3" checked={editing} onChange={e=>onEditingChange(e.target.checked)} />
    <div className="row g-2 mb-3">
      {([
        ['frame','Marco exterior'], ['double','Marco doble'],
        ['rounded','Marco redondeado'], ['rectangle','Rectangulo'],
        ['ellipse','Circulo / ovalo'], ['line','Linea decorativa'],
      ] as Array<[ShapeKind|'frame'|'double'|'rounded',string]>).map(([kind,title])=><div key={kind} className="col-6">
        <Button size="sm" variant="outline-primary" className="w-100" onClick={()=>add(kind)}>{title}</Button>
      </div>)}
    </div>
    <div className="small fw-semibold mb-2">Formas del diploma ({list.length})</div>
    {list.length === 0 && <div className="small text-body-secondary mb-2">Aun no hay formas. Agrega un marco para comenzar.</div>}
    <div style={{maxHeight:180,overflowY:'auto'}} className="mb-3">
      {list.map((shape,i)=><div className="d-flex gap-1 align-items-center mb-1" key={shape.id}>
        <Button size="sm" variant={shape.id===selectedId?'primary':'outline-secondary'}
          className="flex-grow-1 text-start text-truncate" onClick={()=>{onSelect(shape.id);onEditingChange(true);}}>
          {i+1}. {shape.kind==='rectangle'?'Rectangulo':shape.kind==='ellipse'?'Ovalo':'Linea'}{shape.locked?' (bloqueada)':''}
        </Button>
        <Button size="sm" variant="outline-danger" title="Eliminar del diseno" onClick={()=>{
          if(!window.confirm('¿Quitar esta forma del diseno?'))return;
          onChange(list.filter(s=>s.id!==shape.id));
          if(shape.id===selectedId)onSelect(null);
        }}>×</Button>
      </div>)}
    </div>
    {selected && <div className="border rounded p-2 bg-light">
      <div className="fw-semibold small mb-2">Propiedades de la forma seleccionada</div>
      <div className="row g-2">
        {cmFields.map(f=><Form.Group className="col-6" key={f.key}>
          <Form.Label className="small mb-1">{f.label}</Form.Label>
          <Form.Control size="sm" type="number" step="0.1" min="0" max={n(f.paperPx/PX_PER_CM)}
            value={n(selected[f.key] * f.paperPx /100/PX_PER_CM)}
            onChange={e=>{
              const entered=Number(e.target.value);
              if(!Number.isFinite(entered)||f.paperPx<=0)return;
              onChange(list.map(s=>s.id===selected.id?setShapeBounds(s,f.key,entered*PX_PER_CM/f.paperPx*100):s));
            }}/>
        </Form.Group>)}
        <Form.Group className="col-6">
          <Form.Label className="small mb-1">Color del borde</Form.Label>
          <Form.Control type="color" title="Color del borde" value={selected.color} onChange={e=>change({color:e.target.value})}/>
        </Form.Group>
        <Form.Group className="col-6">
          <Form.Label className="small mb-1">Grosor del borde (px)</Form.Label>
          <Form.Control size="sm" type="number" min="0.5" max="30" step="0.5" value={selected.strokeWidth}
            onChange={e=>change({strokeWidth:Number(e.target.value)})}/>
        </Form.Group>
        <Form.Group className="col-6">
          <Form.Label className="small mb-1">Estilo de borde</Form.Label>
          <Form.Select size="sm" value={selected.borderStyle} onChange={e=>change({borderStyle:e.target.value as ShapeBorder})}>
            <option value="solid">Continuo</option><option value="dashed">Guiones</option><option value="dotted">Punteado</option>
          </Form.Select>
        </Form.Group>
        {selected.kind==='rectangle' && <Form.Group className="col-6">
          <Form.Label className="small mb-1">Radio de esquina (px)</Form.Label>
          <Form.Control size="sm" type="number" min="0" max="200" step="2" value={selected.radius}
            onChange={e=>change({radius:Number(e.target.value)})}/>
        </Form.Group>}
        {selected.kind==='line' && <Form.Group className="col-6">
          <Form.Label className="small mb-1">Direccion</Form.Label>
          <Form.Select size="sm" value={selected.lineDirection} onChange={e=>change({lineDirection:e.target.value as ShapeLineDirection})}>
            <option value="horizontal">Horizontal</option><option value="vertical">Vertical</option><option value="diagonal">Diagonal</option>
          </Form.Select>
        </Form.Group>}
        {selected.kind!=='line' && <Form.Group className="col-6">
          <Form.Check type="checkbox" label="Relleno" checked={selected.fillColor!==null}
            onChange={e=>change({fillColor:e.target.checked?'#F5F0D8':null})}/>
          {selected.fillColor!==null && <Form.Control type="color" value={selected.fillColor}
            onChange={e=>change({fillColor:e.target.value})}/>}
        </Form.Group>}
      </div>
      <Form.Label className="small mb-1 mt-3">Opacidad: {Math.round(selected.opacity*100)}%</Form.Label>
      <Form.Range min={0} max={100} value={Math.round(selected.opacity*100)}
        onChange={e=>change({opacity:Number(e.target.value)/100})}/>
      <div className="d-flex gap-2 flex-wrap mb-2">
        <Form.Check label="Visible" checked={selected.visible} onChange={e=>change({visible:e.target.checked})}/>
        <Form.Check label="Bloquear" checked={selected.locked} onChange={e=>change({locked:e.target.checked})}/>
      </div>
      <div className="d-flex gap-2 flex-wrap">
        <Button size="sm" variant="outline-secondary" onClick={()=>{
          const dup=duplicateShape(selected);onChange([...list,dup]);onSelect(dup.id);
        }}>Duplicar</Button>
        <Button size="sm" variant="outline-secondary" onClick={()=>moveOrder(-1)}>Bajar capa</Button>
        <Button size="sm" variant="outline-secondary" onClick={()=>moveOrder(1)}>Subir capa</Button>
        <Button size="sm" variant="outline-secondary" onClick={()=>change({xPct:3,yPct:3,widthPct:94,heightPct:94})}>Ajustar al marco</Button>
      </div>
      <div className="small text-body-secondary mt-2">Pulsa Guardar Diseno para conservar las formas. No necesitas subirlas a Storage.</div>
    </div>}
  </div>;
}
