const express = require('express');
const router = express.Router();
const { 
  createFont, 
  getFontById, 
  getAllFonts, 
  updateFont, 
  deleteFont 
} = require('../models/Font');

// GET /api/fonts - Listar todas las fuentes
router.get('/', async (req, res) => {
  try {
    const fonts = await getAllFonts();
    res.json(fonts);
  } catch (error) {
    console.error('Error obteniendo fuentes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/fonts/:id - Obtener fuente por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const font = await getFontById(id);
    
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
router.post('/', async (req, res) => {
  try {
    const { name, url, format, previewText } = req.body;
    
    if (!name || !url || !format) {
      return res.status(400).json({ error: 'Nombre, URL y formato son requeridos' });
    }
    
    const newFont = await createFont({ 
      name, 
      url, 
      format, 
      previewText: previewText || null
    });
    
    res.status(201).json(newFont);
  } catch (error) {
    console.error('Error creando fuente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/fonts/:id - Actualizar fuente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Remover id del updateData si existe
    delete updateData.id;
    
    const updatedFont = await updateFont(id, updateData);
    
    if (!updatedFont) {
      return res.status(404).json({ error: 'Fuente no encontrada' });
    }
    
    res.json(updatedFont);
  } catch (error) {
    console.error('Error actualizando fuente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/fonts/:id - Eliminar fuente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteFont(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Fuente no encontrada' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando fuente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;