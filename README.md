# MyFitness

A mobile-first workout and diet tracker. Plan the week muscle by muscle, run a
session set by set with a server-side timer, review consistency and streaks, and
keep a seven-day diet plan with a retrieval-grounded assistant.

## Stack

- **Backend:** Node 20+, Express, Mongoose/MongoDB, JWT in an httpOnly cookie,
  zod, multer/Cloudinary (local mock by default), pino, Vitest + supertest.
- **Frontend:** React 18 + Vite + TypeScript, Tailwind, shadcn-style components,
  TanStack Query, react-hook-form + zod, Recharts, sonner, vaul.
- **Design:** dark by default with a light toggle, mobile-first at 360px.

## Quick start

Prerequisites: Node 20+ and a MongoDB instance. The backend boots with dummy
values; avatars and the assistant run in mock mode.

```bash
npm install                 # root: concurrently
npm run install:all         # backend + frontend dependencies

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start MongoDB (or point MONGODB_URI at an existing database)
docker run --rm -d --name myfitness-mongo -p 27017:27017 mongo:7

npm run seed                # 70 library exercises (idempotent)
npm run ingest              # chunk and embed the sample knowledge base
npm run dev                 # API :5000 + web :5173
```

Open `http://localhost:5173`. API health: `http://localhost:5000/api/health`.

If you do not have Docker, install MongoDB locally or use a hosted URI in
`backend/.env`; only `MONGODB_URI` must be reachable.

## Environment and mocks

`backend/.env` (copied from `.env.example`):

- Keep the database name in `MONGODB_URI` exactly matching an existing database.
  Some MongoDB deployments reject a second name that differs only by case
  (for example `myFitness` vs `myfitness`).
- `JWT_SECRET` must be at least 32 characters.
- `CLOUDINARY_MOCK=true` saves avatars under `backend/uploads/` and serves them at
  `/uploads` outside production.
- `RAG_MOCK=true` forces deterministic embeddings and a schema-valid mock draft.
- `LLM_MODEL` and `EMBEDDING_MODEL` are `set_me_later` placeholders.

To use real services:

1. Set `CLOUDINARY_MOCK=false` and fill the Cloudinary keys.
2. Set `RAG_MOCK=false`, choose `LLM_PROVIDER=gemini|openai`, add a real
   `LLM_API_KEY`, and set current model names in `LLM_MODEL` /
   `EMBEDDING_MODEL`.
3. Re-run `npm run ingest` so the new embedding provider populates the store.

### Google Gemini setup (assistant)

Create a key in Google AI Studio and keep it on the server only. The same key is
used for generation and embeddings:

```env
RAG_MOCK=false
LLM_PROVIDER=gemini
LLM_API_KEY=your_google_ai_studio_key
LLM_MODEL=gemini-3.5-flash-lite        # or another current model your key can use
EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIMENSIONS=768               # optional; 768, 1536 or 3072
RAG_TOP_K=6
```

Restart the backend, add real `.md`/`.txt` reports to
`backend/src/rag/documents/`, then run `npm run ingest`. Embedding dimensions are
not hard-coded in the app: mock embeddings are 384-dimensional, while the real
provider returns what `EMBEDDING_DIMENSIONS` asks for (or the model default).
Re-ingest whenever the embedding model or dimensions change, otherwise stored
chunks and query vectors will not match.

There is **no Pinecone key** in this app. Retrieval uses cosine similarity over
`RagChunk` documents in MongoDB. A Pinecone (or Atlas Vector Search) adapter
would require a new vector-store implementation.

Never commit `.env`, uploads, build output, or secrets.

## Knowledge base

Put legally obtained `.md`/`.txt` reports in `backend/src/rag/documents/`, then:

```bash
npm run ingest
```

PDFs must be converted to text first. The repository includes three clearly
marked `SAMPLE – replace with real reports` text notes so the pipeline is
testable. Recommended sources to add yourself: WHO healthy-diet guidance,
ICMR-NIN Dietary Guidelines for Indians, FAO/WHO protein and energy reports, and
ACSM/ISSN sports-nutrition position statements. Do not add copyrighted material
you are not allowed to store. The generation flow cites retrieved chunks and
always adds a disclaimer. The assistant is limited to five generations per user per calendar
day (Asia/Kolkata default); usage is exposed at `/api/diet/assistant/usage`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | runs API and web together |
| `npm start` | starts the API only |
| `npm run build` | typechecks and builds the frontend |
| `npm test` | backend suite on an in-memory MongoDB |
| `npm run lint` | backend ESLint |
| `npm run seed` | seeds the exercise library |
| `npm run ingest` | re-chunks and embeds the knowledge base |
| `npm run install:all` | installs both app dependencies |
| `npm run verify:proxy` | builds the frontend, proxies `/api` to the backend and runs smoke + E2E through one origin |

## Folder map

```
backend/
  src/config/       env validation, database, Cloudinary
  src/models/       User, Exercise, WeeklyPlan, WorkoutSession, DietPlan, DietLog, RagChunk
  src/validators/   zod request schemas
  src/middleware/   auth, validation, errors, rate limits, upload
  src/routes/       auth, profile, exercises, plan, sessions, analytics, diet, assistant
  src/services/     business logic + RAG/LLM adapters
  src/rag/          chunker, ingest, vector store, prompts, documents
  src/seed/         exercise library data and runner
  tests/            API and service tests
frontend/
  src/app/          router, providers, layouts
  src/components/   shared components and UI primitives
  src/features/     auth, profile, landing, dashboard, plan, exercises, workout, progress, diet
  src/lib/          API client, zod schemas, dates, types
```

## Deploy

This project uses **one public origin**:

```
Browser -> Vercel static site -> /api/* rewrite -> Render web service
                                                   -> MongoDB Atlas
```

The browser never talks to Render directly. That keeps the JWT cookie
first-party, so `SameSite=Lax` is sufficient and no CORS or `SameSite=None`
cross-site setup is needed. Do not switch the cookie to `SameSite=None`.

### Deploy order

1. **Render first** (backend):
   - Create a Blueprint from `render.yaml` or a Node Web Service with
     `rootDir=backend`, build `npm ci`, start `npm start`, health check
     `/api/health`, region Singapore, free plan.
   - Add the environment variables listed below. Set the real values in the
     Render dashboard; `sync:false` entries stay out of the repository.
   - Wait for the service to become live; copy its `https://...onrender.com`
     URL.
2. **Update the Vercel rewrite**:
   - Edit `frontend/vercel.json` and replace
     `REPLACE_WITH_RENDER_URL` with the Render hostname (keep
     `https://...onrender.com/api/$1`).
   - Commit that change.
3. **Vercel second** (frontend):
   - Import the repository and set **Root Directory = `frontend`**.
   - Framework preset: Vite (or no framework; build `npm run build`, output
     `dist`).
   - Add `VITE_API_URL=/api` as a build environment variable.
   - Deploy. The public URL is the Vercel domain.

### Render environment variables (names only)

`NODE_ENV=production`, `COOKIE_SECURE=true`, `CLIENT_URL` (the final Vercel
domain), `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `TRUST_PROXY_HOPS=2`,
`ENABLE_IP_DEBUG=false`, `CLOUDINARY_MOCK=false`, `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_FOLDER`,
`RAG_MOCK=false`, `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`,
`EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS`, `RAG_TOP_K`, `LLM_TIMEOUT_MS`,
`APP_TIMEZONE`, `ASSISTANT_DAILY_LIMIT`, `LOGIN_PAIR_LIMIT`,
`LOGIN_IP_LIMIT`, `LOGIN_WINDOW_MINUTES`, `SIGNUP_IP_LIMIT`,
`SIGNUP_WINDOW_MINUTES`, `GLOBAL_IP_LIMIT`, `GLOBAL_WINDOW_MINUTES`,
`ALLOW_MOCK_IN_PROD=false`. Render supplies `PORT`; do not hard-code it.
Set `LLM_TIMEOUT_MS=115000` (Vercel's external rewrite limit is 120s; keep the
model timeout below it). The frontend assistant request timeout is 115s.

### Vercel environment variables (names only)

- `VITE_API_URL=/api` (build-time).

No backend secrets belong in Vercel; the browser only calls `/api` on the Vercel
origin and Vercel proxies to Render.

### Atlas network access for Render

Render's current docs do not publish a static global list of shared outbound
ranges; ranges are per region and can change. In the Render Dashboard open the
service -> **Connect -> Outbound** and add those CIDR ranges to MongoDB Atlas
Network Access. Use `0.0.0.0/0` only as a fallback if you accept that wider
access. If you need fixed addresses, use Render dedicated outbound IPs (paid) and
allowlist those. The Render region in `render.yaml` is Singapore; choose an Atlas
region close to it (for example AWS `ap-southeast-1`).

### One-time production data

From a machine that can reach production Atlas and with production env values:

```bash
cd backend
MONGODB_URI='<production-uri>' npm run seed:exercises
MONGODB_URI='<production-uri>' npm run rag:ingest
```

Both are idempotent. Use the same embedding model/dimensions as Render.

### Post-deploy checks

```bash
cd backend
npm run smoke:api -- --base-url=https://<vercel-domain>
MONGODB_URI='<production-uri>' npm run smoke:cleanup
```

The smoke script creates `smoke+*@example.test` users and removes nothing else;
run cleanup afterwards. It consumes five assistant generations.

To verify the real client IP:

1. Set `ENABLE_IP_DEBUG=true` on Render and redeploy.
2. Open `https://<vercel-domain>/api/debug/ip` (or curl it with the same
   headers). It returns `{ ip, xForwardedFor }`.
3. Confirm `ip` is the public client address (not a Render/Vercel proxy
   address). `TRUST_PROXY_HOPS=2` matches client -> Vercel -> Render proxy -> app.
4. Set `ENABLE_IP_DEBUG=false` again.

If the IP is one hop off, adjust `TRUST_PROXY_HOPS` (try 1 or 3) with the debug
route, then turn the route off.

### Free-tier cold start

Render free web services sleep after inactivity. The first request can take tens
of seconds. The UI shows **“Server is waking up, please wait…”** after five
seconds, and idempotent GET requests retry once on network/502/503/504. The
assistant can take longer than 60s for real providers but stays under the 115s
timeout and Vercel's 120s external-rewrite limit. Upgrade Render if cold starts
are unacceptable.

## Behaviour notes

- Dates are local `YYYY-MM-DD` strings from the client. Session creation accepts
  only yesterday, today, or tomorrow.
- A workout session snapshots the plan; later plan edits never rewrite history.
- The workout timer is server-derived. Refreshing never loses elapsed time; an
  idle session auto-finishes after four hours.
- Missed planned days score 0 for consistency; rest days are excluded. Streaks
  count consecutive planned days with at least 80% of sets completed.
- Diet totals and adherence are computed by the server. Clients never submit
  totals.
- All list pages have loading skeletons, empty states, and error retry.

## API and rules

The API endpoints, request bodies and error envelopes live in the Express routes
and controllers under `backend/src/routes/` and `backend/src/controllers/`.
Field rules are mirrored in `backend/src/validators/` (server) and
`frontend/src/lib/schemas/` (client), and documented in the source comments.
Deployment is described in the Deploy section above.

## Tests and verification

```bash
npm test              # backend unit/API tests
npm run verify        # full lint/test/build + API smoke + browser E2E
```

Install the Playwright browser once before the first E2E run:

```bash
cd frontend
npx playwright install chromium
```

`npm run verify` runs the backend suite, frontend typecheck/lint/build, seed,
ingest, and then a same-origin proxy verification: it builds the frontend with
`VITE_API_URL=/api`, starts the backend and a static server on port 4173 that
proxies `/api`, runs the API smoke flow and Playwright (390x844 + 1440x900), then
deletes `smoke+*@example.test` accounts and their data. It exits non-zero if any
step fails. `npm run verify:proxy` runs just that proxy layer (backend defaults
to port 5000, proxy to 4173).

The backend suite uses `mongodb-memory-server`, so unit tests do not touch the
configured database. The smoke/E2E steps do use the configured database and
create temporary users that the cleanup step removes.

Individual commands:

```bash
npm run smoke:api -- --base-url=http://localhost:5000
npm run smoke:cleanup
npm run test:e2e
```
