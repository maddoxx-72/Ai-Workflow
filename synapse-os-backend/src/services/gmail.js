const { google } = require("googleapis");
const { getAuthenticatedClient } = require("./googleAuth");

/**
 * Gmail Service
 * Powers the AI Team Inbox module.
 */

/**
 * List recent emails in the inbox
 * @param {string} userId
 * @param {number} maxResults - number of emails to fetch (default 20)
 * @param {string} query - Gmail search query (e.g. "is:unread", "from:client@company.com")
 */
async function listEmails(userId, maxResults = 20, query = "") {
  const auth = await getAuthenticatedClient(userId);
  const gmail = google.gmail({ version: "v1", auth });

  const listRes = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: query || "in:inbox",
  });

  const messages = listRes.data.messages || [];
  if (messages.length === 0) return [];

  // Fetch full details for each message in parallel
  const emails = await Promise.all(
    messages.map((msg) => getEmailById(userId, msg.id, gmail))
  );

  return emails;
}

/**
 * Get a single email by ID with parsed body
 */
async function getEmailById(userId, messageId, gmailClient = null) {
  const auth = gmailClient || (await getAuthenticatedClient(userId));
  const gmail = gmailClient
    ? { users: { messages: { get: gmailClient.users.messages.get.bind(gmailClient.users.messages) } } }
    : google.gmail({ version: "v1", auth });

  // Re-init properly if no gmailClient passed
  const client = google.gmail({ version: "v1", auth: await getAuthenticatedClient(userId) });

  const { data } = await client.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  return parseEmailMessage(data);
}

/**
 * Send an email on behalf of the user
 */
async function sendEmail(userId, { to, subject, body, replyToMessageId = null }) {
  const auth = await getAuthenticatedClient(userId);
  const gmail = google.gmail({ version: "v1", auth });

  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ];

  const raw = Buffer.from(emailLines.join("\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const params = { userId: "me", requestBody: { raw } };
  if (replyToMessageId) {
    params.requestBody.threadId = replyToMessageId;
  }

  const res = await gmail.users.messages.send(params);
  return res.data;
}

/**
 * Parse raw Gmail message into a clean object
 */
function parseEmailMessage(data) {
  const headers = data.payload?.headers || [];
  const getHeader = (name) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  const subject = getHeader("Subject");
  const from = getHeader("From");
  const to = getHeader("To");
  const date = getHeader("Date");
  const threadId = data.threadId;

  // Extract plain text body
  let body = "";
  const parts = data.payload?.parts || [];

  const findBody = (parts) => {
    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64").toString("utf-8");
      }
      if (part.parts) {
        const nested = findBody(part.parts);
        if (nested) return nested;
      }
    }
    return "";
  };

  if (data.payload?.body?.data) {
    body = Buffer.from(data.payload.body.data, "base64").toString("utf-8");
  } else {
    body = findBody(parts);
  }

  return {
    id: data.id,
    threadId,
    subject,
    from,
    to,
    date,
    snippet: data.snippet,
    body: body.trim(),
    labelIds: data.labelIds || [],
    isUnread: (data.labelIds || []).includes("UNREAD"),
  };
}

module.exports = {
  listEmails,
  getEmailById,
  sendEmail,
};
