import client from './client';

export async function getAllTasks(params = {}) {
  try {
    const response = await client.get('/api/tasks', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function createTask(payload) {
  try {
    const response = await client.post('/api/tasks', payload);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateTask(id, payload) {
  try {
    const response = await client.patch(`/api/tasks/${id}`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteTask(id) {
  try {
    const response = await client.delete(`/api/tasks/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function extractFromEmail(payload) {
  try {
    const response = await client.post('/api/tasks/extract-from-email', payload);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export default {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  extractFromEmail,
};
