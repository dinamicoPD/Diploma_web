const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const { initDb } = require('./db');
const designsRoutes = require('./routes/designs');
const fontsRoutes = require('./routes/fonts');
const elementsRoutes = require('./routes/elements');
const imagesRoutes = require('./routes/images');
const downloadTemplateRoutes = require('./routes/downloadTemplate');
require('dotenv').config();

async function main() {
  // 1) Inicializar Firebase
  await initDb();

  const app = express();

  // Seguridad básica
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // Compresión de respuestas
  app.use(compression());

  // Permitir llamadas desde tu frontend
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Aceptar JSON grandes (imágenes en dataURL)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Rate limiting básico (simple implementation)
  const requestCounts = new Map();
  app.use((req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos
    const maxRequests = 1000; // máximo por ventana

    if (!requestCounts.has(clientIP)) {
      requestCounts.set(clientIP, { count: 1, resetTime: now + windowMs });
    } else {
      const clientData = requestCounts.get(clientIP);
      if (now > clientData.resetTime) {
        clientData.count = 1;
        clientData.resetTime = now + windowMs;
      } else if (clientData.count >= maxRequests) {
        return res.status(429).json({ error: 'Demasiadas solicitudes. Intente más tarde.' });
      } else {
        clientData.count++;
      }
    }
    next();
  });

  // Salud
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Rutas de diseños
  app.use('/api/designs', designsRoutes);

  // Rutas de fuentes
  app.use('/api/fonts', fontsRoutes);
  
  // Rutas de elementos
  app.use('/api/elements', elementsRoutes);
  
  // Rutas de imágenes
  app.use('/api/images', imagesRoutes);

  // Rutas de descarga de plantillas
  app.use('/api/download-template', downloadTemplateRoutes);

  const port = Number(process.env.PORT || 4000);
  const server = app.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}`);
    console.log(`Optimizaciones activadas: compression, helmet, rate limiting`);
  });

  // Configurar timeouts del servidor
  server.timeout = 300000; // 5 minutos
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  // Manejo de señales para graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM recibido, cerrando servidor...');
    server.close(() => {
      console.log('Servidor cerrado correctamente');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT recibido, cerrando servidor...');
    server.close(() => {
      console.log('Servidor cerrado correctamente');
      process.exit(0);
    });
  });
}

// Arrancar
main().catch(err => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
