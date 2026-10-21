// DIPLOMA_STORAGE_V1
// Retired Cloudinary route. Upload bytes go directly to Supabase Storage.
// Kept as a Router so the existing server.js does not need to change.
const express = require('express');
const router = express.Router();
router.use((_req, res) => {
  res.status(410).json({
    error: 'La subida cambio a Supabase Storage. Actualiza el frontend y recarga el editor.',
    code: 'UPLOAD_MOVED_TO_SUPABASE_STORAGE'
  });
});
module.exports = router;
