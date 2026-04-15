// supabase.js - Database connection file
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase keys missing! Check your .env file');
} else {
  console.log('✅ Supabase keys found!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('admins').select('*').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connected successfully!');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
};