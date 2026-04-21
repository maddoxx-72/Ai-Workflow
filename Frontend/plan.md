# Synapse OS / Funnel App Plan

## What We Are Building
Synapse OS is an AI-assisted internal operations workspace for teams that handle tasks, email, knowledge search, meetings, reporting, and automated Pingbix alerts.

The goal is to turn messy operational signals into clear actions:
- incoming email becomes tasks
- tasks trigger notifications and automation
- drive/document search returns the right file quickly
- meetings can be summarized into action items
- reports can be generated from rough notes

## Current Prototype Scope
The current app already includes:
- dashboard for personal workload and notifications
- task board with create/update flows
- inbox with AI extraction for action items
- semantic drive search
- report drafting and formalization
- meeting intelligence with AI summaries
- Pingbix automation rules and message queue
- analytics placeholder dashboard

## What We Want The Product To Become
The next version should feel like a real workflow platform, not a demo shell.

Core product direction:
1. A single workspace where users switch between tasks, inbox, drive, meetings, reports, and automation.
2. AI that is connected to real business data instead of only mock objects.
3. Role-aware experiences for admin, developer, presales, and support.
4. Automation that sends useful alerts and creates real follow-up actions.
5. A clean path to production with authentication, API integration, and persistence.

## Suggested Architecture
Keep the React app organized into these layers:

- `src/app/`
  - app shell, routing, and providers
- `src/features/`
  - each business area as its own feature module
- `src/components/`
  - reusable layout and UI parts
- `src/services/`
  - Groq, backend API, notifications, and external integrations
- `src/data/`
  - seed data and fixtures for development
- `src/hooks/`
  - shared state or workspace logic
- `src/types/`
  - domain models for tasks, users, emails, meetings, automations

## What Is Still Required To Complete The Funnel Project

### 1. Real Data Layer
Right now the app still uses in-memory seed data.
You will need:
- backend API for users, tasks, files, email threads, meetings, and automations
- persistence in a database
- loading and error states for every remote call
- optimistic updates where needed

### 2. Authentication And Roles
The current user switcher is only a prototype.
You will need:
- login and logout
- role-based access control
- persisted current user session
- admin-only screens and actions enforced by backend, not just UI

### 3. AI Integration
Groq is now the AI provider, but the integration should be production-safe.
You will need:
- API key stored server-side, not in the browser
- backend proxy or server action for Groq requests
- prompt templates for inbox, drive search, reports, and meeting summaries
- response validation so AI output stays structured

### 4. Automation Engine
The Pingbix rules are only simulated now.
You will need:
- rule editor
- rule execution logs
- event triggers from tasks, email, and meetings
- real outbound messaging integration
- retry and failure handling

### 5. Search And Knowledge Retrieval
The drive view is only metadata-based today.
You will need:
- actual document storage
- text extraction and indexing
- semantic search over file content
- permission-aware access to documents

### 6. Task Workflow Improvements
The task system needs more product depth.
You will need:
- task assignment history
- comments and mentions
- due-date reminders
- priority escalation
- drag and drop or better board interactions

### 7. Calendar And Meetings
Meeting intelligence should connect to a real calendar.
You will need:
- calendar sync
- meeting import from a calendar provider
- action item tracking after AI summaries
- attendee follow-up workflows

### 8. Reporting And Analytics
The reporting and analytics screens are still presentation-first.
You will need:
- real metrics from backend events
- export to PDF/CSV
- custom report templates
- charts powered by actual data

### 9. UX And Product Polish
To feel like a finished funnel/operations app, we still need:
- responsive mobile behavior
- empty states and loading skeletons
- better form validation
- toast handling and undo behavior
- accessibility pass
- keyboard shortcuts for power users

## Recommended Build Phases

### Phase 1: Stabilize The Frontend
- add routing
- add shared state architecture
- split feature logic further
- add types for domain models

### Phase 2: Add Backend Contracts
- define API endpoints
- replace seed data with fetch calls
- add auth/session handling
- move Groq calls behind the server

### Phase 3: Automation And Intelligence
- build real workflow triggers
- add rule editor and logs
- connect inbox, tasks, and meetings through events

### Phase 4: Production Hardening
- logging and monitoring
- error boundaries
- rate limits and retries
- security review
- deployment pipeline

## Short-Term Next Tasks
Best immediate improvements:
1. Add React Router so every module has a real URL.
2. Replace `useWorkspace` with a reducer or store.
3. Move Groq requests to a backend endpoint.
4. Add a task detail drawer and inbox action sidebar.
5. Introduce a simple database schema for users, tasks, threads, and meetings.

## Definition Of Done
We should consider the funnel project complete when:
- users can log in and land in the correct workspace
- tasks and inbox items persist across refreshes
- AI actions are tied to real data
- automations run from real events
- files, meetings, and reports are searchable and actionable
- the UI works well on desktop and mobile

