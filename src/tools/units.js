import { z } from 'zod';
import { supabase } from '../supabaseClient.js';
import { withErrorHandling } from '../toolHelpers.js';

export function registerUnitTools(server) {
  server.tool(
    'list_units',
    'List housing units/houses with block, occupancy status, and size. Read-only, direct Supabase query.',
    {
      block: z.string().optional().describe('Filter by block code, e.g. "CB1"'),
      occupancy_status: z.string().optional().describe('Filter by occupancy_status value'),
      limit: z.number().int().min(1).max(500).default(100),
    },
    withErrorHandling(async ({ block, occupancy_status, limit }) => {
      let query = supabase
        .from('units')
        .select('id, block, unit_number, floor, size, occupancy_status, is_occupied, notes')
        .order('block', { ascending: true })
        .order('unit_number', { ascending: true })
        .limit(limit);

      if (block) query = query.eq('block', block);
      if (occupancy_status) query = query.eq('occupancy_status', occupancy_status);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    })
  );
}
