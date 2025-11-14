const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Firestore
const db = admin.firestore();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json({ limit: '25mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// DESIGNS ROUTES
app.get('/designs', async (req, res) => {
  try {
    const snapshot = await db.collection('designs').orderBy('updatedAt', 'desc').get();
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    res.json(items);
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.get('/designs/:id', async (req, res) => {
  try {
    const docRef = db.collection('designs').doc(req.params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: 'No encontrado' });
    }

    const data = docSnap.data();
    const elementsSnapshot = await db.collection('elements').where('designId', '==', req.params.id).get();
    const elements = elementsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));

    const designData = { ...data };
    if (data.backgroundImageId) {
      const bgImageDoc = await db.collection('images').doc(data.backgroundImageId).get();
      if (bgImageDoc.exists) {
        designData.backgroundUrl = bgImageDoc.data().dataUrl;
      }
      delete designData.backgroundImageId;
    }

    let processedElements = [];
    if (elements.length > 0) {
      processedElements = elements.map(el => {
        const props = { ...el.properties };
        if (el.type === 'image' && props.imageId) {
          // Note: In production, you might want to fetch the image URL here
          delete props.imageId;
        }
        return {
          id: el.id,
          type: el.type,
          x: el.x, y: el.y, w: el.w, h: el.h, z: el.z,
          ...props
        };
      });
    } else if (data.elements) {
      processedElements = data.elements;
    }
    designData.elements = processedElements;

    res.json({
      id: docSnap.id,
      ...designData,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching design:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.post('/designs', async (req, res) => {
  try {
    const { name, data, medalImages } = req.body || {};
    if (!name || !data) return res.status(400).json({ message: 'name y data son obligatorios' });

    const designData = {
      format: data.format,
      orientation: data.orientation,
      dpi: data.dpi,
      medalImages: data.medalImages
    };

    if (data.backgroundUrl) {
      const bgImageRef = await db.collection('images').add({
        dataUrl: data.backgroundUrl,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      designData.backgroundImageId = bgImageRef.id;
    }

    const docRef = await db.collection('designs').add({
      name,
      data: designData,
      medal_images: medalImages ?? null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (data.elements && Array.isArray(data.elements)) {
      for (const el of data.elements) {
        const properties = {};
        if (el.type === 'text') {
          Object.assign(properties, {
            text: el.text,
            fontSize: el.fontSize,
            color: el.color,
            fontFamily: el.fontFamily,
            bold: el.bold,
            italic: el.italic,
            align: el.align
          });
        } else if (el.type === 'image') {
          const imgRef = await db.collection('images').add({
            dataUrl: el.src,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          Object.assign(properties, { imageId: imgRef.id, lockAspect: el.lockAspect });
        } else {
          Object.assign(properties, { previewVariant: el.previewVariant, lockAspect: el.lockAspect });
        }
        await db.collection('elements').add({
          designId: docRef.id,
          type: el.type,
          x: el.x, y: el.y, w: el.w, h: el.h, z: el.z,
          properties,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    res.status(201).json({
      id: docRef.id,
      name,
      data: designData,
      medal_images: medalImages ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating design:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.put('/designs/:id', async (req, res) => {
  try {
    const { name, data, medalImages } = req.body || {};
    const docRef = db.collection('designs').doc(req.params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: 'No encontrado' });
    }

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (name) updateData.name = name;

    if (data) {
      const designData = {
        format: data.format,
        orientation: data.orientation,
        dpi: data.dpi,
        medalImages: data.medalImages
      };

      if (data.backgroundUrl) {
        const bgImageRef = await db.collection('images').add({
          dataUrl: data.backgroundUrl,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        designData.backgroundImageId = bgImageRef.id;
      }

      updateData.data = designData;

      // Delete old elements
      const elementsSnapshot = await db.collection('elements').where('designId', '==', req.params.id).get();
      const batch = db.batch();
      elementsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Create new elements
      if (data.elements && Array.isArray(data.elements)) {
        for (const el of data.elements) {
          const properties = {};
          if (el.type === 'text') {
            Object.assign(properties, {
              text: el.text,
              fontSize: el.fontSize,
              color: el.color,
              fontFamily: el.fontFamily,
              bold: el.bold,
              italic: el.italic,
              align: el.align
            });
          } else if (el.type === 'image') {
            const imgRef = await db.collection('images').add({
              dataUrl: el.src,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            Object.assign(properties, { imageId: imgRef.id, lockAspect: el.lockAspect });
          } else {
            Object.assign(properties, { previewVariant: el.previewVariant, lockAspect: el.lockAspect });
          }
          await db.collection('elements').add({
            designId: req.params.id,
            type: el.type,
            x: el.x, y: el.y, w: el.w, h: el.h, z: el.z,
            properties,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
    }

    if (medalImages !== undefined) updateData.medal_images = medalImages;

    await docRef.update(updateData);
    res.json({ id: req.params.id, ...updateData });
  } catch (error) {
    console.error('Error updating design:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.delete('/designs/:id', async (req, res) => {
  try {
    const docRef = db.collection('designs').doc(req.params.id);
    await docRef.delete();
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting design:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ELEMENTS ROUTES
app.get('/elements', async (req, res) => {
  try {
    const snapshot = await db.collection('elements').orderBy('updatedAt', 'desc').get();
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    res.json(items);
  } catch (error) {
    console.error('Error fetching elements:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.get('/elements/:id', async (req, res) => {
  try {
    const docRef = db.collection('elements').doc(req.params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: 'No encontrado' });
    }

    const data = docSnap.data();
    res.json({
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching element:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.post('/elements', async (req, res) => {
  try {
    const { designId, type, x, y, w, h, z, properties } = req.body || {};
    if (!designId || !type || x === undefined || y === undefined || w === undefined || h === undefined || z === undefined || !properties) {
      return res.status(400).json({ message: 'designId, type, x, y, w, h, z y properties son obligatorios' });
    }

    const docRef = await db.collection('elements').add({
      designId,
      type,
      x,
      y,
      w,
      h,
      z,
      properties,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      id: docRef.id,
      designId,
      type,
      x,
      y,
      w,
      h,
      z,
      properties,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating element:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.put('/elements/:id', async (req, res) => {
  try {
    const { designId, type, x, y, w, h, z, properties } = req.body || {};
    const docRef = db.collection('elements').doc(req.params.id);

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (designId !== undefined) updateData.designId = designId;
    if (type !== undefined) updateData.type = type;
    if (x !== undefined) updateData.x = x;
    if (y !== undefined) updateData.y = y;
    if (w !== undefined) updateData.w = w;
    if (h !== undefined) updateData.h = h;
    if (z !== undefined) updateData.z = z;
    if (properties !== undefined) updateData.properties = properties;

    await docRef.update(updateData);

    res.json({
      id: req.params.id,
      designId,
      type,
      x,
      y,
      w,
      h,
      z,
      properties,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating element:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.delete('/elements/:id', async (req, res) => {
  try {
    const docRef = db.collection('elements').doc(req.params.id);
    await docRef.delete();
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting element:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// FONTS ROUTES
app.get('/fonts', async (req, res) => {
  try {
    const snapshot = await db.collection('fonts').orderBy('createdAt', 'desc').get();
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    res.json(items);
  } catch (error) {
    console.error('Error fetching fonts:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.get('/fonts/:id', async (req, res) => {
  try {
    const docRef = db.collection('fonts').doc(req.params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: 'No encontrado' });
    }

    const data = docSnap.data();
    res.json({
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching font:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.post('/fonts', async (req, res) => {
  try {
    const { family, format, dataUrl, fileName } = req.body || {};
    if (!family || !format || !dataUrl || !fileName) {
      return res.status(400).json({ message: 'family, format, dataUrl y fileName son obligatorios' });
    }

    const docRef = await db.collection('fonts').add({
      family,
      format,
      dataUrl,
      fileName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      id: docRef.id,
      family,
      format,
      dataUrl,
      fileName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating font:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.put('/fonts/:id', async (req, res) => {
  try {
    const { family, format, dataUrl, fileName } = req.body || {};
    const docRef = db.collection('fonts').doc(req.params.id);

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (family !== undefined) updateData.family = family;
    if (format !== undefined) updateData.format = format;
    if (dataUrl !== undefined) updateData.dataUrl = dataUrl;
    if (fileName !== undefined) updateData.fileName = fileName;

    await docRef.update(updateData);

    res.json({
      id: req.params.id,
      family,
      format,
      dataUrl,
      fileName,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating font:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.delete('/fonts/:id', async (req, res) => {
  try {
    const docRef = db.collection('fonts').doc(req.params.id);
    await docRef.delete();
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting font:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// IMAGES ROUTES
app.get('/images', async (req, res) => {
  try {
    const snapshot = await db.collection('images').orderBy('createdAt', 'desc').get();
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    res.json(items);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.get('/images/:id', async (req, res) => {
  try {
    const docRef = db.collection('images').doc(req.params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: 'No encontrado' });
    }

    const data = docSnap.data();
    res.json({
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.post('/images', async (req, res) => {
  try {
    const { dataUrl, name } = req.body || {};
    if (!dataUrl) return res.status(400).json({ message: 'dataUrl es obligatorio' });

    const docRef = await db.collection('images').add({
      dataUrl,
      name: name || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      id: docRef.id,
      dataUrl,
      name: name || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating image:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.put('/images/:id', async (req, res) => {
  try {
    const { dataUrl, name } = req.body || {};
    const docRef = db.collection('images').doc(req.params.id);

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (dataUrl !== undefined) updateData.dataUrl = dataUrl;
    if (name !== undefined) updateData.name = name;

    await docRef.update(updateData);

    res.json({
      id: req.params.id,
      dataUrl,
      name,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.delete('/images/:id', async (req, res) => {
  try {
    const docRef = db.collection('images').doc(req.params.id);
    await docRef.delete();
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Export the Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);