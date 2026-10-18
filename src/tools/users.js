import { z } from 'zod';
import { callPortalAction } from '../n8nClient.js';
import { withErrorHandling } from '../toolHelpers.js';

// All three tools call the existing n8n endpoints (not raw Supabase writes)
// so role checks, audit logging, and the approved-worker-becomes-active
// business rules stay enforced in one place. Requires MCP_ACTOR_PROFILE_ID
// to be an active, approved profile with role >= pengurus.

export function registerUserTools(server) {
  server.tool(
    'list_pending_users',
    'List users awaiting approval (self-registered via Google, not yet given a role/unit). Min role: pengurus.',
    {},
    withErrorHandling(async () => callPortalAction('users/pending', {}))
  );

  server.tool(
    'approve_user',
    'Approve a pending user: assign role and unit, activating their account. Min role: pengurus (admin required to assign pengurus/bendahara/admin roles).',
    {
      profile_id: z.string().uuid(),
      role: z.enum(['warga', 'pengurus', 'bendahara', 'admin']),
      unit_id: z.number().int().nullable().optional()
        .describe('Required when role is "warga"'),
      full_name: z.string().optional(),
      phone: z.string().optional(),
      occupancy_status: z.enum(['owner_occupied', 'owner_vacant', 'owner_rented', 'tenant', 'unknown']).optional(),
      approval_note: z.string().default(''),
    },
    withErrorHandling((args) => callPortalAction('users/approve', args))
  );

  server.tool(
    'reject_user',
    'Reject a pending user registration with a reason. Min role: pengurus.',
    {
      profile_id: z.string().uuid(),
      approval_note: z.string().min(1, 'approval_note is required when rejecting'),
    },
    withErrorHandling((args) => callPortalAction('users/reject', args))
  );
}
