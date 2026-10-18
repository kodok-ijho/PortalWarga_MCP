import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

export const config = {
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  appBaseUrl: (process.env.APP_BASE_URL || 'https://portal-warga.vercel.app').replace(/\/+$/, ''),
  n8nAppJwtSecret: required('N8N_APP_JWT_SECRET'),
  actorProfileId: required('MCP_ACTOR_PROFILE_ID'),
  actorEmail: process.env.MCP_ACTOR_EMAIL || null,
};
