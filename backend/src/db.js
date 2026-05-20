// Supabase configuration for backend
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function initDb() {
  console.log('Supabase initialized successfully');
}

module.exports = { supabase, initDb };