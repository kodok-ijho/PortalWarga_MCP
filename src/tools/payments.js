import { z } from 'zod';
import { supabase } from '../supabaseClient.js';
import { withErrorHandling } from '../toolHelpers.js';

export function registerPaymentTools(server) {
  server.tool(
    'list_payments',
    'List payment records with method, status, and linked bill/resident. Read-only, direct Supabase query.',
    {
      status: z.enum([
        'draft', 'pending', 'pending_verification', 'completed',
        'failed', 'expired', 'cancelled', 'refunded', 'rejected',
      ]).optional(),
      method: z.enum(['qris', 'bank_transfer', 'cash', 'other']).optional(),
      ipl_bill_id: z.string().uuid().optional(),
      resident_id: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(500).default(100),
    },
    withErrorHandling(async ({ status, method, ipl_bill_id, resident_id, limit }) => {
      let query = supabase
        .from('payments')
        .select(`
          id, ipl_bill_id, resident_id, amount, method, status,
          order_id, paid_at, verified_at, verification_note, created_at,
          profiles:resident_id(full_name, email),
          ipl_bills(period, unit_id, units(block, unit_number))
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) query = query.eq('status', status);
      if (method) query = query.eq('method', method);
      if (ipl_bill_id) query = query.eq('ipl_bill_id', ipl_bill_id);
      if (resident_id) query = query.eq('resident_id', resident_id);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    })
  );
}
