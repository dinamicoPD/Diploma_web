// Modelo de Fuente usando Supabase
const { supabase } = require('../db');

// Función para crear una nueva fuente
async function createFont(fontData) {
  const { data, error } = await supabase
    .from('fonts')
    .insert([{
      ...fontData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) throw error;
  return { id: data.id, ...data };
}

// Función para obtener una fuente por ID
async function getFontById(id) {
  const { data, error } = await supabase
    .from('fonts')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) return null;
  return { id: data.id, ...data };
}

// Función para obtener todas las fuentes
async function getAllFonts() {
  const { data, error } = await supabase
    .from('fonts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data.map(item => ({ id: item.id, ...item }));
}

// Función para actualizar una fuente
async function updateFont(id, updateData) {
  const { data, error } = await supabase
    .from('fonts')
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

// Función para eliminar una fuente
async function deleteFont(id) {
  const { error } = await supabase
    .from('fonts')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return { id };
}

module.exports = {
  createFont,
  getFontById,
  getAllFonts,
  updateFont,
  deleteFont
};