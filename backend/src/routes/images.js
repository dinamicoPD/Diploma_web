const express = require('express');
const router = express.Router();
const { 
  createImage, 
  getImageById, 
  getAllImages, 
  updateImage, 
  deleteImage 
} = require('../models/Image');

// GET /api/images - Listar todas las imágenes
router.get('/', async (req, res) => {
  try {
    const images = await getAllImages();
    res.json(images);
  } catch (error) {
    console.error('Error obteniendo imágenes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/images/:id - Obtener imagen por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const image = await getImageById(id);
    
    if (!image) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }
    
    res.json(image);
  } catch (error) {
    console.error('Error obteniendo imagen:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/images - Crear nueva imagen
router.post('/', async (req, res) => {
  try {
    const { name, url, format, width, height, size } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ error: 'Nombre y URL son requeridos' });
    }
    
    const newImage = await createImage({ 
      name, 
      url, 
      format: format || null, 
      width: width || null, 
      height: height || null, 
      size: size || null
    });
    
    res.status(201).json(newImage);
  } catch (error) {
    console.error('Error creando imagen:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/images/:id - Actualizar imagen
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Remover id del updateData si existe
    delete updateData.id;
    
    const updatedImage = await updateImage(id, updateData);
    
    if (!updatedImage) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }
    
    res.json(updatedImage);
  } catch (error) {
    console.error('Error actualizando imagen:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/images/:id - Eliminar imagen
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteImage(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando imagen:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;