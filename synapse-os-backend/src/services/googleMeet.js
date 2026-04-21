const { google } = require("googleapis");
const { getAuthenticatedClient } = require("./googleAuth");

const MEET_API_BASE_URL = "https://meet.googleapis.com/v2";

async function listMeetings(userId, daysBack = 30, daysAhead = 30) {
  const auth = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: "v3", auth });

  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - daysBack);
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + daysAhead);

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 100,
    fields: "items(id,summary,description,location,start,end,status,attendees,hangoutLink,conferenceData,htmlLink)",
  });

  return (res.data.items || [])
    .filter((event) => hasMeetLink(event))
    .map((event) => normalizeMeeting(event));
}

async function getMeetingById(userId, eventId) {
  const auth = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.get({
    calendarId: "primary",
    eventId,
  });

  return normalizeMeeting(res.data);
}

async function getMeetingTranscript(userId, meetingCode) {
  if (!meetingCode) {
    return {
      available: false,
      utterances: [],
      rawText: "",
      reason: "Meeting code is required.",
    };
  }

  try {
    const auth = await getAuthenticatedClient(userId);
    const accessToken = await resolveAccessToken(auth);
    const conferenceRecord = await getConferenceRecord(accessToken, meetingCode);

    if (!conferenceRecord) {
      return {
        available: false,
        utterances: [],
        rawText: "",
        reason: "No completed conference record was found for this meeting yet.",
      };
    }

    const transcript = await getLatestTranscript(accessToken, conferenceRecord.name);

    if (!transcript) {
      return {
        available: false,
        utterances: [],
        rawText: "",
        reason: "Transcript is not available for this meeting.",
      };
    }

    const entriesResponse = await fetchGoogleJson(
      `${MEET_API_BASE_URL}/${transcript.name}/entries?pageSize=100`,
      accessToken
    );
    const utterances = (entriesResponse.transcriptEntries || []).map((entry) => ({
      speaker: entry.participant || "Unknown",
      text: entry.text,
      startTime: entry.startTime,
      endTime: entry.endTime,
    }));
    const rawText = utterances.map((utterance) => `${utterance.speaker}: ${utterance.text}`).join("\n");

    return {
      available: utterances.length > 0,
      utterances,
      rawText,
      reason: utterances.length > 0 ? null : "Transcript entries are not available yet.",
    };
  } catch (error) {
    return {
      available: false,
      utterances: [],
      rawText: "",
      reason: error.message || "Unable to load transcript from Google Meet.",
    };
  }
}

async function resolveAccessToken(authClient) {
  const accessTokenResponse = await authClient.getAccessToken();

  if (typeof accessTokenResponse === "string" && accessTokenResponse) {
    return accessTokenResponse;
  }

  if (accessTokenResponse?.token) {
    return accessTokenResponse.token;
  }

  if (authClient.credentials?.access_token) {
    return authClient.credentials.access_token;
  }

  throw new Error("Unable to retrieve a Google access token. Re-authenticate and try again.");
}

async function getConferenceRecord(accessToken, meetingCode) {
  const response = await fetchGoogleJson(
    `${MEET_API_BASE_URL}/conferenceRecords?filter=${encodeURIComponent(`space.meeting_code = "${meetingCode}"`)}&pageSize=10`,
    accessToken
  );
  const records = response.conferenceRecords || [];

  return records
    .slice()
    .sort((left, right) => new Date(right.startTime || 0) - new Date(left.startTime || 0))[0] || null;
}

async function getLatestTranscript(accessToken, conferenceRecordName) {
  const response = await fetchGoogleJson(
    `${MEET_API_BASE_URL}/${conferenceRecordName}/transcripts?pageSize=10`,
    accessToken
  );
  const transcripts = response.transcripts || [];

  return transcripts
    .slice()
    .sort((left, right) => new Date(right.startTime || 0) - new Date(left.startTime || 0))[0] || null;
}

async function fetchGoogleJson(url, accessToken) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  const body = await response.text();

  if (!body) {
    return {};
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    throw new Error("Google Meet API returned a non-JSON response. Re-authenticate after enabling Meet transcript access.");
  }

  if (!response.ok) {
    const message =
      parsedBody.error?.message ||
      parsedBody.error_description ||
      `Google Meet API request failed with status ${response.status}`;
    throw new Error(message);
  }

  return parsedBody;
}

function hasMeetLink(event) {
  return Boolean(findMeetLink(event));
}

function normalizeMeeting(event) {
  const participants = (event.attendees || []).map((attendee) => ({
    name: attendee.displayName || attendee.email,
    email: attendee.email,
    organizer: attendee.organizer || false,
  }));
  const meetLink = findMeetLink(event);
  const meetingCode = extractMeetingCode(meetLink);

  return {
    id: event.id,
    title: event.summary || "Untitled Meeting",
    description: event.description || "",
    startTime: event.start?.dateTime || event.start?.date,
    endTime: event.end?.dateTime || event.end?.date,
    status: event.status,
    participants,
    htmlLink: event.htmlLink || null,
    meetLink,
    meetingCode,
    spaceId: meetingCode,
    hasTranscript: false,
  };
}

function findMeetLink(event) {
  return (
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find((entryPoint) => entryPoint.entryPointType === "video")?.uri ||
    extractMeetLink(event.description) ||
    extractMeetLink(event.location) ||
    null
  );
}

function extractMeetLink(value = "") {
  const match = value.match(/https?:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:\?[^\s]+)?/i);
  return match?.[0] || null;
}

function extractMeetingCode(meetLink) {
  if (!meetLink) {
    return null;
  }

  return meetLink.split("/").pop().split("?")[0];
}

module.exports = {
  listMeetings,
  getMeetingById,
  getMeetingTranscript,
};
