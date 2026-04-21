const axios = require("axios");

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

function getApiKey() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  return process.env.GROQ_API_KEY;
}

async function createChatCompletion({ systemInstruction, userPrompt, maxTokens = 1024 }) {
  const response = await axios.post(
    GROQ_CHAT_COMPLETIONS_URL,
    {
      model: MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
    },
    {
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data?.choices?.[0]?.message?.content?.trim() || "";
}

function parseJsonContent(content, fallback) {
  if (!content) {
    return fallback;
  }

  try {
    return JSON.parse(content);
  } catch {
    const candidates = [
      { start: content.indexOf("["), end: content.lastIndexOf("]") },
      { start: content.indexOf("{"), end: content.lastIndexOf("}") },
    ]
      .filter(({ start, end }) => start >= 0 && end > start)
      .sort((left, right) => left.start - right.start);

    for (const candidate of candidates) {
      try {
        return JSON.parse(content.slice(candidate.start, candidate.end + 1));
      } catch {
        continue;
      }
    }

    return fallback;
  }
}

async function extractTasksFromEmail(emailContent, participants = []) {
  const participantList = participants.length
    ? `\nKnown participants: ${participants.join(", ")}`
    : "";

  const content = await createChatCompletion({
    systemInstruction: "You are the task extraction engine for Synapse OS. Return valid JSON only.",
    maxTokens: 1024,
    userPrompt: `Extract all action items and tasks from the following email thread. For each task:
- Identify WHO it is assigned to (use their name if mentioned)
- Determine PRIORITY: urgent / high / medium / low
- Set a reasonable DUE DATE if mentioned, or suggest one based on context
- Write a clear TITLE and SHORT DESCRIPTION

Return ONLY a JSON array. No markdown, no explanation.
${participantList}

Email Thread:
---
${emailContent}
---

Return format:
[
  {
    "title": "string",
    "description": "string",
    "assignedTo": "string or null",
    "priority": "urgent|high|medium|low",
    "dueDate": "YYYY-MM-DD or null",
    "sourceType": "email"
  }
]`,
  });

  return parseJsonContent(content, []);
}

async function generateMeetingSummary(transcript, meetingTitle = "Meeting") {
  const content = await createChatCompletion({
    systemInstruction: "You are the meeting intelligence engine for Synapse OS. Return valid JSON only.",
    maxTokens: 1500,
    userPrompt: `Analyze this transcript from "${meetingTitle}" and produce a structured summary.

Return ONLY a JSON object. No markdown, no explanation.

Transcript:
---
${transcript}
---

Return format:
{
  "summary": "2-3 sentence overview",
  "keyDiscussions": ["string", "string"],
  "decisions": ["string", "string"],
  "actionItems": [
    {
      "task": "string",
      "assignedTo": "string or null",
      "dueDate": "string or null"
    }
  ],
  "sentiment": "positive|neutral|negative",
  "duration": "estimated in minutes"
}`,
  });

  return parseJsonContent(content, {
    summary: "Summary could not be generated.",
    keyDiscussions: [],
    decisions: [],
    actionItems: [],
  });
}

async function parseDriveQuery(naturalLanguageQuery) {
  const content = await createChatCompletion({
    systemInstruction: "You are the file intelligence engine for Synapse OS. Return valid JSON only.",
    maxTokens: 512,
    userPrompt: `Parse this natural language file request and extract the intent.

Request: "${naturalLanguageQuery}"

Return ONLY a JSON object. No markdown.

Return format:
{
  "searchQuery": "keyword to search in Drive",
  "action": "find|share|send|download",
  "recipient": "email or description of who to send to, or null",
  "additionalContext": "any other relevant context or null"
}`,
  });

  return parseJsonContent(content, {
    searchQuery: naturalLanguageQuery,
    action: "find",
    recipient: null,
  });
}

async function formatWeeklyReport(rawContent, userName = "Team Member") {
  const content = await createChatCompletion({
    systemInstruction: "You are the report formatter for Synapse OS. Return valid JSON only.",
    maxTokens: 1500,
    userPrompt: `Format this raw weekly update from ${userName} into a clean, professional report.

Raw input:
---
${rawContent}
---

Return ONLY a JSON object. No markdown.

Return format:
{
  "weekOf": "YYYY-MM-DD (Monday of current week)",
  "summary": "1-2 sentence professional summary",
  "completed": [{ "task": "string", "impact": "string" }],
  "inProgress": [{ "task": "string", "blockers": "string or null", "eta": "string or null" }],
  "blockers": ["string"],
  "nextWeek": ["string"],
  "mood": "on-track|at-risk|blocked"
}`,
  });

  return parseJsonContent(content, {
    summary: rawContent,
    completed: [],
    inProgress: [],
    blockers: [],
    nextWeek: [],
  });
}

async function draftEmailReply(emailThread, replyIntent) {
  return createChatCompletion({
    systemInstruction: "You are an AI email assistant for Synapse OS.",
    maxTokens: 800,
    userPrompt: `Draft a professional reply to this email thread.

Email Thread:
---
${emailThread}
---

User's intent for the reply: "${replyIntent}"

Return ONLY the email body text (no subject, no JSON). Keep it professional and concise.`,
  });
}

module.exports = {
  extractTasksFromEmail,
  generateMeetingSummary,
  parseDriveQuery,
  formatWeeklyReport,
  draftEmailReply,
};
