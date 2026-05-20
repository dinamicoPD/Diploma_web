// Modelo de Elemento usando Supabase
const { supabase } = require('../db');

// Función para crear un nuevo elemento
async function createElement(elementData) {
  const { data, error } = await supabase
    .from('elements')
    .insert([{
      ...elementData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) throw error;
  return { id: data.id, ...data };
}

// Función para obtener un elemento por ID
async function getElementById(id) {
  const { data, error } = await supabase
    .from('elements')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) return null;
  return { id: data.id, ...data };
}

// Función para obtener todos los elementos
async function getAllElements() {
  const { data, error } = await supabase
    .from('elements')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data.map(item => ({ id: item.id, ...item }));
}

// Función para actualizar un elemento
async function updateElement(id, updateData) {
  const { data, error } = await supabase
    .from('elements')
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

// Función para eliminar un elemento
async function deleteElement(id) {
  const { error } = await supabase
    .from('elements')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return { id };
}

module.exports = {
  createElement,
  getElementById,
  getAllElements,
  updateElement,
  deleteElement
};