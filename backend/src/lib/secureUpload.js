'use strict';

const { supabase } = require('../db');
const cloudinary = require('./cloudinary');

// No aceptar un ID enviado por el navegador como prueba de identidad.
async function requireUser(req, res, next) {
  const header = req.headers.authorization;
  const match = typeof header === 'string' ? /^Bearer\s+(\S+)$/i.exec(header.trim()) : null;
  if (!match) return res.status(401).json({ error: 'Inicia sesion antes de subir archivos.' });
  try {
    const { data, error } = await supabase.auth.getUser(match[1]);
    if (error || !data?.user?.id) {
      const status = error?.status >= 500 ? 503 : 401;
      return res.status(status).json({
        error: status === 503 ? 'No se pudo verificar la sesion con Supabase.' : 'La sesion no es valida o ha expirado.',
      });
    }
    req.userId = data.user.id;
    return next();
  } catch {
    return res.status(503).json({ error: 'No se pudo contactar con Supabase Auth.' });
  }
}

function requireCloudinary(_req, res, next) {
  const config = cloudinary.config();
  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    return res.status(503).json({
      error: 'Faltan credenciales de Cloudinary en el .env del servidor: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.',
      code: 'CLOUDINARY_NOT_CONFIGURED',
    });
  }
  return next();
}

// express-fileupload usa memoria por defecto: el contenido esta en file.data,
// no en file.tempFilePath. El stream evita crear archivos temporales.
function uploadBuffer(file, options) {
  return new Promise((resolve, reject) => {
    if (!file || Array.isArray(file) || !Buffer.isBuffer(file.data) || file.data.length === 0) {
      reject(new Error('El archivo recibido esta vacio o no es valido.'));
      return;
    }
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else if (!result?.secure_url) reject(new Error('Cloudinary no devolvio una URL.'));
      else resolve(result);
    });
    stream.on('error', reject);
    stream.end(file.data);
  });
}

module.exports = { requireUser, requireCloudinary, uploadBuffer };
