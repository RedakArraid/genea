/**
 * Client HTTP OpenWA — envoi WhatsApp et statut de session.
 */

const { getEffectiveOpenWaConfig } = require('./openWaSettings');

function phoneToChatId(phoneE164) {
  const digits = String(phoneE164 || '').replace(/\D/g, '');
  if (!digits) throw new Error('Numéro de téléphone invalide');
  return `${digits}@c.us`;
}

async function openWaFetch(path, { method = 'GET', body } = {}) {
  const config = await getEffectiveOpenWaConfig();
  if (!config.baseUrl || !config.apiKey) {
    throw new Error('OpenWA non configuré');
  }

  const url = `${config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      (typeof data === 'object' && data?.message) ||
      (typeof data === 'string' && data) ||
      `OpenWA HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

async function getSessionStatus() {
  const config = await getEffectiveOpenWaConfig();
  if (!config.sessionId) {
    throw new Error('Session OpenWA non configurée');
  }

  const session = await openWaFetch(`/sessions/${encodeURIComponent(config.sessionId)}`);
  return {
    id: session.id,
    name: session.name,
    status: session.status,
    phone: session.phone || null,
    pushName: session.pushName || null,
    connected: session.status === 'ready',
    lastError: session.lastError || null,
    connectedAt: session.connectedAt || null,
    lastActive: session.lastActive || null,
  };
}

async function sendTextMessage(phoneE164, text) {
  const config = await getEffectiveOpenWaConfig();
  if (!config.sessionId) {
    throw new Error('Session OpenWA non configurée');
  }

  const chatId = phoneToChatId(phoneE164);
  return openWaFetch(
    `/sessions/${encodeURIComponent(config.sessionId)}/messages/send-text`,
    {
      method: 'POST',
      body: { chatId, text },
    },
  );
}

async function pingOpenWa() {
  const config = await getEffectiveOpenWaConfig();
  if (!config.baseUrl || !config.apiKey) {
    throw new Error('OpenWA non configuré');
  }
  await openWaFetch('/health');
  return true;
}

module.exports = {
  phoneToChatId,
  getSessionStatus,
  sendTextMessage,
  pingOpenWa,
};
