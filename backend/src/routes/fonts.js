const express = require('express');
const router = express.Router();
const { Font } = require('../models/Font');

// Listar todas
router.get('/', async (_req, res) => {
  const items = await Font.findAll({ order: [['createdAt', 'DESC']] });
  res.json(items);
});

// Obtener una por id
router.get('/:id', async (req, res) => {
  const item = await Font.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'No encontrado' });
  res.json(item);
});

// Crear nueva
router.post('/', async (req, res) => {
  const { family, format, dataUrl, fileName } = req.body || {};
  if (!family || !format || !dataUrl || !fileName) return res.status(400).json({ message: 'family, format, dataUrl y fileName son obligatorios' });

  const created = await Font.create({
    family,
    format,
    dataUrl,
    fileName
  });
  res.status(201).json(created);
});

// Actualizar
router.put('/:id', async (req, res) => {
  const { family, format, dataUrl, fileName } = req.body || {};
  const item = await Font.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'No encontrado' });

  if (family) item.family = family;
  if (format) item.format = format;
  if (dataUrl) item.dataUrl = dataUrl;
  if (fileName) item.fileName = fileName;

  await item.save();
  res.json(item);
});

// Eliminar
router.delete('/:id', async (req, res) => {
  const item = await Font.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'No encontrado' });
  await item.destroy();
  res.json({ ok: true });
});

module.exports = router;