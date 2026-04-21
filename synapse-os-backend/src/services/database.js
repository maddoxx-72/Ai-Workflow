const { randomUUID } = require("node:crypto");
const { mkdirSync } = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const databasePath = process.env.SQLITE_DB_PATH || path.join(__dirname, "..", "..", "data", "synapse.sqlite");

mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    picture TEXT,
    role TEXT DEFAULT 'admin',
    designation TEXT,
    phone TEXT,
    manager_name TEXT,
    manager_email TEXT,
    manager_phone TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS oauth_tokens (
    user_id TEXT PRIMARY KEY,
    access_token TEXT,
    refresh_token TEXT,
    scope TEXT,
    token_type TEXT,
    expiry_date INTEGER,
    id_token TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    due_date TEXT,
    source_type TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS meeting_summaries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    meeting_id TEXT NOT NULL,
    title TEXT,
    summary_json TEXT NOT NULL,
    transcript_source TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(user_id, meeting_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    recipient_name TEXT,
    recipient_email TEXT NOT NULL,
    raw_content TEXT NOT NULL,
    formatted_json TEXT NOT NULL,
    sent_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS webhook_events (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    event_type TEXT,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

function now() {
  return new Date().toISOString();
}

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeStatus(status) {
  if (!status) {
    return "todo";
  }

  const statusMap = {
    todo: "todo",
    pending: "todo",
    "in-progress": "in_progress",
    in_progress: "in_progress",
    review: "in_review",
    in_review: "in_review",
    completed: "completed",
  };

  return statusMap[status] || status;
}

function mapUserRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    picture: row.picture || "",
    role: row.role || "admin",
    designation: row.designation || "Workspace Member",
    phone: row.phone || "",
    managerName: row.manager_name || "",
    managerEmail: row.manager_email || "",
    managerPhone: row.manager_phone || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTaskRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    assignedTo: row.assigned_to || null,
    priority: row.priority,
    status: row.status,
    dueDate: row.due_date || null,
    sourceType: row.source_type,
    createdBy: row.created_by || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at || null,
  };
}

function upsertUser(user) {
  const timestamp = now();

  db.prepare(`
    INSERT INTO users (
      id, email, name, picture, role, designation, phone,
      manager_name, manager_email, manager_phone, created_at, updated_at
    )
    VALUES (
      @id, @email, @name, @picture, @role, @designation, @phone,
      @manager_name, @manager_email, @manager_phone, @created_at, @updated_at
    )
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      picture = excluded.picture,
      role = COALESCE(excluded.role, users.role),
      designation = COALESCE(excluded.designation, users.designation),
      phone = COALESCE(excluded.phone, users.phone),
      manager_name = COALESCE(excluded.manager_name, users.manager_name),
      manager_email = COALESCE(excluded.manager_email, users.manager_email),
      manager_phone = COALESCE(excluded.manager_phone, users.manager_phone),
      updated_at = excluded.updated_at
  `).run({
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture || "",
    role: user.role || "admin",
    designation: user.designation || "Workspace Member",
    phone: user.phone || "",
    manager_name: user.managerName || null,
    manager_email: user.managerEmail || null,
    manager_phone: user.managerPhone || null,
    created_at: timestamp,
    updated_at: timestamp,
  });

  return getUserById(user.id);
}

function updateUserProfile(userId, updates = {}) {
  const currentUser = getUserById(userId);

  if (!currentUser) {
    throw new Error(`User ${userId} not found`);
  }

  const nextUser = {
    ...currentUser,
    ...Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    ),
  };

  db.prepare(`
    UPDATE users
    SET
      email = @email,
      name = @name,
      picture = @picture,
      role = @role,
      designation = @designation,
      phone = @phone,
      manager_name = @manager_name,
      manager_email = @manager_email,
      manager_phone = @manager_phone,
      updated_at = @updated_at
    WHERE id = @id
  `).run({
    id: userId,
    email: nextUser.email,
    name: nextUser.name,
    picture: nextUser.picture || "",
    role: nextUser.role || "admin",
    designation: nextUser.designation || "Workspace Member",
    phone: nextUser.phone || "",
    manager_name: nextUser.managerName || null,
    manager_email: nextUser.managerEmail || null,
    manager_phone: nextUser.managerPhone || null,
    updated_at: now(),
  });

  return getUserById(userId);
}

function getUserById(userId) {
  return mapUserRow(
    db.prepare(`
      SELECT id, email, name, picture, role, designation, phone,
             manager_name, manager_email, manager_phone, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(userId)
  );
}

function getUserByEmail(email) {
  return mapUserRow(
    db.prepare(`
      SELECT id, email, name, picture, role, designation, phone,
             manager_name, manager_email, manager_phone, created_at, updated_at
      FROM users
      WHERE email = ?
    `).get(email)
  );
}

function listUsers() {
  return db.prepare(`
    SELECT id, email, name, picture, role, designation, phone,
           manager_name, manager_email, manager_phone, created_at, updated_at
    FROM users
    ORDER BY name COLLATE NOCASE ASC
  `).all().map(mapUserRow);
}

function saveOAuthTokens(userId, tokens) {
  const timestamp = now();

  db.prepare(`
    INSERT INTO oauth_tokens (
      user_id, access_token, refresh_token, scope, token_type,
      expiry_date, id_token, created_at, updated_at
    )
    VALUES (
      @user_id, @access_token, @refresh_token, @scope, @token_type,
      @expiry_date, @id_token, @created_at, @updated_at
    )
    ON CONFLICT(user_id) DO UPDATE SET
      access_token = COALESCE(excluded.access_token, oauth_tokens.access_token),
      refresh_token = COALESCE(excluded.refresh_token, oauth_tokens.refresh_token),
      scope = COALESCE(excluded.scope, oauth_tokens.scope),
      token_type = COALESCE(excluded.token_type, oauth_tokens.token_type),
      expiry_date = COALESCE(excluded.expiry_date, oauth_tokens.expiry_date),
      id_token = COALESCE(excluded.id_token, oauth_tokens.id_token),
      updated_at = excluded.updated_at
  `).run({
    user_id: userId,
    access_token: tokens.access_token || null,
    refresh_token: tokens.refresh_token || null,
    scope: tokens.scope || null,
    token_type: tokens.token_type || null,
    expiry_date: tokens.expiry_date || null,
    id_token: tokens.id_token || null,
    created_at: timestamp,
    updated_at: timestamp,
  });
}

function getOAuthTokens(userId) {
  const row = db.prepare(`
    SELECT access_token, refresh_token, scope, token_type, expiry_date, id_token
    FROM oauth_tokens
    WHERE user_id = ?
  `).get(userId);

  if (!row) {
    return null;
  }

  return {
    access_token: row.access_token || undefined,
    refresh_token: row.refresh_token || undefined,
    scope: row.scope || undefined,
    token_type: row.token_type || undefined,
    expiry_date: row.expiry_date || undefined,
    id_token: row.id_token || undefined,
  };
}

function createTask(task) {
  const timestamp = now();
  const normalizedStatus = normalizeStatus(task.status);
  const taskId = task.id || randomUUID();

  db.prepare(`
    INSERT INTO tasks (
      id, title, description, assigned_to, priority, status, due_date,
      source_type, created_by, created_at, updated_at, completed_at
    )
    VALUES (
      @id, @title, @description, @assigned_to, @priority, @status, @due_date,
      @source_type, @created_by, @created_at, @updated_at, @completed_at
    )
  `).run({
    id: taskId,
    title: task.title,
    description: task.description || "",
    assigned_to: task.assignedTo || null,
    priority: task.priority || "medium",
    status: normalizedStatus,
    due_date: task.dueDate || null,
    source_type: task.sourceType || "manual",
    created_by: task.createdBy || null,
    created_at: timestamp,
    updated_at: timestamp,
    completed_at: normalizedStatus === "completed" ? timestamp : null,
  });

  return getTaskById(taskId);
}

function getTaskById(taskId) {
  const row = db.prepare(`
    SELECT id, title, description, assigned_to, priority, status, due_date,
           source_type, created_by, created_at, updated_at, completed_at
    FROM tasks
    WHERE id = ?
  `).get(taskId);

  const task = mapTaskRow(row);

  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  return task;
}

function listTasks({ assignedTo, status } = {}) {
  let query = `
    SELECT id, title, description, assigned_to, priority, status, due_date,
           source_type, created_by, created_at, updated_at, completed_at
    FROM tasks
  `;
  const params = [];
  const filters = [];

  if (assignedTo) {
    filters.push("assigned_to = ?");
    params.push(assignedTo);
  }

  if (status) {
    filters.push("status = ?");
    params.push(normalizeStatus(status));
  }

  if (filters.length) {
    query += ` WHERE ${filters.join(" AND ")}`;
  }

  query += " ORDER BY datetime(created_at) DESC";

  return db.prepare(query).all(...params).map(mapTaskRow);
}

function updateTask(taskId, updates = {}) {
  const currentTask = getTaskById(taskId);
  const nextTask = {
    ...currentTask,
    ...Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    ),
  };
  const normalizedStatus = normalizeStatus(nextTask.status);
  const completedAt =
    normalizedStatus === "completed"
      ? currentTask.completedAt || now()
      : null;

  db.prepare(`
    UPDATE tasks
    SET
      title = @title,
      description = @description,
      assigned_to = @assigned_to,
      priority = @priority,
      status = @status,
      due_date = @due_date,
      updated_at = @updated_at,
      completed_at = @completed_at
    WHERE id = @id
  `).run({
    id: taskId,
    title: nextTask.title,
    description: nextTask.description || "",
    assigned_to: nextTask.assignedTo || null,
    priority: nextTask.priority || "medium",
    status: normalizedStatus,
    due_date: nextTask.dueDate || null,
    updated_at: now(),
    completed_at: completedAt,
  });

  return getTaskById(taskId);
}

function deleteTask(taskId) {
  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);

  if (!result.changes) {
    throw new Error(`Task ${taskId} not found`);
  }

  return { deleted: true, id: taskId };
}

function getTaskStats() {
  const counts = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status != 'completed' THEN 1 ELSE 0 END) AS pending
    FROM tasks
  `).get();

  const total = counts.total || 0;
  const completed = counts.completed || 0;
  const pending = counts.pending || 0;

  return {
    pending,
    completed,
    total,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function saveMeetingSummary({ userId, meetingId, title, summary, transcriptSource }) {
  const timestamp = now();

  db.prepare(`
    INSERT INTO meeting_summaries (
      id, user_id, meeting_id, title, summary_json, transcript_source, created_at, updated_at
    )
    VALUES (
      @id, @user_id, @meeting_id, @title, @summary_json, @transcript_source, @created_at, @updated_at
    )
    ON CONFLICT(user_id, meeting_id) DO UPDATE SET
      title = excluded.title,
      summary_json = excluded.summary_json,
      transcript_source = excluded.transcript_source,
      updated_at = excluded.updated_at
  `).run({
    id: randomUUID(),
    user_id: userId,
    meeting_id: meetingId,
    title: title || null,
    summary_json: JSON.stringify(summary),
    transcript_source: transcriptSource || "metadata",
    created_at: timestamp,
    updated_at: timestamp,
  });

  return getMeetingSummary(userId, meetingId);
}

function getMeetingSummary(userId, meetingId) {
  const row = db.prepare(`
    SELECT meeting_id, title, summary_json, transcript_source, created_at, updated_at
    FROM meeting_summaries
    WHERE user_id = ? AND meeting_id = ?
  `).get(userId, meetingId);

  if (!row) {
    return null;
  }

  return {
    meetingId: row.meeting_id,
    title: row.title || "",
    summary: parseJson(row.summary_json, null),
    transcriptSource: row.transcript_source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function listMeetingSummaries(userId) {
  return db.prepare(`
    SELECT meeting_id, title, summary_json, transcript_source, created_at, updated_at
    FROM meeting_summaries
    WHERE user_id = ?
  `).all(userId).map((row) => ({
    meetingId: row.meeting_id,
    title: row.title || "",
    summary: parseJson(row.summary_json, null),
    transcriptSource: row.transcript_source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

function saveReport({ userId, recipientName, recipientEmail, rawContent, formattedReport, sentAt }) {
  const timestamp = now();

  db.prepare(`
    INSERT INTO reports (
      id, user_id, recipient_name, recipient_email, raw_content,
      formatted_json, sent_at, created_at, updated_at
    )
    VALUES (
      @id, @user_id, @recipient_name, @recipient_email, @raw_content,
      @formatted_json, @sent_at, @created_at, @updated_at
    )
  `).run({
    id: randomUUID(),
    user_id: userId,
    recipient_name: recipientName || null,
    recipient_email: recipientEmail,
    raw_content: rawContent,
    formatted_json: JSON.stringify(formattedReport),
    sent_at: sentAt || null,
    created_at: timestamp,
    updated_at: timestamp,
  });
}

function saveWebhookEvent({ provider, eventType, payload }) {
  const timestamp = now();

  db.prepare(`
    INSERT INTO webhook_events (id, provider, event_type, payload_json, created_at)
    VALUES (@id, @provider, @event_type, @payload_json, @created_at)
  `).run({
    id: randomUUID(),
    provider,
    event_type: eventType || null,
    payload_json: JSON.stringify(payload || {}),
    created_at: timestamp,
  });
}

function listWebhookEvents(provider, limit = 5) {
  return db.prepare(`
    SELECT id, provider, event_type, payload_json, created_at
    FROM webhook_events
    WHERE provider = ?
    ORDER BY datetime(created_at) DESC
    LIMIT ?
  `).all(provider, limit).map((row) => ({
    id: row.id,
    provider: row.provider,
    eventType: row.event_type || "",
    payload: parseJson(row.payload_json, {}),
    createdAt: row.created_at,
  }));
}

function getWebhookEventCount(provider) {
  const row = db.prepare(`
    SELECT COUNT(*) AS total
    FROM webhook_events
    WHERE provider = ?
  `).get(provider);

  return row?.total || 0;
}

module.exports = {
  createTask,
  db,
  deleteTask,
  getMeetingSummary,
  getOAuthTokens,
  getTaskById,
  getTaskStats,
  getUserByEmail,
  getUserById,
  getWebhookEventCount,
  listMeetingSummaries,
  listTasks,
  listUsers,
  listWebhookEvents,
  normalizeStatus,
  saveMeetingSummary,
  saveOAuthTokens,
  saveReport,
  saveWebhookEvent,
  updateTask,
  updateUserProfile,
  upsertUser,
};
