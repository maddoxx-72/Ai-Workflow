import client from './client';

export async function getWebhookConfig() {
  try {
    const response = await client.get('/api/webhooks/config');
    return response.data;
  } catch (error) {
    throw error;
  }
}

export default {
  getWebhookConfig,
};
