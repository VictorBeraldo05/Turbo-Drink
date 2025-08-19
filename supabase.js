import { createClient } from '@supabase/supabase-js';

// Substitua pelos seus valores do Supabase
const SUPABASE_URL = 'https://iaswzzycxvfkduscuefm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhc3d6enljeHZma2R1c2N1ZWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDQzNDUsImV4cCI6MjA3MTE4MDM0NX0.xQE1uUcDAIAWXIC5UP20e_fvOxRW5_T1zwPhLHwb9Gw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);