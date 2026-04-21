import client from './client';

export async function sendMessage(payload) {
  try {
    const response = await client.post('/api/whatsapp/send', payload);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export default {
  sendMessage,
};
