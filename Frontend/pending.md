# Pending Work

This file tracks what is still needed to turn the current Synapse OS prototype into a usable product.

## 1. App Foundation
- Add React Router so each module has its own URL.
- Split the current view switcher into route-based navigation.
- Add loading, empty, and error states across screens.
- Add a global error boundary.

## 2. State Management
- Replace the single `useWorkspace` hook with a reducer or store.
- Separate UI state from business state.
- Add persistence so refresh does not lose tasks, threads, or meeting summaries.

## 3. Authentication And Roles
- Add login and logout.
- Persist the signed-in user.
- Enforce admin, developer, presales, and support access rules.
- Hide or disable actions based on role.

## 4. Backend Integration
- Replace seed data with real API requests.
- Add endpoints for users, tasks, files, email threads, meetings, reports, and automations.
- Add loading and retry behavior for all remote calls.
- Add backend validation for create/update actions.

## 5. Groq AI Layer
- Move Groq calls to a server endpoint instead of calling from the browser.
- Keep the API key out of client-side code.
- Create reusable prompt templates for inbox, drive, reports, and meetings.
- Validate AI output before storing it in state.

## 6. Automation Engine
- Add a rule editor for Pingbix automations.
- Store automation execution history.
- Add real event triggers from tasks, email, and meetings.
- Add failure handling and retries for outbound alerts.

## 7. Task Workflow
- Add task details drawer or modal.
- Add comments, mentions, and activity history.
- Add drag-and-drop board behavior.
- Add overdue reminders and escalation rules.

## 8. Inbox And Email Intelligence
- Add thread search and filtering.
- Add follow-up actions from AI extracted tasks.
- Add thread status like open, waiting, done.
- Add reply/draft generation.

## 9. Drive And Search
- Add real document storage.
- Extract and index file text for semantic search.
- Respect document permissions.
- Add file preview and metadata details.

## 10. Meetings And Reports
- Connect meetings to a calendar source.
- Store meeting summaries and action items.
- Add report templates and export options.
- Add PDF/CSV download support.

## 11. Analytics
- Replace demo charts with live metrics.
- Track task completion, response time, automation volume, and user activity.
- Add filters by date and department.

## 12. Product Polish
- Add mobile responsive behavior.
- Improve keyboard navigation and accessibility.
- Add toasts and undo actions.
- Add a cleaner visual language for production.

## Suggested Next Build Order
1. Add routing and a proper shell layout.
2. Add auth and role-based access.
3. Move AI calls to a backend proxy.
4. Replace in-memory data with API storage.
5. Build task detail, inbox follow-up, and automation logs.

