# Synapse OS Backend API

Node.js + Express REST API powering the Synapse OS AI workspace.

## Stack

- Runtime: Node.js + Express
- Storage: SQLite (`node:sqlite`)
- AI: Groq
- Google: Gmail API, Drive API, Calendar API, Meet API
- WhatsApp: Pingbix
- Auth: Google OAuth2 + JWT sessions

## Project Structure

```text
src/
├── index.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
├── routes/
│   ├── analytics.js
│   ├── auth.js
│   ├── drive.js
│   ├── inbox.js
│   ├── meetings.js
│   ├── reports.js
│   ├── tasks.js
│   ├── webhooks.js
│   └── whatsapp.js
└── services/
    ├── ai.js
    ├── gmail.js
    ├── googleAuth.js
    ├── googleDrive.js
    ├── googleMeet.js
    ├── tasks.js
    └── whatsapp.js
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file:

```bash
cp .env.example .env
```

3. Fill in the Google, Groq, Pingbix, and database settings.
4. Run the API:

```bash
npm run dev
```

## Environment Variables

### Google OAuth2

1. Open https://console.cloud.google.com/
2. Enable Gmail, Drive, Calendar, and Meet APIs.
3. Create OAuth web credentials.
4. Set `GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback`.

### Groq

1. Open https://console.groq.com/
2. Generate an API key.
3. Set `GROQ_API_KEY`.
4. Optionally set `GROQ_MODEL` (default: `llama-3.1-8b-instant`).

### Database

1. Set `SQLITE_DB_PATH` if you want the SQLite file stored outside the default `data/synapse.sqlite`.

### Pingbix

1. Register at https://pingbix.com/
2. Generate an API key.
3. Set `PINGBIX_API_KEY`.
4. Set `BACKEND_PUBLIC_URL` to the public base URL of this backend, or set `PINGBIX_WEBHOOK_URL` directly to your public `/api/webhooks/pingbix` callback URL.

## API Reference

### Auth

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/auth/google` | Redirect to Google OAuth |
| GET | `/api/auth/google/callback` | OAuth callback that issues JWT |
| GET | `/api/auth/me` | Get current user from JWT |
| POST | `/api/auth/logout` | Client logout acknowledgement |

### Tasks

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create task manually |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/extract-from-email` | Extract tasks from email |

### Inbox

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/inbox` | List Gmail messages |
| GET | `/api/inbox/:id` | Get a single email |
| POST | `/api/inbox/send` | Send email |
| POST | `/api/inbox/draft-reply` | Draft a reply with AI |

### Meetings

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/meetings` | List meetings |
| GET | `/api/meetings/:id/transcript` | Fetch transcript |
| POST | `/api/meetings/:id/summarize` | Summarize transcript |

### Drive

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/drive/files` | List accessible files |
| GET | `/api/drive/search` | Search files |
| POST | `/api/drive/execute` | Execute natural-language query |

### WhatsApp

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/whatsapp/send` | Send a Pingbix WhatsApp message |

### Reports

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/reports/format` | Format raw report content |
| POST | `/api/reports/send` | Format and send report |

### Analytics

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/analytics` | Dashboard stats and chart data |

### Webhooks

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/webhooks/config` | Inspect webhook callback setup and recent events |
| POST | `/api/webhooks/pingbix` | Pingbix webhook receiver |

## Frontend Integration Notes

- Protected routes require `Authorization: Bearer <jwt_token>`.
- OAuth success redirects to `FRONTEND_URL/auth/success?token=<jwt>`.
- Default local API base URL is `http://localhost:4000`.

## Production Checklist

- Add durable rate-limit storage.
- Set `NODE_ENV=production` and use a strong `JWT_SECRET`.
- Deploy behind HTTPS.
- Set `FRONTEND_URL` to your production domain.
- Set `BACKEND_PUBLIC_URL` or `PINGBIX_WEBHOOK_URL` to a public callback URL for Pingbix.
