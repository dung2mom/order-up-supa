import { createBrowserClient } from '@supabase/ssr';

const FALLBACK_SUPABASE_URL = 'https://qjbgoecbyhhzbjeozmwo.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqYmdvZWNieWhoemJqZW96bXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzMDI3NDIsImV4cCI6MjEwOTg3ODc0Mn0.qRHBDFp4CgXznrU68n-2KcEycRGaOuW-1Hc28g5FNBQ';

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_SUPABASE_URL) ||
    FALLBACK_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    FALLBACK_SUPABASE_ANON_KEY;

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
