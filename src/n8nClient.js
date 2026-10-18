import { config } from './config.js';
import { mintActorJwt } from './jwt.js';

// Calls the same proxy the frontend uses (POST /api/n8n/:path -> n8n webhook
// portal-v1/:path), so this server never needs n8n's basic-auth transport
// credentials directly. The proxy forwards our Authorization bearer as the
// App JWT the n8n workflow checks for role/approval state.
export async function callPortalAction(path, payload) {
  const token = mintActorJwt();
  const url = `${config.appBaseUrl}/api/n8n/${path}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload ?? {}),
  });

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Non-JSON response from ${path} (HTTP ${response.status}): ${text.slice(0, 500)}`);
  }

  if (!response.ok || body?.ok === false) {
    const err = body?.error;
    throw new Error(err ? `${err.code}: ${err.message}` : `HTTP ${response.status} calling ${path}`);
  }

  return body.data;
}
