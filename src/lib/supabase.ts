import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Missing environment variable: VITE_SUPABASE_URL. ' +
      'Add it to your .env.local file. See .env.example for reference.',
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing environment variable: VITE_SUPABASE_ANON_KEY. ' +
      'Add it to your .env.local file. See .env.example for reference.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
