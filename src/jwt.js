import jwt from 'jsonwebtoken';
import { config } from './config.js';

const ISSUER = 'portal-palm-village';
const AUDIENCE = 'portal-palm-village-web';
const EXPIRES_IN_SECONDS = 5 * 60;

// Mirrors the App JWT contract n8n's "PV UTIL - Verify App JWT" pattern
// expects (see docs/production/N8N_APP_JWT_VERIFICATION.md in the main repo):
// iss/aud fixed, sub = profiles.id, short-lived so nothing long-lived sits
// in this process's memory or env.
export function mintActorJwt() {
  return jwt.sign(
    { iss: ISSUER, aud: AUDIENCE, sub: config.actorProfileId },
    config.n8nAppJwtSecret,
    { algorithm: 'HS256', expiresIn: EXPIRES_IN_SECONDS }
  );
}
