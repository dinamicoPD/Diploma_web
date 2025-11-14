// Firebase configuration for backend
const { db } = require('./firebase');

async function initDb() {
  // Firebase no necesita inicialización adicional
  console.log('Firebase initialized successfully');
}

module.exports = { db, initDb };
