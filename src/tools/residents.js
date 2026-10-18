import { z } from 'zod';
import { supabase } from '../supabaseClient.js';
import { withErrorHandling } from '../toolHelpers.js';

export function registerResidentTools(server) {
  server.tool(
    'list_residents',
    'List resident profiles (warga) with their unit, role, and approval state. Read-only, direct Supabase query.',
    {
      role: z.enum(['warga', 'pengurus', 'bendahara', 'admin']).optional()
        .describe('Filter by role'),
      approval_status: z.enum(['pending_approval', 'approved', 'rejected']).optional()
        .describe('Filter by approval state'),
      unit_id: z.number().int().optional().describe('Filter by unit id'),
      search: z.string().optional().describe('Case-insensitive match against full_name or email'),
      limit: z.number().int().min(1).max(200).default(50),
    },
    withErrorHandling(async ({ role, approval_status, unit_id, search, limit }) => {
      let query = supabase
        .from('profiles')
        .select('id, email, full_name, phone, role, unit_id, approval_status, is_active, last_login_at, units(block, unit_number)')
        .order('full_name', { ascending: true })
        .limit(limit);

      if (role) query = query.eq('role', role);
      if (approval_status) query = query.eq('approval_status', approval_status);
      if (unit_id) query = query.eq('unit_id', unit_id);
      if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    })
  );
}
