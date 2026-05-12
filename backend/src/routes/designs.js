const express = require('express');
const router = express.Router();
const { 
  createDesign, 
  getDesignById, 
  getAllDesigns, 
  updateDesign, 
  deleteDesign 
} = require('../models/Design');

// GET /api/designs - Listar todos los diseños
router.get('/', async (req, res) => {
  try {
    const designs = await getAllDesigns();
    res.json(designs);
  } catch (error) {
    console.error('Error obteniendo diseños:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/designs/:id - Obtener diseño por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const design = await getDesignById(id);
    
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
router.post('/', async (req, res) => {
  try {
    const { name, data } = req.body;
    
    if (!name || !data) {
      return res.status(400).json({ error: 'Nombre y datos son requeridos' });
    }
    
    const newDesign = await createDesign({ name, data });
    res.status(201).json(newDesign);
  } catch (error) {
    console.error('Error creando diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/designs/:id - Actualizar diseño
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, data } = req.body;
    
    const updatedDesign = await updateDesign(id, { 
      ...(name !== undefined ? { name } : {}),
      ...(data !== undefined ? { data } : {})
    });
    
    if (!updatedDesign) {
      return res.status(404).json({ error: 'Diseño no encontrado' });
    }
    
    res.json(updatedDesign);
  } catch (error) {
    console.error('Error actualizando diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/designs/:id - Eliminar diseño
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteDesign(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Diseño no encontrado' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;