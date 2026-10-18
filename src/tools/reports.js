import { z } from 'zod';
import { callPortalAction } from '../n8nClient.js';
import { withErrorHandling } from '../toolHelpers.js';

export function registerReportTools(server) {
  server.tool(
    'get_running_balance',
    'Monthly running balance (cash flow chain with opening/closing balance) up to the given month. Min role: pengurus.',
    {
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
    },
    withErrorHandling(({ year, month }) => callPortalAction('reports/running-balance', { year, month }))
  );

  server.tool(
    'get_monthly_finance_report',
    'Detailed monthly finance report: bills, collection rate, expenses, and cash payments for one month. Min role: pengurus.',
    {
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
    },
    withErrorHandling(({ year, month }) => callPortalAction('reports/monthly-finance', { year, month }))
  );
}
