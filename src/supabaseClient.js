import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

// Service role key bypasses RLS. This client is used only for read tools
// (SELECT), never for inserts/updates/deletes — all mutations go through the
// n8n action endpoints so role checks, audit logging, and business
// validation stay centralized in one place.
export const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
