# FORGE project TODO

## Completed in the equipment-free update
- [x] Make bodyweight-only training the default experience; remove equipment as a recommendation/profile choice and state that no mat is required.
- [x] Update the selector to time (10/20/30/45/60 minutes), focus, and experience; return the six requested movements for the 20-minute beginner strength example.
- [x] Replace and expand the default exercise library with bodyweight strength, core, full-body, and mobility movements; show `Equipment: None`.
- [x] Add push-up, squat, and core progression tracks; expose repetition, hold duration, sets, tempo, range-of-motion, and difficulty options.
- [x] Update all default program copy/workout samples and sort Foundation, Strength, Mobility, Life Stage.
- [x] Apply migration `0003_skinny_silver_sable.sql`: optional/default equipment schema and current bodyweight seed/program defaults. Preserve legacy equipment-dependent DB rows but filter them from recommendation, public, and admin catalogs.
- [x] Update equipment-free exercise/program forms, profile defaults, imagery, responsive states, and public product copy.
- [x] Refresh FORGE with a soft warm-light theme: cream backgrounds, sage/terracotta accents, lighter imagery, warmer chart surfaces, and softer controls; behavior and data remain unchanged.
- [x] Replace slogan-like headlines with consistent, descriptive copy across the homepage and key public pages; align the document title and description.
- [x] Run `pnpm check`, `pnpm test` (9 tests passed), and `pnpm build`; confirm the project preview remains healthy.
- [x] Review desktop and mobile screenshots after the theme change.
- [x] Update setup, services, migration/security, deployment, and launch-limit notes in `README.md` and `SERVICE_NOTES.md`.

## Documented launch considerations
- [x] Record that full signed-in member/admin data-mutation/media-upload smoke tests need authorized identities. No synthetic user or workout records were added to the shared database.
- [x] Record the measured Vite client bundle advisory (about 987 kB minified / 271 kB gzip) and lazy-loading as an optimization option if it proves material.
