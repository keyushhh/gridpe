import { createClient } from '@supabase/supabase-js';
import { Tables } from '@/types/database';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = any;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
