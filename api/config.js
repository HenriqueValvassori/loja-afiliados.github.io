// api/config.js
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase - estas variáveis serão injetadas pelo Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Verifica se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseKey) {
  console.error("Variáveis de ambiente do Supabase não configuradas!");
}

// Cria e exporta o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);