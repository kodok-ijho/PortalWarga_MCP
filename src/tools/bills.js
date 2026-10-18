import { z } from 'zod';
import { supabase } from '../supabaseClient.js';
import { withErrorHandling } from '../toolHelpers.js';

export function registerBillTools(server) {
  server.tool(
    'list_ipl_bills',
    'List IPL (monthly dues) bills with unit, resident, amount, and status. Read-only, direct Supabase query.',
    {
      period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional()
        .describe('Billing period YYYY-MM, e.g. "2026-07"'),
      unit_id: z.number().int().optional(),
      status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional()
        .describe('Bill status filter (check actual enum values if this errors)'),
      limit: z.number().int().min(1).max(500).default(100),
    },
    withErrorHandling(async ({ period, unit_id, status, limit }) => {
      let query = supabase
        .from('ipl_bills')
        .select('id, unit_id, resident_id, period, amount, late_fee, due_date, status, payment_id, units(block, unit_number), profiles:resident_id(full_name, email)')
        .order('period', { ascending: false })
        .limit(limit);

      if (period) query = query.eq('period', period);
      if (unit_id) query = query.eq('unit_id', unit_id);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    })
  );
}
