const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp } = require('firebase/firestore');

// Listar todos
router.get('/', async (_req, res) => {
  try {
    const q = query(collection(db, 'elements'), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    res.json(items);
  } catch (error) {
    console.error('Error fetching elements:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener uno por id
router.get('/:id', async (req, res) => {
  const item = await Element.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'No encontrado' });
  res.json(item);
});

// Crear nuevo
router.post('/', async (req, res) => {
  const { designId, type, x, y, w, h, z, properties } = req.body || {};
  if (!designId || !type || x === undefined || y === undefined || w === undefined || h === undefined || z === undefined || !properties) {
    return res.status(400).json({ message: 'designId, type, x, y, w, h, z y properties son obligatorios' });
  }

  const created = await Element.create({
    designId,
    type,
    x,
    y,
    w,
    h,
    z,
    properties
  });
  res.status(201).json(created);
});

// Actualizar
router.put('/:id', async (req, res) => {
  const { designId, type, x, y, w, h, z, properties } = req.body || {};
  const item = await Element.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'No encontrado' });

  if (designId) item.designId = designId;
  if (type) item.type = type;
  if (x !== undefined) item.x = x;
  if (y !== undefined) item.y = y;
  if (w !== undefined) item.w = w;
  if (h !== undefined) item.h = h;
  if (z !== undefined) item.z = z;
  if (properties) item.properties = properties;

  await item.save();
  res.json(item);
});

// Eliminar
router.delete('/:id', async (req, res) => {
  const item = await Element.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'No encontrado' });
  await item.destroy();
  res.json({ ok: true });
});

module.exports = router;