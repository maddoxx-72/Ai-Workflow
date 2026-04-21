import client from './client';

export async function formatReport(rawContent) {
  try {
    const response = await client.post('/api/reports/format', { rawContent });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function sendReport(payload) {
  try {
    const response = await client.post('/api/reports/send', payload);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export default {
  formatReport,
  sendReport,
};
