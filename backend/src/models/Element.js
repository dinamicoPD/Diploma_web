// Modelo de Elemento usando Firestore
const { db } = require('./db');

// Colección de elementos en Firestore
const elementsCollection = db.collection('elements');

// Función para crear un nuevo elemento
async function createElement(elementData) {
  const docRef = await elementsCollection.add({
    ...elementData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return { id: docRef.id, ...elementData };
}

// Función para obtener un elemento por ID
async function getElementById(id) {
  const doc = await elementsCollection.doc(id).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() };
}

// Función para obtener todos los elementos
async function getAllElements() {
  const snapshot = await elementsCollection.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Función para actualizar un elemento
async function updateElement(id, updateData) {
  await elementsCollection.doc(id).update({
    ...updateData,
    updatedAt: new Date()
  });
  const doc = await elementsCollection.doc(id).get();
  return { id: doc.id, ...doc.data() };
}

// Función para eliminar un elemento
async function deleteElement(id) {
  await elementsCollection.doc(id).delete();
  return { id };
}

module.exports = {
  createElement,
  getElementById,
  getAllElements,
  updateElement,
  deleteElement
};