# CivicConnect - Complete Project Plan

## 1. Project Vision

CivicConnect is a responsive, installable civic-issue reporting and resolution platform. Citizens report public problems with a photograph, description, and geographic location. The platform categorizes and routes each report to the responsible municipal unit, provides a transparent status timeline, and allows citizens to confirm or rate the resolution.

The first release will consist of:

1. A Progressive Web App (PWA) for citizens.
2. A responsive operations dashboard for municipal officers and administrators.
3. A shared API, database, storage layer, notification service, and AI-assisted classification service.

## 2. Product Decision

Build the citizen experience as a PWA for the first release. It provides one codebase, camera and location access, home-screen installation, responsive behavior, and faster deployment. Keep the backend independent so a React Native or Flutter client can be added later without changing the complaint-management system.

## 3. Goals and Success Measures

### Goals

- Make reporting an issue possible in less than two minutes.
- Route complaints to the correct department and ward.
- Preserve a transparent, tamper-resistant complaint timeline.
- Give officers a usable queue for assignment and resolution.
- Notify citizens about meaningful changes.
- Produce aggregate insights about hotspots and response performance.

### Initial success measures

- At least 90% of complete reports are submitted successfully.
- Median citizen reporting time is below two minutes.
- At least 80% of reports are routed without administrator correction.
- Every status change creates a status-history record.
- No citizen can view private profile data or modify another citizen's complaint.
- Dashboard metrics match the underlying complaint records.

## 4. Scope

### MVP - in scope

- Citizen registration, login, logout, and account recovery
- Role-based access for citizens, officers, department administrators, and system administrators
- Photo upload or camera capture
- Foreground location capture and manual map-pin correction
- Description, category suggestion, category confirmation, and submission
- Ward and department routing
- Duplicate-report suggestion and support/upvote flow
- Citizen complaint list, details, history, and tracking
- Officer work queue, assignment, status changes, notes, and resolution evidence
- Administrator management of users, departments, wards, categories, routing rules, and reports
- In-app notifications and email notifications
- Citizen feedback, rating, confirmation, and reopening
- Map view and basic analytics
- Audit trail and security policies
- Installable PWA with an offline report draft

### Phase 2

- Multilingual interface and LLM-assisted translation
- Push notifications on all supported platforms
- More advanced image-and-text verification
- SLA escalation rules
- Ward-boundary geospatial routing
- Improved duplicate detection using image similarity
- Native Android/iOS client if evidence shows it is necessary

### Out of scope

- Tax, bill, fine, or municipal payment integrations
- Legal enforcement
- Paper grievance digitization
- Direct integration with production government systems
- Emergency-service dispatch
- Fully autonomous AI rejection or prioritization

## 5. Actors and Permissions

| Actor | Main capabilities |
|---|---|
| Citizen | Register, report, track, view history, support a nearby report, comment, confirm/reopen resolution, rate service |
| Municipal Officer | View assigned queue, accept work, update status, add notes, upload resolution evidence, resolve an issue |
| Department Admin | View department queue, triage, assign/reassign officers, correct category and priority, monitor performance |
| System Admin | Manage users, roles, departments, wards, categories, routing rules, platform reports, and audit records |
| AI Service | Suggest category, flag irrelevant content, estimate confidence, detect possible duplicates, support translation in Phase 2 |
| Notification Service | Deliver in-app, email, and later push notifications triggered by domain events |

The AI and notification services are supporting systems, not human decision-makers. Sensitive actions remain controlled by authorized users.

## 6. Core User Journeys

### Citizen reports an issue

1. Citizen signs in.
2. Citizen takes or uploads a photograph.
3. PWA requests foreground location permission.
4. Citizen verifies or adjusts the map pin.
5. Citizen enters a short description.
6. AI suggests a category and shows a confidence indicator.
7. System checks for nearby unresolved duplicates.
8. Citizen supports an existing report or confirms a new report.
9. System derives the ward and routing rule.
10. Complaint is saved as `SUBMITTED` and its first history event is created.
11. Citizen receives a reference number and notification.

### Municipal resolution

1. Department administrator reviews the incoming queue.
2. Complaint is verified or rejected with a reason.
3. An officer is assigned.
4. Officer accepts and begins work.
5. Officer adds progress updates when appropriate.
6. Officer uploads a resolution photograph and resolution note.
7. Complaint becomes `RESOLVED`.
8. Citizen confirms closure or reopens it with a reason.
9. Confirmed complaints become `CLOSED` and accept a rating.

### Administration

1. Administrator manages wards, departments, categories, and routing rules.
2. Administrator creates or disables staff accounts and assigns roles.
3. Administrator reviews cross-department reports and audit records.
4. Administrator identifies overdue work, hotspots, and routing failures.

## 7. Complaint State Machine

Allowed primary path:

`SUBMITTED -> VERIFIED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED`

Allowed alternative transitions:

- `SUBMITTED -> REJECTED`
- `VERIFIED -> REJECTED`
- `ASSIGNED -> VERIFIED` when reassignment is required
- `RESOLVED -> REOPENED -> IN_PROGRESS`
- `REOPENED -> RESOLVED`

Rules:

- Only authorized municipal staff can verify, assign, reject, progress, or resolve.
- Rejection requires a reason.
- Resolution requires a note and resolution photograph.
- Reopening requires a citizen reason and is allowed within a configurable period.
- Each transition is validated on the server and appended to immutable history.
- Closing may happen through citizen confirmation or a documented automatic-close policy.

## 8. Functional Requirements

### Authentication and accounts

- Email/password for development and demonstration
- Optional phone OTP when a provider is configured
- Password reset and verified contact flow
- Profile name, contact preference, and accessibility settings
- Account deactivation and data-retention workflow

### Reporting

- One or more images with size/type validation
- GPS coordinates, accuracy, and human-readable address
- Manual pin placement when location is denied or inaccurate
- Category and optional subcategory
- Short title and description
- Draft preservation if the connection drops
- Server-generated complaint reference number

### Tracking and engagement

- Current status and complete timeline
- Public-safe complaint map
- Citizen-visible officer updates
- Support/upvote a report once per user
- Feedback score, optional comment, and reopen flow
- Privacy-safe sharing link as a later enhancement

### Municipal operations

- Queue filters by status, category, ward, priority, assignee, and date
- List and map views
- Assignment and reassignment
- Internal versus citizen-visible notes
- Bulk assignment as Phase 2
- Resolution evidence
- SLA age and overdue indicator

### Administration and reporting

- CRUD management for departments, wards, categories, and routing rules
- Staff role management
- Counts by status/category/ward
- Median and percentile resolution time
- Reopen rate and citizen rating
- Heatmap or clustered map for hotspots
- CSV export of permission-safe operational reports

## 9. Non-functional Requirements

- Responsive from 360 px mobile screens through desktop displays
- WCAG 2.1 AA-oriented keyboard, contrast, label, and focus behavior
- Meaningful loading, empty, permission-denied, offline, and error states
- HTTPS in every deployed environment
- Server-side validation for every mutation
- Role and row-level authorization
- Image compression and bounded upload size
- Pagination and indexed dashboard queries
- Structured application logs without sensitive content
- Database backup and documented restore procedure
- Target 99.5% availability for a pilot deployment
- Common pages should load within about three seconds on a typical mobile connection

## 10. Recommended Architecture

### Frontend

- Next.js with TypeScript
- Tailwind CSS and an accessible component library
- PWA manifest, icons, service worker, install prompt, and offline draft storage
- Leaflet and OpenStreetMap for the first release
- React Hook Form and schema validation for forms

### Backend

- Supabase PostgreSQL database
- Supabase Auth
- Supabase Storage for complaint and resolution images
- Supabase Realtime for active complaint updates
- Server actions/API routes or Edge Functions for trusted workflows
- Scheduled job for reminders, escalation checks, and automatic-close policy

### System flow

`Citizen PWA / Staff Dashboard -> Trusted API -> PostgreSQL + Object Storage`

The trusted API calls routing, AI, and notification services. Clients never receive service secrets and cannot perform privileged status transitions directly.

## 11. Proposed Data Model

| Table | Important fields |
|---|---|
| `profiles` | user_id, display_name, role, department_id, active, preferences |
| `departments` | id, name, code, active |
| `wards` | id, name, code, boundary, active |
| `categories` | id, name, icon, default_department_id, active |
| `issues` | id, reference_no, reporter_id, title, description, category_id, ward_id, department_id, status, priority, lat, lng, address, created_at |
| `issue_media` | id, issue_id, storage_path, media_type, purpose, uploaded_by, created_at |
| `assignments` | id, issue_id, officer_id, assigned_by, assigned_at, ended_at |
| `status_history` | id, issue_id, from_status, to_status, changed_by, note, created_at |
| `comments` | id, issue_id, author_id, body, visibility, created_at |
| `issue_supporters` | issue_id, citizen_id, created_at |
| `feedback` | id, issue_id, citizen_id, rating, comment, outcome, created_at |
| `routing_rules` | id, category_id, ward_id, department_id, priority_order, active |
| `ai_assessments` | id, issue_id, model_version, predicted_category_id, confidence, flags, raw_summary, created_at |
| `notifications` | id, recipient_id, issue_id, channel, event_type, status, sent_at, read_at |
| `audit_logs` | id, actor_id, action, entity_type, entity_id, safe_metadata, created_at |

Important indexes include issue status, ward, department, category, assignee, creation date, geographic coordinates, reference number, and unread notifications.

## 12. Authorization Model

- Anonymous visitors can access only the landing, login, registration, and intentionally public aggregate information.
- Citizens can create complaints and read their own full records.
- Public complaint views exclude reporter identity, private notes, and precise personal information.
- Officers can read assigned or department-authorized complaints and perform permitted transitions.
- Department administrators can manage records only in their department.
- System administrators can manage platform configuration.
- Storage policies mirror database permissions.
- Privileged operations execute on the server and create audit events.

## 13. Routing, Priority, and Duplicate Logic

### Routing

Use deterministic routing first:

`confirmed category + derived ward -> active routing rule -> department`

If no exact rule exists, fall back to the category's default department. If no fallback exists, place the issue in an administrator triage queue.

### Priority

Calculate a transparent score from configurable factors:

- Base category severity
- Safety flag
- Number of unique supporters
- Age of unresolved complaint
- Repeat issue at the same location
- Proximity to configured sensitive locations

Staff may override priority only with a recorded reason.

### Duplicate detection

For the MVP, suggest duplicates when unresolved issues have the same category, occur within a configurable radius, and were reported recently. Phase 2 can add semantic text and image similarity. A citizen always retains the option to create a distinct report.

## 14. AI Plan

### MVP AI

- Inputs: description and optionally an image summary
- Outputs: suggested category, confidence, safety flag, and relevance flag
- High confidence: preselect the category for citizen confirmation
- Low confidence: show normal category selection and send to manual triage if necessary
- Store prediction, final category, confidence, and model version for evaluation

### Guardrails

- AI cannot reject, close, or permanently deprioritize a report.
- Citizens can correct the suggestion.
- Officers can correct categorization with a reason.
- Do not send unnecessary citizen identity to the AI provider.
- Use a rules-only fallback whenever the AI service is unavailable.

### Phase 2 multilingual support

- Store the original citizen text unchanged.
- Store translations separately with language and model metadata.
- Make translation failure non-blocking.
- Let staff view both original and translated text.

## 15. Notification Matrix

| Event | Citizen | Officer/Admin |
|---|---|---|
| Complaint submitted | Confirmation | New queue item |
| Complaint assigned | Status update | Assignment alert |
| Work started | Status update | Optional |
| Comment requiring response | Alert | Alert |
| Complaint resolved | Resolution prompt | Confirmation |
| Complaint reopened | Confirmation | Urgent queue alert |
| Complaint overdue | No repeated noise | Escalation alert |
| Complaint closed | Final confirmation | Completion record |

Start with in-app and email. Add web/native push after the end-to-end workflow is stable.

## 16. Screens

### Citizen PWA

- Landing and onboarding
- Register, login, and password recovery
- Citizen home with report button and nearby issues
- Four-step report wizard
- Duplicate suggestions
- Submission confirmation
- My complaints
- Complaint details and timeline
- Notifications
- Feedback/reopen form
- Profile, privacy, accessibility, and install help

### Officer dashboard

- Login
- My work queue
- Department queue
- Map view
- Issue detail workspace
- Assignment panel
- Status and resolution form
- Notifications
- Personal profile

### Administrator dashboard

- Operational overview
- All authorized issues
- Staff and role management
- Departments and wards
- Categories and routing rules
- SLA/settings
- Analytics and exports
- Audit log

## 17. Delivery Plan

Assumption: one small student team, two-week sprints, with an MVP in approximately 12 weeks.

### Sprint 0 - discovery and setup

- Confirm roles, complaint categories, departments, and status rules
- Create wireframes and UI design tokens
- Establish repository, environments, checks, and database migration process
- Define seed data and the end-to-end demonstration story

Exit: approved scope, architecture, schema draft, and clickable low-fidelity flow.

### Sprint 1 - identity and foundation

- Authentication and profiles
- Role-aware layouts
- Departments, wards, and categories
- Initial row-level access rules
- Automated test and deployment skeleton

Exit: each actor signs in and reaches only their permitted area.

### Sprint 2 - citizen reporting

- Camera/file upload
- Location permission and manual pin
- Report form and validation
- Storage integration
- My complaints and complaint details

Exit: a citizen can submit and retrieve a complete complaint.

### Sprint 3 - municipal workflow

- Incoming and assigned queues
- Verification, assignment, and status state machine
- Internal/public notes
- Resolution image and timeline
- Audit events

Exit: staff can take a report from submission through resolution.

### Sprint 4 - routing and citizen closure

- Routing rules and triage fallback
- Citizen notifications
- Confirm, reopen, and rate flows
- Duplicate suggestion and support/upvote

Exit: the entire citizen-to-municipality-to-citizen loop works.

### Sprint 5 - AI and analytics

- Category suggestion with confidence and fallback
- AI assessment records and correction tracking
- Operational metrics
- Map clustering and hotspot view
- Overdue indicators

Exit: AI assists without blocking submissions and analytics are verified against test data.

### Sprint 6 - PWA hardening and release

- Manifest, icons, installability, offline draft, and safe retry
- Accessibility and responsive QA
- Security tests and storage-policy tests
- Performance tuning, backup/restore exercise, seed/demo data
- User documentation, deployment guide, and final demonstration

Exit: release candidate passes acceptance tests in the deployed environment.

## 18. Prioritized Backlog

### Must have

- Authentication and roles
- Report with photo and location
- Complaint history
- Department routing
- Assignment and controlled status updates
- Resolution evidence
- Citizen confirmation/reopen/rating
- Secure access and audit records
- Deployable PWA and dashboard

### Should have

- Category suggestion
- Duplicate suggestion and support/upvote
- Email/in-app notifications
- Operational analytics and map clusters
- Offline draft

### Could have

- Multilingual translation
- Advanced image verification
- Push notifications
- SLA escalation
- CSV export and expanded analytics

### Won't have in the first release

- Payments
- Government production integrations
- Native mobile application
- Emergency dispatch
- Autonomous AI enforcement decisions

## 19. Testing Strategy

### Unit tests

- Schema validation
- Routing fallback logic
- Priority calculation
- Allowed and forbidden status transitions
- Notification-event selection
- Duplicate distance/time rules

### Integration tests

- Authentication and role policies
- Complaint creation plus media authorization
- Assignment and history creation
- Resolution plus feedback/reopen
- Routing and notification jobs
- AI timeout and rules fallback

### End-to-end tests

- Citizen submits a geotagged pothole report
- Correct department receives it
- Admin assigns an officer
- Officer resolves it with evidence
- Citizen receives updates and confirms closure
- Another citizen cannot edit the complaint
- Citizen can reopen an inadequate resolution

### Non-functional tests

- Mobile and desktop viewport testing
- Keyboard-only and screen-reader-oriented checks
- Slow/offline connection behavior
- Upload size/type abuse
- Rate limiting and authorization bypass attempts
- Dashboard query performance with seeded volume
- Backup restoration

## 20. Acceptance Criteria for MVP

The MVP is accepted when:

1. A citizen can register, sign in, and submit a valid issue with photo and coordinates.
2. Denied location permission does not block manual map selection.
3. The citizen receives a unique reference number.
4. Routing sends the complaint to the correct configured department or triage queue.
5. Staff can verify, assign, progress, and resolve only authorized complaints.
6. Invalid status transitions are rejected by the server.
7. Every change appears in the issue timeline with actor and timestamp.
8. Resolution requires evidence and a note.
9. The citizen can confirm, rate, or reopen the resolution.
10. Notifications are created for defined events without duplicates.
11. AI failure never prevents manual submission.
12. Citizens cannot access private records or another citizen's private data.
13. The PWA is installable and preserves an unfinished report draft offline.
14. Dashboard totals and resolution metrics match database fixtures.
15. The deployed end-to-end scenario passes on a mobile browser and desktop browser.

## 21. Environments and Deployment

- Local: developer database and local environment variables
- Staging: production-like deployment with synthetic data
- Production/pilot: separate database, storage, secrets, backups, and monitoring

Deployment checklist:

- Database migrations applied through version control
- Secrets stored in platform secret management
- Development keys absent from the client bundle
- Storage and row-level policies tested
- Domain and HTTPS configured
- Error monitoring and health checks enabled
- Backup schedule and recovery steps documented
- Admin bootstrap procedure documented
- Seed data disabled or removed from production

## 22. Repository Structure

```text
civicconnect/
  apps/
    web/                 # citizen PWA and staff/admin dashboard
  packages/
    ui/                  # shared accessible components
    domain/              # statuses, permissions, validation, routing types
    config/              # shared lint and TypeScript configuration
  supabase/
    migrations/
    seed.sql
    functions/
  tests/
    e2e/
    fixtures/
  docs/
    architecture/
    api/
    operations/
```

A single Next.js application can serve role-specific routes initially. Split citizen and staff frontends only if independent release cycles become necessary.

## 23. Required Project Documentation

- Software Requirements Specification
- Updated use-case diagram
- System architecture diagram
- Entity-relationship diagram
- Data-flow or sequence diagrams for reporting and resolution
- API specification
- Database dictionary
- Test plan and test report
- Deployment and rollback guide
- User guide for citizens
- Operations guide for municipal staff
- Privacy notice and data-retention policy draft
- Final project report and demonstration script

## 24. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Incorrect automatic routing | Editable routing rules and triage fallback |
| Poor or denied GPS | Display accuracy and allow manual pin correction |
| False or abusive reports | Rate limits, moderation flags, audit trail, and account controls |
| Duplicate complaints | Nearby unresolved suggestion and supporter model |
| AI misclassification | Citizen confirmation, confidence threshold, manual correction, rules fallback |
| Exposure of citizen data | Least-privilege policies, public-safe views, server validation |
| Notification fatigue | Notify only on meaningful events and group reminders |
| Scope growth | Freeze MVP using Must/Should/Could/Won't priorities |
| Weak demonstration | Seed a complete realistic ward, department, officer, and complaint lifecycle |

## 25. Use-Case Diagram Reconciliation

The provided diagram correctly identifies Citizen, Municipal Officer, Admin, and LLM/AI actors. Before using it in the final report, make these corrections:

- Rename the generic top-left `Actor` label to `Citizen` and remove any duplicate actor label.
- Connect `Upvote issue` directly to the Citizen. It should not extend `Add geotag photo`.
- Model `Report issue` as including `Add photo` and `Add/confirm geolocation` as separate use cases.
- Connect `Notify users` to the notification service or show it as an included system behavior for relevant status changes.
- Treat `Give feedback` as including `Rate resolution`; add `Confirm resolution` and `Reopen issue` explicitly.
- Add the department-admin role or clarify that Admin performs department triage and officer assignment.
- Add `Verify issue`, `View assigned issues`, `Add resolution evidence`, and `View complaint details` for municipal staff.
- Rename `Image + text verification` to `Suggest category / verify relevance` so AI is not shown as the final authority.
- Mark `Multilingual support` as Phase 2 to remain consistent with the original project scope.
- Add clear UML arrow directions and avoid color as the only distinction between actor responsibilities.

## 26. Final Demonstration Scenario

Prepare a seeded scenario involving an overflowing garbage bin:

1. Citizen reports it using a photograph and adjusted map pin.
2. AI suggests `Sanitation` with a visible confidence score.
3. Duplicate detection finds no existing complaint.
4. Ward/category routing sends it to the correct sanitation queue.
5. Department admin verifies and assigns an officer.
6. Officer moves it to `IN_PROGRESS` and adds an update.
7. Officer uploads a cleaned-site photograph and resolves it.
8. Citizen receives the update, confirms closure, and gives a rating.
9. Dashboard totals, response time, map marker, and audit log update.
10. A second user attempts an unauthorized edit and is rejected.

This scenario demonstrates functional completeness, AI assistance, security, traceability, and analytics in one coherent flow.
