const express = require('express');
const router = express.Router();

// Simulación de base de datos en memoria (para desarrollo)
// En producción esto debería usar Firebase Firestore
let designs = [
  {
    id: '1',
    name: 'Diploma de Festivales',
    data: {
      format: 'letter',
      orientation: 'portrait',
      dpi: 150,
      elements: [
        {
          id: 'text-1',
          type: 'text',
          text: 'CERTIFICADO DE PARTICIPACIÓN',
          x: 200,
          y: 100,
          w: 400,
          h: 50,
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#000000',
          align: 'center'
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET /api/designs - Listar todos los diseños
router.get('/', (req, res) => {
  try {
    res.json(designs);
  } catch (error) {
    console.error('Error obteniendo diseños:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/designs/:id - Obtener diseño por ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const design = designs.find(d => d.id === id);

    if (!design) {
      return res.status(404).json({ error: 'Diseño no encontrado' });
    }

    res.json(design);
  } catch (error) {
    console.error('Error obteniendo diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/designs - Crear nuevo diseño
router.post('/', (req, res) => {
  try {
    const { name, data } = req.body;

    if (!name || !data) {
      return res.status(400).json({ error: 'Nombre y datos son requeridos' });
    }

    const newDesign = {
      id: Date.now().toString(),
      name,
      data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    designs.push(newDesign);
    res.status(201).json(newDesign);
  } catch (error) {
    console.error('Error creando diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/designs/:id - Actualizar diseño
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, data } = req.body;

    const designIndex = designs.findIndex(d => d.id === id);

    if (designIndex === -1) {
      return res.status(404).json({ error: 'Diseño no encontrado' });
    }

    designs[designIndex] = {
      ...designs[designIndex],
      name: name || designs[designIndex].name,
      data: data || designs[designIndex].data,
      updatedAt: new Date().toISOString()
    };

    res.json(designs[designIndex]);
  } catch (error) {
    console.error('Error actualizando diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/designs/:id - Eliminar diseño
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const designIndex = designs.findIndex(d => d.id === id);

    if (designIndex === -1) {
      return res.status(404).json({ error: 'Diseño no encontrado' });
    }

    designs.splice(designIndex, 1);
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
