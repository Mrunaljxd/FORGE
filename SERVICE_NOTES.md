# FORGE service and operations notes

## Runtime architecture

```text
Browser (React 19 + Vite-built client)
        │ typed calls under /api/trpc
        ▼
Express 4 + tRPC 11 server (one managed Node process)
        ├── Manus OAuth/session context
        ├── Drizzle ORM → managed MySQL/TiDB
        └── Managed storage API → object store for images/videos
```

The client uses Wouter routes and React Query through the generated tRPC client. Server contracts and validation live in `server/forge.ts`; feature queries live in `server/forgeDb.ts`. `server/_core` contains platform plumbing and is not a feature extension point. The app is designed for a stateless/autoscaled WebDev runtime: it does not require a background worker, locally persistent media, or cross-request in-memory state.

## Services and API keys

| Service | Used for | Configuration |
|---|---|---|
| Manus OAuth | Sign-in, callback, server-managed session | `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `JWT_SECRET` |
| Managed MySQL/TiDB | Profiles, catalogue, workout history, progress, community, account roles | `DATABASE_URL` |
| Managed Manus object storage | Starter imagery and authorized admin image/video uploads | `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` (server-side only) |

No AI model, payment, external analytics, email campaign, map, or social-account API is required by the implemented flows. Do not expose server credentials through client code or logs.

## Equipment-free product policy

- Time—not available equipment—is the selector constraint. Members choose 10, 20, 30, 45, or 60 minutes, a goal, and a level; equipment is not an input.
- Built-in exercise rows have `equipment = "None"`; the column is nullable/optional and defaults to `None`. Built-in programs show `None required`; profile equipment defaults to `None` and is no longer collected as a preference.
- Workouts use bodyweight only on a safe, clear floor; a wall is optional for balance or incline support. A mat, bench, pull-up bar, dumbbell, band, kettlebell, or machine is never required.
- Workout generation filters out movements requiring equipment. Focus and duration produce a six-movement 20-minute beginner strength example; regression tests cover all supplied durations and focus values.
- Progression tracks provide bodyweight movement variants. The workout detail UI exposes user-adjustable repetitions, hold duration, sets, tempo, range of motion, and exercise difficulty.
- `drizzle/0003_skinny_silver_sable.sql` changes exercise equipment nullability/defaults, updates profile/program labels, and upserts the current bodyweight seed movements/program descriptions in place.
- Five legacy equipment-dependent exercise records from the initial seed remain in the database rather than being deleted. Server catalog queries, the workout generator, and the admin catalog filter them out; all visible built-in exercise rows normalize to `equipment: "None"`. This is a deliberate non-destructive migration choice. If permanent data cleanup is later requested, handle it as a separate reviewed migration.

## Identity and access model

- Guests may read public catalogues and generate workout or meal-plan previews.
- A member session is required for profiles, workout playback/completion, saved history/progress, challenge participation, and posting support.
- Admin procedures use a server-side role gate, not a client-only route check. A regular user receives `FORBIDDEN` from the protected API even if they invoke it directly.
- The configured owner OAuth identity is assigned the owner/admin role by the established `upsertUser` logic. Additional roles are managed at `/admin/users`.
- Admin role changes are guarded against self-demotion and demotion of the last administrator. Keep at least one active owner/admin identity.
- `/admin/login` is a separate route/entry point, but uses the same OAuth provider as member login; authorization is separated by role.
- Workout routes preserve an internal `returnTo` destination through login. Guest navigation to `/workout/:id` redirects to `/login?returnTo=...`.

## Data and media handling

Database columns and relations are defined in `drizzle/schema.ts`. `pnpm drizzle-kit migrate` applies the checked-in migrations. Starter records are stored in the database and read by the public pages and recommendation flow so approved admin edits can be reflected. Program `sampleWorkouts` is stored as JSON text and preserves editor line order. Public programs are sorted in the Foundation, Strength, Mobility, Life Stage order.

Media is sent through `storagePut()` from the server. Only an authenticated admin can request an upload; accepted MIME types are JPEG, PNG, WebP, MP4, and WebM with an 8 MB size ceiling. Returned paths are managed-storage URLs, not local project files. The upload endpoint does not inspect media contents; use valid MIME types and conservative video sizes.

Account/profile data is limited to identity fields and optional fitness preferences (such as age range, goal, available time, and preferred days). Equipment is not a profile choice. Admin member lists expose basic account name/email/role/timestamps only to admins. Community posts are public content; do not post sensitive health or identifying details.

## Local operations

```bash
pnpm install
pnpm drizzle-kit migrate
pnpm dev
```

Validation and production bundle:

```bash
pnpm check
pnpm test
pnpm build
```

For a schema change, update `drizzle/schema.ts`, run `pnpm drizzle-kit generate`, inspect the SQL, then apply it with the migration workflow. Keep the schema, migration journal, and database synchronized. Never place database credentials, OAuth secrets, or storage keys in committed files.

## Deployment and release checklist

1. Confirm the environment has the OAuth, session, database, owner, and storage settings listed in `README.md`.
2. Apply migrations to the target environment before switching application code that expects new columns/tables or product defaults.
3. Run `pnpm check`, `pnpm test`, and `pnpm build`.
4. Verify the public preview, bodyweight workout generation, exercise/progression pages, guest workout return route, food filters, and responsive layouts.
5. Use the WebDev checkpoint/Publish flow. Do not add a separately managed background process; hosting is a single stateless Node service.
6. Before broad public launch, run member/admin end-to-end checks with authorized identities: profile save, workout start/complete, history/progress refresh, logout, admin CRUD, role guard, and media upload.

## Test coverage and known limitations

Vitest covers OAuth logout behavior, the exact six-movement 20-minute beginner strength recommendation, all offered duration/focus combinations, bodyweight seed/program defaults, complete progression coverage, guest completion denial, regular-member admin denial, role-change authorization, and administrator self-demotion prevention (9 tests pass across two files). Desktop preview screenshots were reviewed for home, selector, library/detail, programs, nutrition, and admin pages; earlier work also reviewed mobile breakpoints and a direct guest workout redirect. A signed-in member/admin data-mutation and upload smoke test still needs authorized test identities before a broad public production launch; no synthetic user or workout records were created in the shared database.

The workout selector and meal planner use deterministic rules and curated records, not AI personalization. The product is not a health-care service; content should avoid body-shaming, unsubstantiated claims, fake testimonials, or medical promises. The current Vite build reports a large-client-chunk advisory; largest bundle is about 987 kB minified (271 kB gzip). Consider route-level lazy loading if measurements show this materially affects users.
