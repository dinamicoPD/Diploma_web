const express = require('express');
const router = express.Router();
const { 
  createElement, 
  getElementById, 
  getAllElements, 
  updateElement, 
  deleteElement 
} = require('../models/Element');

// GET /api/elements - Listar todos los elementos
router.get('/', async (req, res) => {
  try {
    const elements = await getAllElements();
    res.json(elements);
  } catch (error) {
    console.error('Error obteniendo elementos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/elements/:id - Obtener elemento por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const element = await getElementById(id);
    
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
router.post('/', async (req, res) => {
  try {
    const { designId, type, text, x, y, w, h, fontSize, fontFamily, color, align, zIndex, imageUrl } = req.body;
    
    // Validaciones básicas según el tipo
    if (!designId || !type) {
      return res.status(400).json({ error: 'designId y type son requeridos' });
    }
    
    if (type === 'text' && !text) {
      return res.status(400).json({ error: 'El texto es requerido para elementos de tipo texto' });
    }
    
    if (type === 'image' && !imageUrl) {
      return res.status(400).json({ error: 'La URL de imagen es requerida para elementos de tipo imagen' });
    }
    
    const newElement = await createElement({ 
      designId, 
      type, 
      text, 
      x: x || 0, 
      y: y || 0, 
      w: w || 0, 
      h: h || 0, 
      fontSize: fontSize || 12, 
      fontFamily: fontFamily || 'Arial', 
      color: color || '#000000', 
      align: align || 'left',
      zIndex: zIndex || 0,
      imageUrl: imageUrl || null
    });
    
    res.status(201).json(newElement);
  } catch (error) {
    console.error('Error creando elemento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/elements/:id - Actualizar elemento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Remover id del updateData si existe
    delete updateData.id;
    
    const updatedElement = await updateElement(id, updateData);
    
    if (!updatedElement) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }
    
    res.json(updatedElement);
  } catch (error) {
    console.error('Error actualizando elemento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/elements/:id - Eliminar elemento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteElement(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando elemento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;