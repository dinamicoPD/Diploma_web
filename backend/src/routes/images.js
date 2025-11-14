const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp } = require('firebase/firestore');

// Listar todas
router.get('/', async (_req, res) => {
  const items = await Image.findAll({ order: [['createdAt', 'DESC']] });
  res.json(items);
});

// Obtener una por id
router.get('/:id', async (req, res) => {
  const item = await Image.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'No encontrado' });
  res.json(item);
});

// Crear nueva
router.post('/', async (req, res) => {
  const { dataUrl, name } = req.body || {};
  if (!dataUrl) return res.status(400).json({ message: 'dataUrl es obligatorio' });

  const created = await Image.create({
    dataUrl,
    name: name || null
  });
  res.status(201).json(created);
});

// Actualizar
router.put('/:id', async (req, res) => {
  const { dataUrl, name } = req.body || {};
  const item = await Image.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'No encontrado' });

  if (dataUrl) item.dataUrl = dataUrl;
  if (name !== undefined) item.name = name;

  await item.save();
  res.json(item);
});

// Eliminar
router.delete('/:id', async (req, res) => {
  const item = await Image.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'No encontrado' });
  await item.destroy();
  res.json({ ok: true });
});

module.exports = router;