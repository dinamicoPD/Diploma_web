// Modelo de Diseño usando Firestore
const { db } = require('./db');

// Colección de diseños en Firestore
const designsCollection = db.collection('designs');

// Función para crear un nuevo diseño
async function createDesign(designData) {
  const docRef = await designsCollection.add({
    ...designData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return { id: docRef.id, ...designData };
}

// Función para obtener un diseño por ID
async function getDesignById(id) {
  const doc = await designsCollection.doc(id).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() };
}

// Función para obtener todos los diseños
async function getAllDesigns() {
  const snapshot = await designsCollection.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Función para actualizar un diseño
async function updateDesign(id, updateData) {
  await designsCollection.doc(id).update({
    ...updateData,
    updatedAt: new Date()
  });
  const doc = await designsCollection.doc(id).get();
  return { id: doc.id, ...doc.data() };
}

// Función para eliminar un diseño
async function deleteDesign(id) {
  await designsCollection.doc(id).delete();
  return { id };
}

module.exports = {
  createDesign,
  getDesignById,
  getAllDesigns,
  updateDesign,
  deleteDesign
};