import client from './client';

export async function listMeetings(params = {}) {
  try {
    const response = await client.get('/api/meetings', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getTranscript(id, spaceId) {
  try {
    const response = await client.get(`/api/meetings/${id}/transcript`, {
      params: { spaceId },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function summarizeMeeting(id, payload) {
  try {
    const response = await client.post(`/api/meetings/${id}/summarize`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export default {
  listMeetings,
  getTranscript,
  summarizeMeeting,
};
