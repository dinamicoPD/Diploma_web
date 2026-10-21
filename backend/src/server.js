
/**
 * DINAMICO PD - DIPLOMA WEB
 * Servidor Backend Express
 *
 * Configuracion centralizada:
 * Diploma_web/.env
 */

// ======================================================
// 1. CARGAR VARIABLES DE ENTORNO
// ======================================================

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../../.env');

// Cargar archivo .env de la raiz del proyecto
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('Variables de entorno cargadas desde:', envPath);
} else {
  console.log(
    'No se encontro .env en la raiz. Usando variables del entorno.'
  );
}

// ======================================================
// 2. IMPORTAR DEPENDENCIAS
// ======================================================

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');

// Importar DESPUES de cargar las variables de entorno
const { initDb } = require('./db');

const designsRoutes = require('./routes/designs');
const fontsRoutes = require('./routes/fonts');
const elementsRoutes = require('./routes/elements');
const imagesRoutes = require('./routes/images');
const downloadTemplateRoutes = require('./routes/downloadTemplate');
const uploadRoutes = require('./routes/upload');

// ======================================================
// 3. INICIALIZAR SERVIDOR
// ======================================================

async function main() {

  // Verificar configuracion de Supabase
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Faltan credenciales de Supabase en el archivo .env'
    );
  }

  // Inicializar Supabase
  await initDb();

  const app = express();

  // ====================================================
  // 4. SEGURIDAD
  // ====================================================

  app.use(helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  }));

  app.use(compression());

  // ====================================================
  // 5. CONFIGURACION CORS
  // ====================================================

  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-User-ID'
    ]
  }));

  // ====================================================
  // 6. PROCESAMIENTO DE DATOS
  // ====================================================

  app.use(express.json({
    limit: '50mb'
  }));

  app.use(express.urlencoded({
    limit: '50mb',
    extended: true
  }));

  // ====================================================
  // 7. LIMITADOR BASICO DE SOLICITUDES
  // ====================================================

  const requestCounts = new Map();

  app.use((req, res, next) => {

    const clientIP = req.ip || req.socket.remoteAddress;

    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxRequests = 1000;

    const clientData = requestCounts.get(clientIP);

    if (!clientData || now > clientData.resetTime) {

      requestCounts.set(clientIP, {
        count: 1,
        resetTime: now + windowMs
      });

    } else if (clientData.count >= maxRequests) {

      return res.status(429).json({
        error: 'Demasiadas solicitudes. Intente mas tarde.'
      });

    } else {

      clientData.count++;

    }

    next();
  });

  // ====================================================
  // 8. VERIFICACION DEL SERVIDOR
  // ====================================================

  app.get('/health', (_req, res) => {

    res.json({
      ok: true,
      service: 'Diploma Web Backend',
      timestamp: new Date().toISOString()
    });

  });

  // ====================================================
  // 9. RUTAS API
  // ====================================================

  app.use('/api/designs', designsRoutes);

  app.use('/api/fonts', fontsRoutes);

  app.use('/api/elements', elementsRoutes);

  app.use('/api/images', imagesRoutes);

  app.use(
    '/api/download-template',
    downloadTemplateRoutes
  );

  app.use('/api/upload', uploadRoutes);

  // ====================================================
  // 10. INICIAR SERVIDOR
  // ====================================================

  const port = Number(process.env.PORT || 4000);

  const server = app.listen(port, () => {

    console.log('======================================');
    console.log(' DINAMICO PD - DIPLOMA WEB');
    console.log('======================================');

    console.log(`Backend: http://localhost:${port}`);
    console.log(`Health: http://localhost:${port}/health`);

    console.log('Supabase: configuracion cargada');
    console.log('Seguridad: Helmet + CORS');
    console.log('Compresion: habilitada');

    console.log('======================================');

  });

  // ====================================================
  // 11. TIMEOUTS
  // ====================================================

  server.timeout = 300000;
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  // ====================================================
  // 12. CIERRE CONTROLADO
  // ====================================================

  const shutdown = (signal) => {

    console.log(`${signal} recibido. Cerrando servidor...`);

    server.close(() => {

      console.log('Servidor cerrado correctamente');

      process.exit(0);

    });

  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

}

// ======================================================
// 13. ARRANQUE
// ======================================================

main().catch(error => {

  console.error(
    'Error al iniciar el servidor:',
    error
  );

  process.exit(1);

});
