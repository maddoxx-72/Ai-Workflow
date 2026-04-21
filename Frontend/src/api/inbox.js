import client from './client';

export async function listEmails(params = {}) {
  try {
    const response = await client.get('/api/inbox', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getEmail(id) {
  try {
    const response = await client.get(`/api/inbox/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function sendEmail(payload) {
  try {
    const response = await client.post('/api/inbox/send', payload);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function draftReply(payload) {
  try {
    const response = await client.post('/api/inbox/draft-reply', payload);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export default {
  listEmails,
  getEmail,
  sendEmail,
  draftReply,
};
