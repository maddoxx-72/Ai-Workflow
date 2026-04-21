const express = require('express');
const { authenticate } = require('../middleware/auth');
const database = require('../services/database');

const router = express.Router();

router.get('/config', authenticate, (req, res) => {
  const webhookConfig = resolveWebhookConfig(req);
  const recentEvents = database.listWebhookEvents('pingbix', 5);

  res.json({
    ...webhookConfig,
    eventCount: database.getWebhookEventCount('pingbix'),
    recentEvents,
    lastEventAt: recentEvents[0]?.createdAt || null,
  });
});

router.post('/pingbix', (req, res) => {
  database.saveWebhookEvent({
    provider: 'pingbix',
    eventType: req.body?.eventType || req.body?.type || req.body?.event || 'unknown',
    payload: req.body,
  });

  res.status(200).json({ received: true });
});

function resolveWebhookConfig(req) {
  const configuredUrl = getConfiguredWebhookUrl(req);
  const warnings = [];

  if (process.env.PINGBIX_WEBHOOK_URL && !looksLikeSynapseWebhook(process.env.PINGBIX_WEBHOOK_URL)) {
    warnings.push('PINGBIX_WEBHOOK_URL should point to your Synapse callback endpoint, not the Pingbix API URL.');
  }

  if (configuredUrl && isLocalhostUrl(configuredUrl)) {
    warnings.push('The webhook URL is local-only. Use BACKEND_PUBLIC_URL or a public tunnel so Pingbix can reach it.');
  }

  if (!configuredUrl) {
    warnings.push('Set BACKEND_PUBLIC_URL or PINGBIX_WEBHOOK_URL to a public /api/webhooks/pingbix callback URL.');
  }

  return {
    provider: 'pingbix',
    configured: Boolean(configuredUrl && !isLocalhostUrl(configuredUrl)),
    webhookUrl: configuredUrl,
    warnings,
  };
}

function getConfiguredWebhookUrl(req) {
  const explicitWebhookUrl = normalizeUrl(process.env.PINGBIX_WEBHOOK_URL);
  const backendPublicUrl = normalizeUrl(process.env.BACKEND_PUBLIC_URL);
  const requestDerivedUrl = req.get('host')
    ? `${req.protocol}://${req.get('host')}/api/webhooks/pingbix`
    : null;

  if (looksLikeSynapseWebhook(explicitWebhookUrl)) {
    return explicitWebhookUrl;
  }

  if (backendPublicUrl) {
    return `${trimTrailingSlash(backendPublicUrl)}/api/webhooks/pingbix`;
  }

  return requestDerivedUrl;
}

function normalizeUrl(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function looksLikeSynapseWebhook(value) {
  return Boolean(value && /\/api\/webhooks\/pingbix\/?$/i.test(value));
}

function isLocalhostUrl(value) {
  return /localhost|127\.0\.0\.1/i.test(value || '');
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

module.exports = router;
