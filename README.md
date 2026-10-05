# CORVIZ — Verified Computer Science Learning Platform

CORVIZ teaches core data structures and algorithms through deterministic, step-by-step visual lessons. A lesson’s algorithmic facts come from the backend state machines and verified execution trace; narration and the explain-only AI Tutor describe that evidence rather than replace it.

## Key features

- Ten approved topics: Stack, Queue, Binary Search, Bubble Sort, Linear Search, Singly Linked List, Binary Search Tree (BST), Selection Sort, Two Pointers, and Breadth-First Search (BFS).
- Automatic playback executes the complete canonical sample sequence as separate backend operations. Each accepted operation updates the state, scene, narration, dry-run trace, and derived quiz.
- Manual operations use the same server-authoritative session and verified pipeline.
- Play, pause/resume, stop, replay, speed, and narration on/off controls.
- Deterministic dry runs, state-derived knowledge checks, and an explain-only AI Tutor.
- Auth, users, courses, lessons, enrollment, progress, quizzes, and quiz attempts API modules.

## Technology stack

- TypeScript/npm workspaces
- Backend: Node.js, Express 5, Mongoose/MongoDB, Zod
- Frontend: Next.js 16, React 19, CSS Modules
- Browser checks: Playwright
- Narration: browser Web Speech API; availability and voice selection depend on the browser/OS

## Architecture and verification

The lesson pipeline is:

### CKR → KVE → deterministic state machine → scene builder → VKVE → targeted self-healing → narration → explanation → dry run → quiz

- **CKR (Canonical Knowledge Representation)** records the topic definition, entities, invariants, valid operations, and edge cases.
- **KVE (Knowledge Verification Engine)** checks that the conceptual model satisfies the topic rules before execution.
- **Deterministic state machines** execute the supported operation contracts and produce the authoritative state trace.
- **VKVE (Visual Knowledge Verification Engine)** checks that the scene graph reflects the trace and preserves topic-specific semantics.
- **Self-healing** repairs supported visual mismatches and re-runs verification; it does not change the algorithm’s authoritative result.
- Narration, explanation, quiz answers, and dry-run rows derive from verified execution. The Tutor explains verified context and must not mutate the lesson state.

Automatic playback requests an initial-only verified session, then advances it via the existing `/api/v1/pipeline/interact` endpoint. The frontend does not submit state snapshots as authority or manufacture successful verification results.

## Requirements and installation

- Node.js 20.9 or newer and npm.
- A running MongoDB instance. Local example URI: `mongodb://127.0.0.1:27017/corviz`.
- From the repository root, install workspace dependencies:

```powershell
npm install
```

The backend loads its environment from `apps/backend/.env` (dotenv uses the backend process working directory when started with the workspace script). Do not commit `.env` files or place real secret values in this README. If the ignored local file is absent, create it with these names and your own local values:

```dotenv
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/corviz
JWT_SECRET=<your-local-secret>
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

`MONGODB_URI` and `JWT_SECRET` are required. `PORT` defaults to `5000`; `JWT_EXPIRES_IN` defaults to `7d`; `NODE_ENV` defaults to `development`. The backend exits if MongoDB cannot connect.

The frontend uses `NEXT_PUBLIC_API_URL`, defaulting to `http://localhost:5000/api/v1`. For a different backend URL, set it in `apps/frontend/.env.local` before starting Next.js, for example:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

Do not overwrite an existing local environment file just to follow the example; review and preserve its settings.

## Run locally

Start MongoDB first. Open two PowerShell terminals at the repository root.

Backend terminal:

```powershell
npm run dev:backend
```

Frontend terminal:

```powershell
npm run dev:frontend
```

Open `http://localhost:3000`. The backend health endpoint is `http://localhost:5000/health`. If port 3000 or 5000 is already occupied, stop the conflicting service or configure the ports/API URL consistently before starting the demo.

## Build and regression checks

Production builds:

```powershell
npm run build:backend
npm run build:frontend
```

The test files are run directly with `tsx` (there is no root `npm test` script):

```powershell
npx tsx apps/backend/src/tests/stack-pipeline.test.ts
npx tsx apps/backend/src/tests/approved-topics-pipeline.test.ts
npx tsx apps/backend/src/tests/semantic-tampering.test.ts
npx tsx apps/backend/src/tests/self-healing-topics.test.ts
npx tsx apps/backend/src/tests/narration-pipeline.test.ts
npx tsx apps/backend/src/tests/tutor-engine.test.ts
npx tsx apps/backend/src/tests/automatic-playback.test.ts
```

With the backend and frontend running at the default ports, run the Playwright checks:

```powershell
node browser-playback-verify.js
node browser-verify.js
```

Browser checks require Playwright’s Chromium browser to be installed. The automatic playback audit checks the complete sample sequence and verified state/scene/narration alignment for all ten topics; the interaction audit checks manual actions and controls covered by its scenarios. These are deterministic sample-path checks, not exhaustive testing of every possible input or browser/voice configuration.

## Audit results (2026-10-03)

The following were executed during the final submission audit:

- Stack pipeline, approved topics, semantic tampering, targeted self-healing, narration pipeline, tutor engine, and automatic-playback backend tests: passed.
- Backend and frontend production builds: passed. Next.js emitted a non-fatal warning that both the root and frontend directories contain lockfiles while inferring the workspace root.
- `browser-playback-verify.js`: passed for 37 verified operations across ten topic sequences; pause held the same scene/operation, and stop/topic changes after a verified step cancelled without late requests. Each topic also showed its quiz, dry run, and Tutor; asking the Tutor did not change the deterministic state.
- `browser-verify.js`: passed 16 direct manual interactions across all ten topics, per-topic playback/pause-resume/replay checks, plus browser speech play/pause/resume/stop; no console or page errors were reported.

## Known limitations

- Interactive pipeline sessions are held in an in-memory backend cache; restarting the backend invalidates active lesson sessions, so generate/replay the lesson again.
- The demo uses fixed canonical sample data and supported state-machine operations. It is not a general-purpose algorithm editor or a proof for arbitrary user-supplied inputs.
- Speech synthesis is provided by the browser/OS, not by an AI voice service; headless browsers may report the API without producing audible speech.
- MongoDB is required for the backend server to start, including when demonstrating deterministic pipeline lessons.
- A dedicated current project report, presentation deck, and viva document were not identified in the repository. The files named `1NPDPRO5` were inspected as Net Protector safe-file notices/placeholders, not usable project-report content; do not edit those files.

## Submission-material inventory

The repository includes source code, tests, browser verification scripts, and architecture-document locations. It did not contain a usable PowerPoint/PPTX deck or a viva document at the time of the audit. Prepare or obtain those college-specific materials separately if your submission requires them.
