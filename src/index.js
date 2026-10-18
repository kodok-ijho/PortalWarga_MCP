#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import './config.js'; // fails fast with a clear message if env vars are missing
import { registerResidentTools } from './tools/residents.js';
import { registerUnitTools } from './tools/units.js';
import { registerBillTools } from './tools/bills.js';
import { registerPaymentTools } from './tools/payments.js';
import { registerUserTools } from './tools/users.js';
import { registerReportTools } from './tools/reports.js';

const server = new McpServer({ name: 'portalwarga-mcp', version: '0.1.0' });

registerResidentTools(server);
registerUnitTools(server);
registerBillTools(server);
registerPaymentTools(server);
registerUserTools(server);
registerReportTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
