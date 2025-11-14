const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp } = require('firebase/firestore');

// Listar todas
router.get('/', async (_req, res) => {
  try {
    const q = query(collection(db, 'images'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    res.json(items);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener una por id
router.get('/:id', async (req, res) => {
  try {
    const docRef = doc(db, 'images', req.params.id);
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
    console.error('Error fetching image:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear nueva
router.post('/', async (req, res) => {
  try {
    const { dataUrl, name } = req.body || {};
    if (!dataUrl) return res.status(400).json({ message: 'dataUrl es obligatorio' });

    const docRef = await addDoc(collection(db, 'images'), {
      dataUrl,
      name: name || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    res.status(201).json({
      id: docRef.id,
      dataUrl,
      name: name || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating image:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar
router.put('/:id', async (req, res) => {
  try {
    const { dataUrl, name } = req.body || {};
    const docRef = doc(db, 'images', req.params.id);

    const updateData = {
      updatedAt: Timestamp.now()
    };

    if (dataUrl !== undefined) updateData.dataUrl = dataUrl;
    if (name !== undefined) updateData.name = name;

    await updateDoc(docRef, updateData);

    res.json({
      id: req.params.id,
      dataUrl,
      name,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating image:', error);
    if (error.code === 'not-found') {
      return res.status(404).json({ message: 'No encontrado' });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar
router.delete('/:id', async (req, res) => {
  try {
    const docRef = doc(db, 'images', req.params.id);
    await deleteDoc(docRef);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;