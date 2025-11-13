const express = require('express');
const cors = require('cors');
const { initDb, sequelize } = require('./db');
const designsRoutes = require('./routes/designs');
const fontsRoutes = require('./routes/fonts');
require('dotenv').config();

async function main() {
  // 1) Conectar a la BD
  await initDb();
  // 2) Crear tablas si no existen (NO borra datos)
  await sequelize.sync();

  const app = express();

  // Permitir llamadas desde tu frontend
  app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));

  // Aceptar JSON grandes (imágenes en dataURL)
  app.use(express.json({ limit: '25mb' }));

  // Salud
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Rutas de diseños
  app.use('/api/designs', designsRoutes);

  // Rutas de fuentes
  app.use('/api/fonts', fontsRoutes);

  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}`);
  });
}

// Arrancar
main().catch(err => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
