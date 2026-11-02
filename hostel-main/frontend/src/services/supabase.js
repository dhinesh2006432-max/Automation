import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lkkrnbascsemsavxjgbf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_OeFRpRVXuipHz4-hdR3DpA_9u1Hv42m';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
