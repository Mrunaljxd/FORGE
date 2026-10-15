# FORGE — Stronger today. Better forever.

FORGE is a full-stack fitness and wellbeing product built around adaptable movement, practical nutrition, and progress that is not limited to appearance. It is designed to support changing schedules and personal needs; it does not promise medical outcomes or prescribe a rigid plan.

## Equipment-free by design

> Your workout should start with what you already have: your body and your time.

The built-in training experience requires **no specialized equipment and no mat**. Default movements use bodyweight and a safe, clear bit of floor; a wall is optional for support where appropriate. The workout selector adapts to **time**, not equipment: choose 10, 20, 30, 45, or 60 minutes, then a goal and experience level.

The 20-minute beginner strength example returns six visible movements: Bodyweight Squat, Incline Push-Up, Reverse Lunge, Glute Bridge, Bird Dog, and Forearm Plank. Other focus choices include Full Body, Mobility, Energy, and Recovery. Beginner, Intermediate, and Advanced levels are available.

Progression is not based on adding weight. The movement library links bodyweight progressions and coaching cues; members can adjust repetitions, duration/holds, sets, tempo, range of motion, and exercise difficulty. The public library displays `Equipment: None` for built-in movements.

## What is included

- Editorial, responsive public pages for Home, About, How it works, Programs, Exercises, Nutrition, Community, Privacy, and Terms.
- Bodyweight-only exercise and program catalogues with searchable filters, form guidance, progression ladders, admin-managed copy/media, and ordered program samples.
- Manus OAuth sign-in, member profile/preferences, protected workout player and completion history, progress entries/charts, and community milestones/challenge participation.
- Flexible meal ideas and meal-plan generation based on familiar foods. Nutrition content is educational, not individual medical advice; supplements are not required.
- Role-gated administrator pages for exercise, program, meal, and member-role management.

## Project structure

```text
client/src/pages/          Public, member, admin, and legal page components
client/src/App.tsx         Navigation and route access gates
client/src/index.css       Global tokens and the FORGE design system
client/src/forge.css       FORGE-specific component styles
server/forge.ts            Validated tRPC procedures and authorization rules
server/forgeDb.ts          Drizzle query helpers for FORGE data
server/db.ts               Shared MySQL/TiDB connection and user helpers
drizzle/schema.ts          User and FORGE relational schema
drizzle/                   Generated SQL migrations and journal
shared/catalog.ts          Canonical starter catalog and safe fallbacks
todo.md                    Feature progress and verification checklist
SERVICE_NOTES.md           Runtime architecture, services, security, and operations
```

## Local development

Use Node.js 22 and pnpm. In a configured WebDev project, credentials are supplied through the project environment; do not create or commit a `.env` file with production secrets.

```bash
pnpm install
pnpm drizzle-kit migrate
pnpm dev
```

Run quality checks before a handoff:

```bash
pnpm check
pnpm test
pnpm build
```

The dev server is the local preview. The project does not need a separate worker process. `pnpm start` runs the built server after `pnpm build`.

## Environment and services

Configure these through the WebDev project environment or your deployment's secret manager. Never place secret values in source control or `VITE_*` code.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL/TiDB connection used by Drizzle; required for persistent member and catalogue features. |
| `JWT_SECRET` | Server-side session-cookie signing secret. |
| `VITE_APP_ID` | Manus OAuth application identifier. |
| `OAUTH_SERVER_URL` | Manus OAuth server base URL. |
| `VITE_OAUTH_PORTAL_URL` | Browser sign-in portal URL. |
| `OWNER_OPEN_ID`, `OWNER_NAME` | Initial owner identity; the matching OAuth identity is granted the owner/admin role by the existing user upsert. |
| `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` | Server-side credentials for managed object storage used by admin media uploads. |

FORGE does not require an AI-model key, payment provider, analytics API, or social-network credentials. Workout and meal suggestions use deterministic catalogue rules, not an AI or clinical service. The WebDev platform provisions managed services and OAuth configuration.

## Database and catalogue

The schema is in `drizzle/schema.ts`; generated migrations and their journal are in `drizzle/`. The migrations create FORGE tables, add ordered program sample-workout storage, seed the initial catalogues, and make exercise equipment optional with a default of `None`. The latest data migration also updates built-in program/profile labels and synchronizes the bodyweight movement records.

On a new environment:

```bash
pnpm drizzle-kit migrate
```

When changing the schema, generate and review the migration before applying it:

```bash
pnpm drizzle-kit generate
# Review the new SQL in drizzle/ before applying it.
pnpm drizzle-kit migrate
```

Starter records are stored in the database so administrator edits can be reflected in public pages and recommendations. See `SERVICE_NOTES.md` for the handling of legacy equipment-dependent rows.

## Authentication, routes, and roles

Manus OAuth completes at `/api/oauth/callback`; the app uses the resulting server-managed session. Protected tRPC procedures derive the current user from the server context. Public pages remain browsable without an account; guest attempts to open `/workout/:id` are sent to sign-in with the selected workout as the return destination.

| Audience | Routes |
|---|---|
| Public | `/`, `/about`, `/how-it-works`, `/programs`, `/programs/:slug`, `/exercises`, `/exercises/:slug`, `/nutrition`, `/community`, `/workouts`, `/login`, `/signup`, `/forgot-password`, `/privacy`, `/terms` |
| Signed-in members | `/dashboard`, `/workouts`, `/workout/:id`, `/progress`, `/profile`, `/history` |
| Administrators | `/admin/login`, `/admin`, `/admin/exercises`, `/admin/programs`, `/admin/nutrition`, `/admin/users` |

`/admin/login` is a distinct admin entry point using the same Manus OAuth provider as member sign-in; it is not a separate password database. The configured owner identity receives initial access. Existing admins can grant/revoke other members' admin roles. The API blocks self-demotion and prevents demoting the last administrator.

## Media

Homepage and bodyweight form-reference photography use managed storage and `/manus-storage/...` paths. Do not put large media in `client/public/` or the source tree. Admin exercise media uploads are server-authorized and support JPEG, PNG, WebP, MP4, and WebM up to 8 MB. Storage is provided by the configured Manus WebDev service; there is no separate user-managed bucket key in the frontend.

## Deployment

Use the WebDev project's checkpoint and Publish flow. Ensure the target environment has the required OAuth, database, owner, and storage configuration; apply Drizzle migrations before serving new routes. `pnpm build` creates the Vite client and Node server bundle. The managed production runtime is stateless/autoscaled, so the app intentionally does not rely on in-process jobs, local uploaded files, or long-lived background workers. See [SERVICE_NOTES.md](./SERVICE_NOTES.md) for the architecture and operating notes.

## Known limitations

- Authentication is Manus OAuth; there is no standalone password account system or independent admin credential store.
- A signed-in member/admin smoke test is still needed before a broad public launch (profile save, workout completion, history/progress refresh, admin CRUD/media). No synthetic identities or records were added to the shared database during this build.
- Workout and meal planners are deterministic; recommendations are a flexible starting point, not AI personalization.
- The latest production build emits a Vite chunk-size advisory. The largest client bundle is about 987 kB minified / 271 kB gzip; lazy-loading admin/chart code is a follow-up if measurements show that it materially affects users.
- General fitness and food guidance is not medical, rehabilitation, pregnancy, or individualized nutrition advice.
