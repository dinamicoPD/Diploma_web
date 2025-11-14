const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp } = require('firebase/firestore');

// Listar todas
router.get('/', async (_req, res) => {
  try {
    const q = query(collection(db, 'fonts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    res.json(items);
  } catch (error) {
    console.error('Error fetching fonts:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener una por id
router.get('/:id', async (req, res) => {
  try {
    const docRef = doc(db, 'fonts', req.params.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ message: 'No encontrado' });
    }

    const data = docSnap.data();
    res.json({
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching font:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear nueva
router.post('/', async (req, res) => {
  try {
    const { family, format, dataUrl, fileName } = req.body || {};
    if (!family || !format || !dataUrl || !fileName) {
      return res.status(400).json({ message: 'family, format, dataUrl y fileName son obligatorios' });
    }

    const docRef = await addDoc(collection(db, 'fonts'), {
      family,
      format,
      dataUrl,
      fileName,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    res.status(201).json({
      id: docRef.id,
      family,
      format,
      dataUrl,
      fileName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating font:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar
router.put('/:id', async (req, res) => {
  try {
    const { family, format, dataUrl, fileName } = req.body || {};
    const docRef = doc(db, 'fonts', req.params.id);

    const updateData = {
      updatedAt: Timestamp.now()
    };

    if (family !== undefined) updateData.family = family;
    if (format !== undefined) updateData.format = format;
    if (dataUrl !== undefined) updateData.dataUrl = dataUrl;
    if (fileName !== undefined) updateData.fileName = fileName;

    await updateDoc(docRef, updateData);

    res.json({
      id: req.params.id,
      family,
      format,
      dataUrl,
      fileName,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating font:', error);
    if (error.code === 'not-found') {
      return res.status(404).json({ message: 'No encontrado' });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar
router.delete('/:id', async (req, res) => {
  try {
    const docRef = doc(db, 'fonts', req.params.id);
    await deleteDoc(docRef);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting font:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
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