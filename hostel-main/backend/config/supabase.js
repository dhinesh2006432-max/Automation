const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://lkkrnbascsemsavxjgbf.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_OeFRpRVXuipHz4-hdR3DpA_9u1Hv42m';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
