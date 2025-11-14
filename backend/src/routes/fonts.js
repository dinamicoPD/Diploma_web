const express = require('express');
const router = express.Router();

// Simulación de base de datos en memoria (para desarrollo)
// En producción esto debería usar Firebase Firestore
let fonts = [
  {
    id: '1',
    family: 'Arial',
    format: 'truetype',
    dataUrl: 'data:font/ttf;base64,AAEAAAASAQAABAAgR0RFRkZ3aBcAA...',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    family: 'Chomsky',
    format: 'woff2',
    dataUrl: 'data:font/woff2;base64,d09GMgABAAAAA...',
    createdAt: new Date().toISOString()
  }
];

// GET /api/fonts - Listar todas las fuentes
router.get('/', (req, res) => {
  try {
    res.json(fonts);
  } catch (error) {
    console.error('Error obteniendo fuentes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/fonts/:id - Obtener fuente por ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const font = fonts.find(f => f.id === id);

    if (!font) {
      return res.status(404).json({ error: 'Fuente no encontrada' });
    }

    res.json(font);
  } catch (error) {
    console.error('Error obteniendo fuente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/fonts - Crear nueva fuente
router.post('/', (req, res) => {
  try {
    const { family, format, dataUrl } = req.body;

    if (!family || !format || !dataUrl) {
      return res.status(400).json({ error: 'Familia, formato y dataUrl son requeridos' });
    }

    // Validar formato
    const validFormats = ['woff2', 'woff', 'truetype', 'opentype'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({ error: 'Formato no válido. Use: woff2, woff, truetype, opentype' });
    }

    const newFont = {
      id: Date.now().toString(),
      family,
      format,
      dataUrl,
      createdAt: new Date().toISOString()
    };

    fonts.push(newFont);
    res.status(201).json(newFont);
  } catch (error) {
    console.error('Error creando fuente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/fonts/:id - Actualizar fuente
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { family, format, dataUrl } = req.body;

    const fontIndex = fonts.findIndex(f => f.id === id);

    if (fontIndex === -1) {
      return res.status(404).json({ error: 'Fuente no encontrada' });
    }

    // Validar formato si se proporciona
    if (format) {
      const validFormats = ['woff2', 'woff', 'truetype', 'opentype'];
      if (!validFormats.includes(format)) {
        return res.status(400).json({ error: 'Formato no válido. Use: woff2, woff, truetype, opentype' });
      }
    }

    fonts[fontIndex] = {
      ...fonts[fontIndex],
      family: family || fonts[fontIndex].family,
      format: format || fonts[fontIndex].format,
      dataUrl: dataUrl || fonts[fontIndex].dataUrl
    };

    res.json(fonts[fontIndex]);
  } catch (error) {
    console.error('Error actualizando fuente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/fonts/:id - Eliminar fuente
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const fontIndex = fonts.findIndex(f => f.id === id);

    if (fontIndex === -1) {
      return res.status(404).json({ error: 'Fuente no encontrada' });
    }

    fonts.splice(fontIndex, 1);
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando fuente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;