// Modelo de Imagen usando Supabase
const { supabase } = require('../db');

// Función para crear una nueva imagen
async function createImage(imageData) {
  const { data, error } = await supabase
    .from('images')
    .insert([{
      ...imageData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) throw error;
  return { id: data.id, ...data };
}

// Función para obtener una imagen por ID
async function getImageById(id) {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) return null;
  return { id: data.id, ...data };
}

// Función para obtener todas las imágenes
async function getAllImages() {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data.map(item => ({ id: item.id, ...item }));
}

// Función para actualizar una imagen
async function updateImage(id, updateData) {
  const { data, error } = await supabase
    .from('images')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return { id: data.id, ...data };
}

// Función para eliminar una imagen
async function deleteImage(id) {
  const { error } = await supabase
    .from('images')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return { id };
}

module.exports = {
  createImage,
  getImageById,
  getAllImages,
  updateImage,
  deleteImage
};