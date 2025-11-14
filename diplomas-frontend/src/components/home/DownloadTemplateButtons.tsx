'use client';

import * as XLSX from 'xlsx';

export default function DownloadTemplateButtons() {
  /** Plantilla para FESTIVALES (con columna "lugar" = 1/2/3) */
  const downloadFestival = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      {
        instituto: 'INSTITUCIÓN EDUCATIVA SILVINO RODRÍGUEZ',
        estudiante: 'Emmy Yalena Cañón Ibáñez',
        lugar: '1', // 1 = PRIMER LUGAR, 2 = SEGUNDO LUGAR, 3 = TERCER LUGAR
        grado: '6°',
        fecha: '21/10/2025',
        'ciudad-departamento': 'Tunja - Boyacá',
        sede: 'Principal',
        rector: 'Dr. Carlos López',
        director: 'Mtra. Julia Díaz',
      },
      {
        instituto: 'INSTITUCIÓN EDUCATIVA SILVINO RODRÍGUEZ',
        estudiante: 'Juan Pérez',
        lugar: '2',
        grado: '6°',
        fecha: '21/10/2025',
        'ciudad-departamento': 'Tunja - Boyacá',
        sede: 'Principal',
        rector: 'Dr. Carlos López',
        director: 'Mtra. Julia Díaz',
      },
      {
        instituto: 'INSTITUCIÓN EDUCATIVA SILVINO RODRÍGUEZ',
        estudiante: 'María Gómez',
        lugar: '3',
        grado: '6°',
        fecha: '21/10/2025',
        'ciudad-departamento': 'Tunja - Boyacá',
        sede: 'Principal',
        rector: 'Dr. Carlos López',
        director: 'Mtra. Julia Díaz',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
    XLSX.utils.book_append_sheet(wb, ws, 'Festivales');
    XLSX.writeFile(wb, 'plantilla_festival.xlsx');
  };

  /** Plantilla para DIPLOMAS DE GRADO (sin columna "lugar") */
  const downloadGrado = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      {
        instituto: 'INSTITUCIÓN EDUCATIVA SILVINO RODRÍGUEZ',
        estudiante: 'Jorge Yesid Vargas Rodríguez',
        grado: '11°',
        fecha: '20/11/2025',
        'ciudad-departamento': 'Tunja - Boyacá',
        sede: 'Principal',
        rector: 'Dr. Carlos López',
        director: 'Mtra. Julia Díaz',
      },
      {
        instituto: 'INSTITUCIÓN EDUCATIVA SILVINO RODRÍGUEZ',
        estudiante: 'Luisa Fernanda Díaz',
        grado: '11°',
        fecha: '20/11/2025',
        'ciudad-departamento': 'Tunja - Boyacá',
        sede: 'Principal',
        rector: 'Dr. Carlos López',
        director: 'Mtra. Julia Díaz',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
    XLSX.utils.book_append_sheet(wb, ws, 'Grado');
    XLSX.writeFile(wb, 'plantilla_grado.xlsx');
  };

  return (
    <div className="d-flex gap-2 flex-wrap">
      <button type="button" onClick={downloadFestival} className="btn btn-outline-brand">
        Descargar plantilla Festival.xlsx
      </button>
      <button type="button" onClick={downloadGrado} className="btn btn-outline-brand">
        Descargar plantilla Grado.xlsx
      </button>
    </div>
  );
}
