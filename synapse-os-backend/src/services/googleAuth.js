const { google } = require("googleapis");
const database = require("./database");

/**
 * Google OAuth2 Service
 * Handles the full OAuth2 flow for Gmail, Drive, and Calendar (Meet) access.
 * Each user authenticates once and their tokens are stored server-side.
 */

// Scopes needed across all Synapse OS modules
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/meetings.space.readonly",
  "openid",
  "email",
  "profile",
];

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Step 1: Generate the Google consent URL to redirect users to
 */
function getAuthUrl(state = "") {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",   // get refresh_token
    prompt: "consent",        // force consent to always get refresh_token
    scope: SCOPES,
    state,
  });
}

/**
 * Step 2: Exchange the auth code for tokens after redirect
 */
async function exchangeCodeForTokens(code) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

/**
 * Step 3: Get an authenticated OAuth2 client for a user
 * Automatically refreshes expired access tokens
 */
async function getAuthenticatedClient(userId) {
  const tokens = database.getOAuthTokens(userId);
  if (!tokens) {
    throw new Error(`No Google tokens found for user ${userId}. Please re-authenticate.`);
  }

  const client = createOAuthClient();
  client.setCredentials(tokens);

  // Auto-refresh if token is expired or expiring in the next 5 minutes
  const expiresIn = tokens.expiry_date - Date.now();
  if (expiresIn < 5 * 60 * 1000) {
    const { credentials } = await client.refreshAccessToken();
    saveTokens(userId, credentials);
    client.setCredentials(credentials);
  }

  return client;
}

/**
 * Save (or update) tokens for a user
 */
function saveTokens(userId, tokens) {
  database.saveOAuthTokens(userId, tokens);
}

/**
 * Get stored user info from the ID token
 */
async function getUserInfo(tokens) {
  const client = createOAuthClient();
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();
  return data; // { id, email, name, picture }
}

module.exports = {
  getAuthUrl,
  exchangeCodeForTokens,
  getAuthenticatedClient,
  saveTokens,
  getUserInfo,
};
