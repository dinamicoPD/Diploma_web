const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp } = require('firebase/firestore');

// Listar todos
router.get('/', async (_req, res) => {
  try {
    const q = query(collection(db, 'designs'), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    res.json(items);
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener uno por id
router.get('/:id', async (req, res) => {
  try {
    const docRef = doc(db, 'designs', req.params.id);
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
    console.error('Error fetching design:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear nuevo
router.post('/', async (req, res) => {
  try {
    const { name, data, medalImages } = req.body || {};
    if (!name || !data) return res.status(400).json({ message: 'name y data son obligatorios' });

    const docRef = await addDoc(collection(db, 'designs'), {
      name,
      data,
      medal_images: medalImages,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    res.status(201).json({
      id: docRef.id,
      name,
      data,
      medal_images: medalImages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating design:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar
router.put('/:id', async (req, res) => {
  try {
    const { name, data, medalImages } = req.body || {};
    const docRef = doc(db, 'designs', req.params.id);

    const updateData = {
      updatedAt: Timestamp.now()
    };

    if (name !== undefined) updateData.name = name;
    if (data !== undefined) updateData.data = data;
    if (medalImages !== undefined) updateData.medal_images = medalImages;

    await updateDoc(docRef, updateData);

    res.json({
      id: req.params.id,
      name,
      data,
      medal_images: medalImages,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating design:', error);
    if (error.code === 'not-found') {
      return res.status(404).json({ message: 'No encontrado' });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar
router.delete('/:id', async (req, res) => {
  try {
    const docRef = doc(db, 'designs', req.params.id);
    await deleteDoc(docRef);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting design:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
