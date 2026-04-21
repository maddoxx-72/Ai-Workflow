import client from './client';

export async function listFiles(params = {}) {
  try {
    const response = await client.get('/api/drive/files', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function searchFiles(params = {}) {
  try {
    const response = await client.get('/api/drive/search', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function executeQuery(query) {
  try {
    const response = await client.post('/api/drive/execute', { query });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export default {
  listFiles,
  searchFiles,
  executeQuery,
};
