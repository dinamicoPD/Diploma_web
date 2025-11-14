const express = require('express');
const router = express.Router();

// Simulación de base de datos en memoria (para desarrollo)
// En producción esto debería usar Firebase Firestore + Storage
let images = [
  {
    id: '1',
    name: 'Logo Institucional',
    url: '/logo.png',
    width: 200,
    height: 100,
    size: 15432,
    format: 'png',
    createdAt: new Date().toISOString()
  }
];

// GET /api/images - Listar todas las imágenes
router.get('/', (req, res) => {
  try {
    res.json(images);
  } catch (error) {
    console.error('Error obteniendo imágenes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/images/:id - Obtener imagen por ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const image = images.find(i => i.id === id);

    if (!image) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    res.json(image);
  } catch (error) {
    console.error('Error obteniendo imagen:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/images - Subir nueva imagen
router.post('/', (req, res) => {
  try {
    const { name, url, width, height, size, format } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Nombre y URL son requeridos' });
    }

    const newImage = {
      id: Date.now().toString(),
      name,
      url,
      width: width ? Number(width) : null,
      height: height ? Number(height) : null,
      size: size ? Number(size) : null,
      format: format || 'png',
      createdAt: new Date().toISOString()
    };

    images.push(newImage);
    res.status(201).json(newImage);
  } catch (error) {
    console.error('Error creando imagen:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/images/:id - Actualizar imagen
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, width, height, size, format } = req.body;

    const imageIndex = images.findIndex(i => i.id === id);

    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    images[imageIndex] = {
      ...images[imageIndex],
      name: name || images[imageIndex].name,
      url: url || images[imageIndex].url,
      width: width !== undefined ? Number(width) : images[imageIndex].width,
      height: height !== undefined ? Number(height) : images[imageIndex].height,
      size: size !== undefined ? Number(size) : images[imageIndex].size,
      format: format || images[imageIndex].format
    };

    res.json(images[imageIndex]);
  } catch (error) {
    console.error('Error actualizando imagen:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/images/:id - Eliminar imagen
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const imageIndex = images.findIndex(i => i.id === id);

    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    images.splice(imageIndex, 1);
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando imagen:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;