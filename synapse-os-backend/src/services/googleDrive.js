const { google } = require("googleapis");
const { getAuthenticatedClient } = require("./googleAuth");

/**
 * Google Drive Service
 * Powers the Smart Data Gateway module.
 * Supports natural language queries (with AI pre-processing) and direct search.
 */

/**
 * Search files in Drive using a query string
 * @param {string} userId
 * @param {string} query - plain text search term (filename or content keywords)
 * @param {number} maxResults
 */
async function searchFiles(userId, query, maxResults = 10) {
  const auth = await getAuthenticatedClient(userId);
  const drive = google.drive({ version: "v3", auth });

  // Build Drive query: search in name and full text
  const driveQuery = `fullText contains '${query}' or name contains '${query}'`;

  const res = await drive.files.list({
    q: `${driveQuery} and trashed = false`,
    pageSize: maxResults,
    fields: "files(id, name, mimeType, owners, webViewLink, modifiedTime, size, parents)",
    orderBy: "modifiedTime desc",
  });

  const files = res.data.files || [];
  return files.map(normalizeFile);
}

/**
 * List all files accessible to the user (used for the "Indexed Global Files" view)
 * @param {string} userId
 * @param {number} maxResults
 */
async function listAllFiles(userId, maxResults = 50) {
  const auth = await getAuthenticatedClient(userId);
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.list({
    q: "trashed = false",
    pageSize: maxResults,
    fields: "files(id, name, mimeType, owners, webViewLink, modifiedTime, size)",
    orderBy: "modifiedTime desc",
  });

  return (res.data.files || []).map(normalizeFile);
}

/**
 * Get a specific file's metadata by ID
 */
async function getFileById(userId, fileId) {
  const auth = await getAuthenticatedClient(userId);
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, owners, webViewLink, modifiedTime, size, permissions",
  });

  return normalizeFile(res.data);
}

/**
 * Get a shareable link for a file (or check if one exists)
 * Used when AI wants to "send a file to the client"
 */
async function getShareableLink(userId, fileId) {
  const auth = await getAuthenticatedClient(userId);
  const drive = google.drive({ version: "v3", auth });

  // Check existing permissions
  const permsRes = await drive.permissions.list({ fileId });
  const alreadyPublic = (permsRes.data.permissions || []).some(
    (p) => p.type === "anyone"
  );

  if (!alreadyPublic) {
    // Grant anyone-with-link read access
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });
  }

  const fileRes = await drive.files.get({
    fileId,
    fields: "webViewLink, name",
  });

  return {
    fileId,
    name: fileRes.data.name,
    shareableLink: fileRes.data.webViewLink,
  };
}

/**
 * Normalize Drive API file object into a clean shape for the frontend
 */
function normalizeFile(file) {
  return {
    id: file.id,
    name: file.name,
    type: getMimeLabel(file.mimeType),
    mimeType: file.mimeType,
    owner: file.owners?.[0]?.displayName || "Unknown",
    ownerEmail: file.owners?.[0]?.emailAddress || "",
    link: file.webViewLink || null,
    modifiedAt: file.modifiedTime || null,
    size: file.size ? `${Math.round(file.size / 1024)} KB` : null,
  };
}

function getMimeLabel(mimeType) {
  const map = {
    "application/vnd.google-apps.document": "Google Doc",
    "application/vnd.google-apps.spreadsheet": "Google Sheet",
    "application/vnd.google-apps.presentation": "Google Slides",
    "application/pdf": "PDF",
    "image/png": "Image",
    "image/jpeg": "Image",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  };
  return map[mimeType] || "File";
}

module.exports = {
  searchFiles,
  listAllFiles,
  getFileById,
  getShareableLink,
};
