# CapriGestor Frontend — agent guide

## Source-of-truth hierarchy

Establish facts in this order:

1. tracked frontend code, tests, configuration, and CI;
2. current backend code, migrations, tests, configuration, and CI when the
   task crosses the API boundary;
3. `../backend/docs/00-overview/PROJECT_STATUS.md` — the versioned human
   current state for the product backend;
4. `../backend/docs/01-architecture/ARCHITECTURE.md`, API contracts, and
   module documentation relevant to the task;
5. historical ADRs, plans, audits, and roadmaps.

Do not rely on ignored or untracked local state files. Do not create a competing
product-status document in the frontend repository. When documentation and
current code differ, record the divergence and follow the repository evidence.

## Frontend responsibilities

- Maintain the React application, navigation, accessibility, HTTP integration,
  tests, build, and delivery configuration.
- Respect current API contracts, authorization semantics, and documented
  compatibility layers. Do not infer technical GoatId from a numeric token or
  remove RG compatibility without an explicit backend contract decision.
- Keep `farmId` isolation and role-dependent behavior aligned with backend
  authorization policies; do not recreate authorization decisions only in UI.
- Never expose credentials, tokens, secrets, or personal data.

## Safe workflow

1. Establish branch, base, `git status`, scope, and affected API consumers.
2. Read the relevant backend API contract and module documentation before a
   cross-boundary change.
3. Preserve behavior, route compatibility, accessibility, and error handling
   unless the task explicitly changes them.
4. Run focused frontend tests and build checks. Inspect the final diff and
   update applicable active documentation.

Do not make backend changes, database changes, deployments, commit, push,
merge, or open a PR without explicit authorization for that action.

## Documentation and language

Write all agent-facing instructions and Conventional Commits in English. Product
documentation may use Portuguese when it serves its intended audience. Update
backend current-state documentation only when an authorized, verified
cross-product change affects a fact it represents.

## Stop conditions

Stop and report before changing a public API contract, technical identity
transition, authorization semantics, persistent data, HML/production, or `main`.
For ambiguous contract or security work, report
`MODEL ESCALATION RECOMMENDED: <reason>`.
