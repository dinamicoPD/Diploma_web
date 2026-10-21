'use client';
// DIPLOMA_EDITOR_LIBRARY_V4
import { Button, Form } from 'react-bootstrap';
import { centerLayer, changeLayerBounds, normalizeLayerBounds, type LayerField, type PaperLayer } from '@/lib/layerGeometry';

type Props = { layer: PaperLayer; onChange: (next: PaperLayer) => void };
const FIELDS: {key: LayerField; label: string}[] = [
  {key:'xPct',label:'Izquierda (X)'}, {key:'yPct',label:'Arriba (Y)'},
  {key:'widthPct',label:'Ancho'}, {key:'heightPct',label:'Alto'},
];

export default function LayerPositionControls({ layer, onChange }: Props) {
  const bounds = normalizeLayerBounds(layer);
  return <div className="border rounded p-2 mb-2 bg-light">
    <div className="small fw-semibold mb-2">Tamano y ubicacion sobre el papel</div>
    <div className="row g-2">
      {FIELDS.map(field => <div className="col-6" key={field.key}>
        <Form.Group>
          <Form.Label className="small mb-1">{field.label} (%)</Form.Label>
          <Form.Control type="number" size="sm" min={field.key==='widthPct'||field.key==='heightPct'?5:0}
            max={100} step="1" value={Math.round(bounds[field.key])}
            onChange={e => onChange(changeLayerBounds(layer, field.key, Number(e.target.value)))} />
        </Form.Group>
      </div>)}
    </div>
    <div className="d-flex flex-wrap gap-2 mt-2">
      <Button size="sm" variant="outline-secondary" onClick={() => onChange(centerLayer(layer))}>Centrar</Button>
      <Button size="sm" variant="outline-secondary" onClick={() => onChange({ ...layer, xPct:0,yPct:0,widthPct:100,heightPct:100 })}>Hoja completa</Button>
      <Button size="sm" variant="outline-secondary" onClick={() => onChange({ ...layer, xPct:25,yPct:25,widthPct:50,heightPct:50 })}>Mitad centrada</Button>
    </div>
    <div className="small text-body-secondary mt-2">Los porcentajes se calculan sobre el tamano real del papel; el zoom no modifica el diseno. La imagen conserva sus colores y proporcion con el modo «Mostrar imagen completa».</div>
  </div>;
}
