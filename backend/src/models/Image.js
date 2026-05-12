// Modelo de Imagen usando Firestore
const { db } = require('./db');

// Colección de imágenes en Firestore
const imagesCollection = db.collection('images');

// Función para crear una nueva imagen
async function createImage(imageData) {
  const docRef = await imagesCollection.add({
    ...imageData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return { id: docRef.id, ...imageData };
}

// Función para obtener una imagen por ID
async function getImageById(id) {
  const doc = await imagesCollection.doc(id).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() };
}

// Función para obtener todas las imágenes
async function getAllImages() {
  const snapshot = await imagesCollection.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Función para actualizar una imagen
async function updateImage(id, updateData) {
  await imagesCollection.doc(id).update({
    ...updateData,
    updatedAt: new Date()
  });
  const doc = await imagesCollection.doc(id).get();
  return { id: doc.id, ...doc.data() };
}

// Función para eliminar una imagen
async function deleteImage(id) {
  await imagesCollection.doc(id).delete();
  return { id };
}

module.exports = {
  createImage,
  getImageById,
  getAllImages,
  updateImage,
  deleteImage
};