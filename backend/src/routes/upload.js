const express = require('express');
const router = express.Router();
const cloudinary = require('../lib/cloudinary');
const fileUpload = require('express-fileupload');
const { v4: uuidv4 } = require('uuid');

// Configure file upload middleware
router.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  abortOnLimit: true,
  createParentPath: true
}));

// Middleware to extract user ID from Firebase Auth token
// In a real app, you'd verify the token with Firebase Admin SDK
// For now, we'll expect the frontend to send userId in a custom header
const extractUserId = (req, res, next) => {
  const userId = req.headers['x-user-id'] || req.body.userId;
  if (!userId) {
    return res.status(401).json({ error: 'User ID is required' });
  }
  req.userId = userId;
  next();
};

// Route for uploading images
router.post('/image', extractUserId, async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const file = req.files.image;
    
    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      });
    }

    const folder = `diplomas/images/${req.userId}`;
    const publicId = `${uuidv4()}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder,
      public_id: publicId,
      resource_type: 'auto'
    });

    // Prepare metadata for Firestore
    const imageData = {
      name: file.name || 'Unnamed image',
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      size: result.bytes,
      userId: req.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save metadata to Firestore using existing Image model
    const { Image } = require('../models/Image');
    const savedImage = await Image.create(imageData);
    
    // Clean up temporary file
    const fs = require('fs');
    if (fs.existsSync(file.tempFilePath)) {
      fs.unlinkSync(file.tempFilePath);
    }

    res.status(201).json({ 
      id: savedImage.id,
      url: savedImage.url,
      ...savedImage
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Route for uploading fonts
router.post('/font', extractUserId, async (req, res) => {
  try {
    if (!req.files || !req.files.font) {
      return res.status(400).json({ error: 'No font file provided' });
    }

    const file = req.files.font;
    
    // Validate file type for fonts
    const allowedMimeTypes = [
      'font/ttf', 
      'font/otf', 
      'font/woff', 
      'font/woff2',
      'application/font-sfnt',
      'application/x-font-ttf',
      'application/x-font-opentype',
      'application/x-font-woff',
      'application/x-font-woff2'
    ];
    
    // Also check file extension as fallback
    const allowedExtensions = ['ttf', 'otf', 'woff', 'woff2'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const isValidType = allowedMimeTypes.includes(file.mimetype) || 
                       allowedExtensions.includes(fileExtension);

    if (!isValidType) {
      return res.status(400).json({ 
        error: 'Invalid font file type. Only TTF, OTF, WOFF, and WOFF2 fonts are allowed.' 
      });
    }

    const folder = `diplomas/fonts/${req.userId}`;
    const publicId = `${uuidv4()}`;

    // Upload to Cloudinary (use raw resource type for fonts)
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder,
      public_id: publicId,
      resource_type: 'raw' // Important for font files
    });

    // Prepare metadata for Firestore
    const fontData = {
      name: file.name || 'Unnamed font',
      url: result.secure_url,
      format: fileExtension,
      userId: req.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save metadata to Firestore using existing Font model
    const { Font } = require('../models/Font');
    const savedFont = await Font.create(fontData);
    
    // Clean up temporary file
    const fs = require('fs');
    if (fs.existsSync(file.tempFilePath)) {
      fs.unlinkSync(file.tempFilePath);
    }

    res.status(201).json({ 
      id: savedFont.id,
      url: savedFont.url,
      ...savedFont
    });
  } catch (error) {
    console.error('Error uploading font:', error);
    res.status(500).json({ error: 'Failed to upload font' });
  }
});

module.exports = router;