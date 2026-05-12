// Modelo de Fuente usando Firestore
const { db } = require('./db');

// Colección de fuentes en Firestore
const fontsCollection = db.collection('fonts');

// Función para crear una nueva fuente
async function createFont(fontData) {
  const docRef = await fontsCollection.add({
    ...fontData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return { id: docRef.id, ...fontData };
}

// Función para obtener una fuente por ID
async function getFontById(id) {
  const doc = await fontsCollection.doc(id).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() };
}

// Función para obtener todas las fuentes
async function getAllFonts() {
  const snapshot = await fontsCollection.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Función para actualizar una fuente
async function updateFont(id, updateData) {
  await fontsCollection.doc(id).update({
    ...updateData,
    updatedAt: new Date()
  });
  const doc = await fontsCollection.doc(id).get();
  return { id: doc.id, ...doc.data() };
}

// Función para eliminar una fuente
async function deleteFont(id) {
  await fontsCollection.doc(id).delete();
  return { id };
}

module.exports = {
  createFont,
  getFontById,
  getAllFonts,
  updateFont,
  deleteFont
};