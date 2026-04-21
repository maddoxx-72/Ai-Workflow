const axios = require('axios');

async function sendViaPingbix(to, body) {
  const res = await axios.post(
    'https://api.pingbix.com/v1/messages/send',
    { apiKey: process.env.PINGBIX_API_KEY, to, type: 'text', text: { body } },
    { headers: { 'Content-Type': 'application/json' } },
  );

  return {
    provider: 'pingbix',
    messageId: res.data?.messageId,
    status: res.data?.status,
    to,
    body,
  };
}

async function sendWhatsApp(to, body) {
  return sendViaPingbix(to, body);
}

async function notifyTaskAssigned({ task, assigneePhone, assigneeName }) {
  const body =
    `New task assigned in Synapse OS.\n\n` +
    `Hi ${assigneeName},\n` +
    `Task: ${task.title}\n` +
    `Priority: ${task.priority?.toUpperCase()}\n` +
    `Due: ${task.dueDate || 'No deadline'}\n\n` +
    `Open Synapse OS to review the details.`;

  return sendWhatsApp(assigneePhone, body);
}

async function notifyTaskCompleted({ task, managerPhone, completedByName }) {
  const body =
    `Task completed in Synapse OS.\n\n` +
    `${task.title} was marked complete by ${completedByName}.\n` +
    `Completed at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

  return sendWhatsApp(managerPhone, body);
}

async function notifyUrgentEmail({ emailSubject, fromEmail, assigneePhone }) {
  const body =
    `Urgent email alert in Synapse OS.\n\n` +
    `Subject: ${emailSubject}\n` +
    `From: ${fromEmail}\n\n` +
    `Check the AI Inbox immediately.`;

  return sendWhatsApp(assigneePhone, body);
}

module.exports = {
  sendWhatsApp,
  sendViaPingbix,
  notifyTaskAssigned,
  notifyTaskCompleted,
  notifyUrgentEmail,
};
