// Modelo de Diseño usando Supabase
const { supabase } = require('../db');

// Función para crear un nuevo diseño
async function createDesign(designData) {
  const { data, error } = await supabase
    .from('designs')
    .insert([{
      ...designData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) throw error;
  return { id: data.id, ...data };
}

// Función para obtener un diseño por ID
async function getDesignById(id) {
  const { data, error } = await supabase
    .from('designs')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) return null;
  return { id: data.id, ...data };
}

// Función para obtener todos los diseños
async function getAllDesigns() {
  const { data, error } = await supabase
    .from('designs')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data.map(item => ({ id: item.id, ...item }));
}

// Función para actualizar un diseño
async function updateDesign(id, updateData) {
  const { data, error } = await supabase
    .from('designs')
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

// Función para eliminar un diseño
async function deleteDesign(id) {
  const { error } = await supabase
    .from('designs')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return { id };
}

module.exports = {
  createDesign,
  getDesignById,
  getAllDesigns,
  updateDesign,
  deleteDesign
};