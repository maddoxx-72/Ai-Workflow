import client from './client';

export async function getDashboardStats() {
  try {
    const response = await client.get('/api/analytics');
    return response.data;
  } catch (error) {
    throw error;
  }
}

export default {
  getDashboardStats,
};
