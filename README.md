# Portal Warga MCP

MCP (Model Context Protocol) server exposing [Portal Warga Palm Village](https://github.com/kodok-ijho/PortalWarga) data and a few admin actions as tools, for use from Claude Desktop/Code via stdio.

## Architecture

- **Read tools** (`list_residents`, `list_units`, `list_ipl_bills`, `list_payments`) query Supabase directly with the service role key. They only ever `SELECT` — no inserts/updates/deletes happen through this path.
- **Action/report tools** (`list_pending_users`, `approve_user`, `reject_user`, `get_running_balance`, `get_monthly_finance_report`) call the production app's own Vercel proxy (`POST {APP_BASE_URL}/api/n8n/:path`), the same route the frontend uses. This reuses the app's existing role-check, approval-state, and audit-log logic instead of re-implementing it here.
- To authenticate with the proxy, this server mints a short-lived (5 min) HS256 **App JWT** per call (`src/jwt.js`), signed with the same secret as n8n's `PV App JWT` credential, with `sub` set to `MCP_ACTOR_PROFILE_ID`. n8n re-checks that profile's role/approval state server-side on every call — this server does not bypass that.

```
Claude Desktop/Code
  │ stdio
  ▼
portalwarga-mcp (this repo)
  ├── read tools  → Supabase (service role key, SELECT only)
  └── action tools → https://portal-warga.vercel.app/api/n8n/:path → n8n → Supabase
```

## Setup

1. `npm install`
2. `cp .env.example .env` and fill in:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — from the Supabase project dashboard (Settings → API). Service role, not anon — treat as a full-access secret.
   - `APP_BASE_URL` — the production Vercel domain (default assumes `https://portal-warga.vercel.app`; confirm this is still correct).
   - `N8N_APP_JWT_SECRET` — the HS256 secret behind n8n's `PV App JWT` credential. Get this from whoever administers the n8n instance; it is **not** in this repo or the main app repo.
   - `MCP_ACTOR_PROFILE_ID` — the `profiles.id` (UUID) this server acts as for write actions. Must be an active, `approved` profile with role `pengurus` or higher (use `admin` to unlock all action tools).
3. Register with your MCP client. Example for Claude Desktop (`claude_desktop_config.json`):

   ```json
   {
     "mcpServers": {
       "portalwarga": {
         "command": "node",
         "args": ["/absolute/path/to/portalwarga-mcp/src/index.js"],
         "env": {
           "SUPABASE_URL": "...",
           "SUPABASE_SERVICE_ROLE_KEY": "...",
           "APP_BASE_URL": "https://portal-warga.vercel.app",
           "N8N_APP_JWT_SECRET": "...",
           "MCP_ACTOR_PROFILE_ID": "..."
         }
       }
     }
   }
   ```

   For Claude Code, add it as a project or user MCP server pointing at the same command/args.

## Tools

| Tool | Type | Min role | Notes |
| --- | --- | --- | --- |
| `list_residents` | read | — | Direct Supabase |
| `list_units` | read | — | Direct Supabase |
| `list_ipl_bills` | read | — | Direct Supabase |
| `list_payments` | read | — | Direct Supabase |
| `list_pending_users` | read | pengurus | Via n8n |
| `approve_user` | action | pengurus (admin for elevated roles) | Via n8n, writes audit log |
| `reject_user` | action | pengurus | Via n8n, writes audit log |
| `get_running_balance` | read | pengurus | Via n8n |
| `get_monthly_finance_report` | read | pengurus | Via n8n |

## Known gaps / not implemented

- **Ad-hoc payment reminders**: the main app only has *scheduled* n8n jobs (`PV JOB - Payment Reminder`, `PV JOB - Overdue Reminder`), not an on-demand webhook for "send a reminder to this one resident now". A reminder tool would need a new n8n webhook workflow first — out of scope until that exists.
- Enum values (`bill_status`, `payment_status`, etc.) are taken from the schema as of the migration in `supabase/migrations/202607080001_initial_production_schema.sql` in the main repo at the time this was written. If the schema changes, update the `z.enum([...])` lists in `src/tools/*.js` accordingly.

## Security notes

- `.env` is gitignored. Never commit real credentials.
- The Supabase service role key bypasses Row Level Security entirely — this server is meant to run locally under your own control (stdio transport), not deployed as a shared remote service, without revisiting this design.
- The minted App JWT is short-lived and generated fresh per call, not cached, so nothing long-lived needs to be stored beyond the signing secret itself.
