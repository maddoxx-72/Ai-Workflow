import client from './client';

export async function getCurrentUser() {
  try {
    const response = await client.get('/api/auth/me');
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function logout() {
  try {
    const response = await client.post('/api/auth/logout');
    return response.data;
  } catch (error) {
    throw error;
  }
}

export default {
  getCurrentUser,
  logout,
};
