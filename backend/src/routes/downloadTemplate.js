const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');

// Plantilla para FESTIVALES (con columna "lugar" = 1/2/3)
const downloadFestival = () => {
  const wb = XLSX.utils.book_new();
  const rows = [
    {
      instituto: 'INSTITUCIÓN EDUCATIVA SILVINO RODRÍGUEZ',
      estudiante: 'Emmy Yalena Cañón Ibáñez',
      lugar: '1',
      grado: '6°',
      fecha: '21/10/2025',
      'ciudad-departamento': 'Tunja - Boyacá',
      sede: 'Principal',
      rector: 'Dr. Juan Carlos Pérez',
      'director-de-area': 'Lic. María González'
    },
    {
      instituto: 'INSTITUCIÓN EDUCATIVA SILVINO RODRÍGUEZ',
      estudiante: 'Carlos Andrés López',
      lugar: '2',
      grado: '6°',
      fecha: '21/10/2025',
      'ciudad-departamento': 'Tunja - Boyacá',
      sede: 'Principal',
      rector: 'Dr. Juan Carlos Pérez',
      'director-de-area': 'Lic. María González'
    },
    {
      instituto: 'INSTITUCIÓN EDUCATIVA SILVINO RODRÍGUEZ',
      estudiante: 'Ana Sofía Martínez',
      lugar: '3',
      grado: '6°',
      fecha: '21/10/2025',
      'ciudad-departamento': 'Tunja - Boyacá',
      sede: 'Principal',
      rector: 'Dr. Juan Carlos Pérez',
      'director-de-area': 'Lic. María González'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Festivales');

  return wb;
};

// Plantilla para GRADO
const downloadGrado = () => {
  const wb = XLSX.utils.book_new();
  const rows = [
    {
      instituto: 'INSTITUCIÓN EDUCATIVA SILVINO RODRÍGUEZ',
      estudiante: 'Juan Pablo Rodríguez',
      grado: '6°',
      fecha: '15/12/2025',
      'ciudad-departamento': 'Tunja - Boyacá',
      sede: 'Principal',
      rector: 'Dr. Juan Carlos Pérez',
      'director-de-area': 'Lic. María González'
    },
    {
      instituto: 'INSTITUCIÓN EDUCATIVA SILVINO RODRÍGUEZ',
      estudiante: 'Valentina Sánchez',
      grado: '6°',
      fecha: '15/12/2025',
      'ciudad-departamento': 'Tunja - Boyacá',
      sede: 'Principal',
      rector: 'Dr. Juan Carlos Pérez',
      'director-de-area': 'Lic. María González'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Grado');

  return wb;
};

// GET /api/download-template?festival=1 - Descargar plantilla de festivales
router.get('/', (req, res) => {
  try {
    const { type } = req.query;

    let wb;
    let filename;

    if (type === 'festival') {
      wb = downloadFestival();
      filename = 'plantilla_festival.xlsx';
    } else if (type === 'grado') {
      wb = downloadGrado();
      filename = 'plantilla_grado.xlsx';
    } else {
      return res.status(400).json({ error: 'Tipo de plantilla no válido. Use "festival" o "grado"' });
    }

    // Generar buffer del archivo Excel
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    // Enviar el archivo
    res.send(buffer);

  } catch (error) {
    console.error('Error generando plantilla:', error);
    res.status(500).json({ error: 'Error interno del servidor al generar plantilla' });
  }
});

module.exports = router;