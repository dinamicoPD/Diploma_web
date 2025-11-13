const express = require('express');
const router = express.Router();
const { Design } = require('../models/Design');
const { Element } = require('../models/Element');
const { Image } = require('../models/Image');

// Listar todos
router.get('/', async (_req, res) => {
  const items = await Design.findAll({ order: [['updatedAt', 'DESC']] });
  res.json(items);
});

// Obtener uno por id
router.get('/:id', async (req, res) => {
  const item = await Design.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'No encontrado' });

  // Fetch elements
  const elements = await Element.findAll({ where: { designId: req.params.id } });

  // Transform to match old structure
  const data = { ...item.data };

  // Handle background image
  if (data.backgroundImageId) {
    const bgImage = await Image.findByPk(data.backgroundImageId);
    if (bgImage) data.backgroundUrl = bgImage.dataUrl;
    delete data.backgroundImageId;
  }

  // Handle elements
  let processedElements = [];
  if (elements.length > 0) {
    processedElements = await Promise.all(elements.map(async el => {
      const props = { ...el.properties };
      if (el.type === 'image' && props.imageId) {
        const img = await Image.findByPk(props.imageId);
        if (img) props.src = img.dataUrl;
        delete props.imageId;
      }
      return {
        id: el.id,
        type: el.type,
        x: el.x, y: el.y, w: el.w, h: el.h, z: el.z,
        ...props
      };
    }));
  } else if (item.data.elements) {
    // Fallback for old designs
    processedElements = item.data.elements;
  }
  data.elements = processedElements;

  res.json({ ...item.toJSON(), data });
});

// Crear nuevo
router.post('/', async (req, res) => {
  const { name, data, medalImages } = req.body || {};
  if (!name || !data) return res.status(400).json({ message: 'name y data son obligatorios' });

  const designData = { format: data.format, orientation: data.orientation, dpi: data.dpi, medalImages: data.medalImages };

  // Handle background image
  if (data.backgroundUrl) {
    const bgImage = await Image.create({ dataUrl: data.backgroundUrl });
    designData.backgroundImageId = bgImage.id;
  }

  const created = await Design.create({
    name,
    data: designData,
    medal_images: medalImages ?? null
  });

  if (data.elements && Array.isArray(data.elements)) {
    for (const el of data.elements) {
      const properties = {};
      if (el.type === 'text') {
        Object.assign(properties, { text: el.text, fontSize: el.fontSize, color: el.color, fontFamily: el.fontFamily, bold: el.bold, italic: el.italic, align: el.align });
      } else if (el.type === 'image') {
        const img = await Image.create({ dataUrl: el.src });
        Object.assign(properties, { imageId: img.id, lockAspect: el.lockAspect });
      } else { // medal
        Object.assign(properties, { previewVariant: el.previewVariant, lockAspect: el.lockAspect });
      }
      await Element.create({
        designId: created.id,
        type: el.type,
        x: el.x, y: el.y, w: el.w, h: el.h, z: el.z,
        properties
      });
    }
  }

  res.status(201).json(created);
});

// Actualizar
router.put('/:id', async (req, res) => {
  const { name, data, medalImages } = req.body || {};
  const item = await Design.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'No encontrado' });

  if (name) item.name = name;
  if (data) {
    const designData = { format: data.format, orientation: data.orientation, dpi: data.dpi, medalImages: data.medalImages };

    // Handle background image
    if (data.backgroundUrl) {
      const bgImage = await Image.create({ dataUrl: data.backgroundUrl });
      designData.backgroundImageId = bgImage.id;
    }

    item.data = designData;

    // Delete old elements
    await Element.destroy({ where: { designId: req.params.id } });

    // Create new elements
    if (data.elements && Array.isArray(data.elements)) {
      for (const el of data.elements) {
        const properties = {};
        if (el.type === 'text') {
          Object.assign(properties, { text: el.text, fontSize: el.fontSize, color: el.color, fontFamily: el.fontFamily, bold: el.bold, italic: el.italic, align: el.align });
        } else if (el.type === 'image') {
          const img = await Image.create({ dataUrl: el.src });
          Object.assign(properties, { imageId: img.id, lockAspect: el.lockAspect });
        } else { // medal
          Object.assign(properties, { previewVariant: el.previewVariant, lockAspect: el.lockAspect });
        }
        await Element.create({
          designId: req.params.id,
          type: el.type,
          x: el.x, y: el.y, w: el.w, h: el.h, z: el.z,
          properties
        });
      }
    }
  }
  if (typeof medalImages !== 'undefined') item.medal_images = medalImages;

  await item.save();
  res.json(item);
});

// Eliminar
router.delete('/:id', async (req, res) => {
  const item = await Design.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'No encontrado' });
  await item.destroy(); // Elements deleted automatically due to CASCADE
  res.json({ ok: true });
});

module.exports = router;
