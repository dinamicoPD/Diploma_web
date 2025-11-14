const express = require('express');
const router = express.Router();

// Simulación de base de datos en memoria (para desarrollo)
// En producción esto debería usar Firebase Firestore
let elements = [
  {
    id: '1',
    type: 'text',
    text: 'CERTIFICADO DE PARTICIPACIÓN',
    x: 200,
    y: 100,
    w: 400,
    h: 50,
    fontSize: 24,
    fontFamily: 'Arial',
    color: '#000000',
    align: 'center',
    designId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET /api/elements - Listar todos los elementos
router.get('/', (req, res) => {
  try {
    res.json(elements);
  } catch (error) {
    console.error('Error obteniendo elementos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/elements/:id - Obtener elemento por ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const element = elements.find(e => e.id === id);

    if (!element) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }

    res.json(element);
  } catch (error) {
    console.error('Error obteniendo elemento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/elements - Crear nuevo elemento
router.post('/', (req, res) => {
  try {
    const { type, text, x, y, w, h, designId } = req.body;

    if (!type || !x !== undefined || !y !== undefined) {
      return res.status(400).json({ error: 'Tipo, posición X e Y son requeridos' });
    }

    const newElement = {
      id: Date.now().toString(),
      type,
      text: text || '',
      x: Number(x),
      y: Number(y),
      w: w ? Number(w) : 200,
      h: h ? Number(h) : 50,
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#000000',
      align: 'left',
      designId: designId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    elements.push(newElement);
    res.status(201).json(newElement);
  } catch (error) {
    console.error('Error creando elemento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/elements/:id - Actualizar elemento
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const elementIndex = elements.findIndex(e => e.id === id);

    if (elementIndex === -1) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }

    // Actualizar solo los campos proporcionados
    elements[elementIndex] = {
      ...elements[elementIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    res.json(elements[elementIndex]);
  } catch (error) {
    console.error('Error actualizando elemento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/elements/:id - Eliminar elemento
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const elementIndex = elements.findIndex(e => e.id === id);

    if (elementIndex === -1) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }

    elements.splice(elementIndex, 1);
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando elemento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;