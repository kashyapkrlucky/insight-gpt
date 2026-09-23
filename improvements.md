# Insight GPT — Review, Issues & Improvements

A full review of the codebase as of commit `0590a50`.
Baseline: `tsc --noEmit` is clean, `npm run lint` is clean, and `npm test` passes (8 files, 85 tests).

Each item has a priority:

- **P0**: security or data-correctness bug. Fix before showing this to anyone.
- **P1**: a real bug or broken feature that users will hit.
- **P2**: code quality, maintainability, or developer experience.
- **P3**: nice to have.

---

## 1. Security (P0)

### 1.1 Cross-tenant file read via client-supplied `url` — P0
`src/app/api/v1/documents/route.ts` accepts `url` (the storage path) from the request body and passes it to the `get-uploaded-file` job. That job downloads the file with the **service-role key** (`StorageServerService`). The server never checks that the path belongs to the caller. So any signed-in user (a guest user is enough) can send `{ url: "<victimUserId>/<file>.pdf" }`, get another user's PDF indexed into their own chat, and then ask questions about it.
**Fix:** build the storage path on the server, or at minimum require `url.startsWith(\`${userId}/\`)` (and reject a leading `/` and `..`). Better: have the server issue a signed upload URL (`createSignedUploadUrl`) for a path it chooses, and store only that path.

### 1.2 Storage bucket must be publicly writable — P0
The browser uploads with the Supabase publishable key (`StorageClientService`), but users authenticate with Atlas ID JWTs, not Supabase Auth. So storage RLS can't identify the user, which means the bucket policy has to allow anonymous inserts, and possibly reads and lists. Anyone holding the public key can then fill the bucket or read other people's files.
**Fix:** use server-issued signed upload URLs (see 1.1), lock the bucket down to service-role only, and serve files through short-lived signed URLs.

### 1.3 Weak JWT verification — P0
`verifyAccessToken` calls `jwtVerify(token, key)` with no `issuer`, `audience` or `algorithms` constraints. Any RS256 token signed by the same Atlas ID key is accepted, including tokens minted for other Atlas client apps.
**Fix:** pass `{ issuer, audience: CLIENT_ID, algorithms: ["RS256"] }` and check `exp`/`nbf` with a small clock tolerance.

### 1.4 Unbounded AI spend / no rate limiting — P0 for a public demo
Guest login plus `/api/v1/search` and `/api/v1/documents` with no rate limits, no per-user quotas and no input size cap means one script can burn the OpenAI budget. It can also queue unlimited Trigger.dev jobs, each up to 50 MB.
**Fix:** per-user and per-IP rate limits (Upstash Ratelimit or similar), daily token and document quotas for guests, and a `MAX_MESSAGE_CHARS` check on the server. The constant already exists but nothing uses it.

### 1.5 Tokens stored in `localStorage` — P1
Access and refresh tokens sit in `localStorage`, so any XSS can read them. The API already falls back to an `access_token` cookie, but nothing ever sets that cookie.
**Fix:** move to `httpOnly`, `Secure`, `SameSite=Lax` cookies set by a `/api/auth/callback` route handler, and drop the client-side token plumbing.

### 1.6 Prompt injection and unvalidated input — P1
- `/api/v1/search` does `const { question, chatId } = await req.json()` with no schema and no length limit.
- The document text and the question are placed straight into the prompt. A malicious PDF can say "ignore previous instructions…".
**Fix:** validate with zod, wrap context in clear delimiters (`<document>…</document>`), tell the model to treat that content as data, and cap the context length.

### 1.7 Missing security headers — P2
There's no CSP, `X-Frame-Options`, `Referrer-Policy` or `Permissions-Policy`. Add them through `headers()` in `next.config.ts` or in middleware.

### 1.8 Server-only boundaries — P2
`src/infra/db/connect.ts`, `src/infra/storage/server/*` and `StorageServerService` don't `import "server-only"`. That means the service-role client could be pulled into a client bundle by accident.

---

## 2. Correctness bugs (P1)

| # | Where | Problem | Fix |
|---|---|---|---|
| 2.1 | `api/v1/chats/[id]/messages/route.ts` | `findMany` has no `orderBy`. Postgres doesn't guarantee order, so messages can render shuffled. | `orderBy: { createdAt: "asc" }` |
| 2.2 | `api/v1/chats/route.ts` | Chats come back unordered. The "Recent Chats" list isn't sorted by recent. | `orderBy: { createdAt: "desc" }` |
| 2.3 | `Document.status` | Set to `"pending"` and **never updated**. The job doesn't write `processing`/`ready`/`failed` back. | Update the status in the job (start, success, `onFailure`), and return it with the chat. |
| 2.4 | `useChatStore.setCurrentChat` | Selecting any existing chat forces `fileProcessingStatus: "ready"`, even if indexing is still running or failed. After a page reload, a failed document looks ready and gives empty answers. | Drive the UI from `document.status` (2.3). Re-subscribe to the run if it's still processing. |
| 2.5 | `api/v1/chats/[id]/route.ts` DELETE | Deletes the chat, but the `Document` row is left behind (cascade only goes document → chat). The remove job is also triggered before the DB delete, so if the DB delete fails the vectors are already gone. | Delete the document (which cascades to chat and messages) inside one transaction, then trigger cleanup. |
| 2.6 | `getUploadedFile` job | Chunk IDs are `crypto.randomUUID()`, and the task retries up to 3 times. A retry after a partial failure **duplicates vectors**. | Use deterministic IDs (a UUIDv5 of `documentId:chunkIndex`), or delete by `documentId` before upserting. |
| 2.7 | `embedChunks` | Sends every chunk in **one** embeddings request. Large PDFs go over the per-request input and token limits and fail. | Batch requests (for example 100 chunks each), with retry and backoff. |
| 2.8 | `embedChunks` vs `embedQuery` | Ingestion hard-codes `text-embedding-3-small`, but queries use `AI_MODEL_TEXT_SMALL`. If the env var differs, the vectors live in different spaces or the dimensions don't match. | One shared `EMBEDDING_MODEL` constant or config. |
| 2.9 | Scanned or empty PDFs | `parsePdf` returns `""`, which gives 0 chunks, and then the embeddings call runs with an empty input and throws a confusing error. | Detect empty text and mark the document `failed` with the reason "no extractable text (scanned PDF?)". Optional OCR fallback. |
| 2.10 | Qdrant collection | `"insight-pdf"` is assumed to exist. Nothing creates it, and there are no payload indexes on `userId`/`documentId`, so filtered search does a full scan. | Add an idempotent `ensureCollection()` (size 1536, cosine) with keyword payload indexes, run at startup or through a setup script. |
| 2.11 | `/api/v1/search` | No `try/catch`. If the OpenAI or Qdrant call fails, the user message is already saved, so the chat is left with an unanswered question and an HTML 500. | Wrap the handler, return JSON errors, and save both messages in a transaction after generating the answer (or mark the answer as failed). |
| 2.12 | `/api/v1/search` | No conversation memory, so each question stands alone. Follow-ups like "tell me more about that" fail. `MAX_TRANSCRIPT_MESSAGES` exists but isn't used. | Send the last N messages, and optionally rewrite the question into a standalone query before retrieval. |
| 2.13 | `Uploader.tsx` | The input `accept` allows PNG/JPEG/WebP/GIF, but validation only allows PDF, and `APP_DESCRIPTION` says "pdf or image". | Pick one: accept only PDFs, or actually support images (OCR/vision). |
| 2.14 | `Uploader.tsx` | The label says "Drop in a document", but no drag-and-drop handler exists. | Add `onDrop`/`onDragOver`, or change the copy. |
| 2.15 | `internalApi.ts` | `baseURL` defaults to `http://localhost:3002/api`. The API is same-origin, so this breaks whenever `NEXT_PUBLIC_API_URL` isn't set. | Default to `"/api"`. |
| 2.16 | `externalApi.ts` | Reads `localStorage.getItem("token")`, a key that is never set, and on any 401 does a hard redirect even during login. | Remove the interceptor or use the real key. Don't hard-redirect from the login flow. |
| 2.17 | `FileLoaded.tsx` | `useRealtimeRun("")` is called when there's no run id. | Pass `enabled: !!trigger.id`, or render the component only when there is an id (the parent partly does this). |
| 2.18 | `StorageClientService` | Paths start with `/` (`/${userId}/…`), which gives inconsistent keys, and it uses the deprecated `substr`. | Drop the leading slash and use `crypto.randomUUID()`. |
| 2.19 | Chat deletion UX | There's no confirmation, and the delete button is `opacity-0` until hover, so it's invisible on touch devices and when focused with the keyboard. | Add a confirm dialog and `group-focus-within:opacity-100`, and always show it on mobile. |
| 2.20 | `layout.tsx` | Applies both font `className`s to `<html>`, so each one sets `font-family` and they compete. `index.css` then overrides `body` with a literal `"Geist"` family name, which doesn't match the `next/font` generated name. The CSS variables are never defined. | Use `geistSans.variable geistMono.variable` and let `--font-sans` apply. Remove the `body` `font-family`. |

---

## 3. Architecture & code quality (P2)

### 3.1 Everything is client-rendered
`app/page.tsx` is `"use client"`, auth checks happen in `useEffect`, and there's a loader flash on every visit. This doesn't use the App Router's strengths.
- Add `middleware.ts` (or `proxy.ts` in Next 16) for route protection based on the auth cookie.
- Use Server Components for the chat list and history. Use Server Actions or route handlers for mutations.
- Use URL-based routing (`/chat/[id]`) so chats can be linked to, shared, and survive a refresh. Right now the selected chat is lost on reload.

### 3.2 Dead and copy-pasted code
- `useChatStore.uploadFile`: unused duplicate of `createDocument`.
- `src/shared/types/index.ts`: `ChatMessage`, `ChatResponse`, `UploadedFileSummary`: unused.
- `IUser` has `password`, `avatarId` ("Cloudinary"), and `BaseEntity._id` (a MongoDB id), all copied from another project.
- `STARTER_PROMPTS`, `STORAGE_KEYS.tasks`, `TOKEN_KEY`, `TEXT_BY_CONTINUING/TERMS/PRIVACY`, `Badge`, `PageLink`, `formatErrorMessage`, `MaxFilesError`, `UploadError`, `monthYearOnly`, `clamp`, `newId`, `asDate`: check each and delete the unused ones.
- `cn()` is defined twice with different behavior (`shared/utils` with no tailwind-merge, and `infra/storage/utils` with it). Keep one, with tailwind-merge.
- The storage error classes live in `infra/storage/utils` but are generic. Move them to `shared/lib/errors`.
- `STARTER_PROMPTS` would be a nice feature. Render them as clickable chips in `NoMessage`.

### 3.3 Dependencies
- **Undeclared but imported:** `zod`, `jose`, `server-only`. They only resolve as transitive deps and could break on any install. Add them explicitly.
- **Junk packages:** `from` and `import` (probably a typo like `npm i import from ...`). Remove them.
- **Unused:** `@neondatabase/serverless` (Prisma uses `@prisma/adapter-pg`). Remove it or switch to the Neon adapter.
- `@types/pg` and `prisma` belong in `devDependencies`. `dotenv` isn't needed at runtime in Next.js.
- `trigger.config.ts` imports from `@trigger.dev/sdk/v3`. On v4, import from `@trigger.dev/sdk`.

### 3.4 Data layer
- **Prisma client singleton:** `connect.ts` creates a new client for each module instance. In dev with HMR this leaks connections. Use the `globalThis` singleton pattern.
- **Indexes:** add `@@index([userId])` on `Chat` and `Document`, and `@@index([chatId, createdAt])` on `Message`.
- **Enums:** `Message.author` → `enum Role { user assistant }`. `Document.status` → `enum DocumentStatus { pending processing ready failed }`.
- **The `User` model** isn't related to anything and is never written. Either upsert the user on login and add relations, or remove it.
- **Migrations:** there are 7 migrations all named `init`. Squash them into one meaningful baseline (the repo is young enough).
- **`src/generated/prisma` is committed**, but the build already runs `prisma generate`. Add it to `.gitignore` to cut noise from diffs.
- Store `pageCount`, `chunkCount`, `error` and `indexedAt` on `Document`.

### 3.5 Configuration
- There's no `.env.example`, and the README lists the wrong variable names (`OPENAI_API_KEY` vs `AI_API_KEY`, `SUPABASE_URL` vs `NEXT_PUBLIC_SUPABASE_URL`). It also leaves out `JWT_PUBLIC_KEY`, `NEXT_PUBLIC_AUTH_URL`, `NEXT_PUBLIC_CLIENT_ID`, `AI_MODEL_CHAT` and `AI_MODEL_TEXT_SMALL`.
- Add a typed env module (zod or `@t3-oss/env-nextjs`) that fails fast with a clear message and replaces the scattered `process.env.X!` non-null assertions.
- Put the Qdrant collection name, bucket name, chunk size/overlap, top-k and model names in one `config.ts`.
- `next.config.ts` allows `https://localhost` images and a hard-coded `atlas-id.vercel.app`. Drive these from env.

### 3.6 API design
- There's no consistent response envelope: `documents` returns `{ success, data, trigger, chat }`, DELETE returns a bare string, and others return raw rows. Standardize on `{ data }` / `{ error: { code, message } }`.
- `POST /documents` echoes `validatedData` rather than the created `document` (the client then uses `data.id`, which is `undefined`, so `currentFile` is always undefined).
- Add a shared `withAuth(handler)` wrapper to remove the repeated `getUserFromHeaders` / 401 / try-catch code in every route.
- `/search` is named for what it does internally. For a chat message it would read better as `POST /chats/:id/messages`.
- Add `GET /documents/:id` (status) and `DELETE /documents/:id`.

### 3.7 Styling
- `styles/index.css` sets global `a { color: #0070f3 }`, `ul` padding and `pre` backgrounds, which conflict with the Tailwind classes in `ChatMessage`. Remove them or scope them to a `.prose` class. Consider `@tailwindcss/typography`.
- The assistant name "Selene" is hard-coded in `ChatMessage`, `ChatContainer` and the system prompt, even though `ASSISTANT_NAME` exists.
- Hard-coded hex colors in `providers.tsx`. There's no dark mode.

### 3.8 Accessibility
- `ChatList` puts a `<button>` inside a `role="button"` div (nested interactive elements). Use a real `<button>` or link for the row with a sibling delete button.
- There's no `aria-live` region announcing new assistant messages or the "Preparing file" status.
- The message textarea has no `<label>` (only a placeholder).
- The user menu's `role="menuitem"` has no `role="menu"` parent, and there's no Escape-to-close or focus management.

---

## 4. RAG quality (P1–P2)

These are what separate a demo from a real RAG system:

1. **Citations and sources.** Store `pageNumber` per chunk (`unpdf` returns per-page text, which `parsePdf` currently joins together), return the retrieved chunks with the answer, and show clickable `[1]` `[2]` citations that open the PDF at that page. The README claims "Source retrieval", but the UI doesn't show sources.
2. **Streaming answers.** Use the OpenAI streaming API with a `ReadableStream` response, or the Vercel AI SDK `streamText`. It's the biggest perceived-speed improvement available.
3. **Score threshold.** `retrieveChunks` always returns 5 chunks, however irrelevant. Add `score_threshold`, and short-circuit to "not found" when nothing clears it.
4. **Better chunking.** Split per page with page metadata, keep headings, and tune chunk size (1000 chars / 200 overlap is fine as a start).
5. **Hybrid search.** Qdrant sparse vectors (BM25/SPLADE) plus dense vectors with RRF fusion. This helps with names, codes and numbers that embeddings miss.
6. **Re-ranking.** Retrieve 20, re-rank to 5 (Cohere Rerank, a cross-encoder, or an LLM re-rank).
7. **Query rewriting.** Turn conversational follow-ups into standalone queries (see 2.12).
8. **Multi-document chat.** Filter with `documentId IN [...]`. The data model already allows many chats per document. Add a "workspace" or collection concept.
9. **Document summary on ingest.** Generate a summary plus 3–5 suggested questions when indexing finishes, and show them as starter chips.
10. **OCR fallback** for scanned PDFs (Tesseract, Mistral OCR, or a vision model).
11. **Evaluation harness.** A small golden set of (PDF, question, expected answer or source page) pairs, scored for retrieval hit rate, faithfulness and answer relevance (Ragas-style or LLM-as-judge), run in CI on prompt or chunking changes. This is the single most impressive thing to show in a RAG portfolio piece.
12. **Token and cost tracking.** Save `usage` from each completion on the `Message` row and show it in an admin or stats view.

---

## 5. Testing (P2)

Current: 85 unit tests across stores, utils, JWT and one trivial health route. None of the highest-risk code is tested.

- **API route tests** (mock Prisma, Qdrant and OpenAI): the 401 path, **ownership / IDOR checks** (another user's chat returns 404, a foreign storage path is rejected), and validation failures.
- **Ingestion unit tests:** `chunkDocument` (sizes, overlap, metadata), `buildContext`, empty-PDF handling, embedding batching, deterministic IDs.
- **Job tests:** status transitions and cleanup on failure.
- **Component tests** with Testing Library: `MessageForm` (Enter vs Shift+Enter, disabled states), `Uploader` (type and size rejection), `ChatList`.
- **E2E (Playwright):** guest login → upload a fixture PDF → wait for "Ready" → ask a question → see an answer with a citation → delete the chat. Run it against a seeded test environment or use MSW.
- **RAG eval suite** (see 4.11).
- Add coverage reporting (`vitest --coverage`) and a badge.

## 6. CI/CD & DevOps (P2)

- CI runs lint, test and build. Add: an explicit `tsc --noEmit`, `prisma validate`, `prisma migrate diff` (drift check), `npm audit --omit=dev`, and Playwright E2E.
- Trigger.dev deploys: a workflow that runs `trigger.dev deploy` on `main`.
- Vercel preview deployments per PR, with a Neon branch database per preview.
- Dependabot or Renovate.
- `docker-compose.yml` with Postgres and Qdrant so contributors can run everything locally without cloud accounts.
- Missing `package.json` scripts: `trigger:dev` (the README references it), `typecheck`, `db:migrate`, `db:studio`, `format`.
- Add Prettier plus `lint-staged` and Husky. The formatting is currently inconsistent (see the blank-line-heavy `generateAnswer.ts` and `vectorDB/index.ts`).
- The health endpoint should check the DB and Qdrant (`/health?deep=1`). The `try/catch` around `new Response("OK")` does nothing.

## 7. Observability (P2)

- Replace `console.log` / `console.error` with a structured logger (pino).
- Error tracking with Sentry (client, server, and Trigger.dev tasks).
- LLM tracing with Langfuse, Helicone or LangSmith: prompts, retrieved chunks, latency, tokens and cost per request. This is also great material for the showcase.
- Request IDs passed from the API to the Trigger.dev job.

## 8. Documentation (P2)

The README is detailed but doesn't match the code in several places:
- It says **Next.js 15**, but the project uses 16.2.
- It lists "Server Actions", but none are used.
- The project structure shows `infrastructure/`, `vector-store/`, `config/` and `documents/`. The real folders are `infra/`, `vectorDB/`, `chats/`, and there's no `config/`.
- The env var names are wrong (see 3.5), and `npm run trigger:dev` doesn't exist.
- It says "MIT License" but there's no `LICENSE` file.
- "Fault-tolerant processing" is overstated while retries duplicate vectors (2.6).
- The screenshots are referenced, so make sure they're current.

---

## 9. Making this the best showcase project

The stack is already a strong signal: Next.js 16, a background job queue, a vector DB, Prisma, CI and tests. To make it stand out, the goal is to show **engineering judgment**, not just a feature list. Suggested plan:

### Phase 1: make it trustworthy (1–2 days)
Fix every P0 and the P1 table above. A reviewer who spots the storage IDOR (1.1) or shuffled messages (2.1) will stop reading. Add `.env.example`, fix the README, and add a `LICENSE`.

### Phase 2: the "wow" demo (3–5 days)
1. **Live demo with a guest account and seeded sample PDFs** (for example a well-known public research paper and a sample contract), so a recruiter can try it in 10 seconds with no upload. Add rate limits (1.4) first.
2. **Streaming answers with inline citations**, plus a **side-by-side PDF viewer** (`react-pdf`) that jumps to and highlights the cited page. This is the one feature that makes a RAG app look production-grade.
3. **Live ingestion progress:** use Trigger.dev `metadata.set()` to stream "Parsing page 12/40 → Chunking → Embedding 120/300 → Done" into a progress bar. It shows off the realtime job architecture visually.
4. **Suggested questions and an auto-summary** on upload.
5. Polish: dark mode, a mobile layout, keyboard shortcuts (`⌘K` new chat, `/` focus input), empty states and toasts.

### Phase 3: show depth (the part that impresses senior engineers)
1. **A RAG evaluation dashboard.** Commit a golden dataset and an `npm run eval` script that reports retrieval hit@k, faithfulness and answer relevance, and publish the results table in the README. Then **show before/after numbers** for each improvement ("hybrid search + re-rank: hit@5 71% → 89%"). Almost no portfolio RAG projects do this, and it's the clearest proof that you understand the problem.
2. **An observability screenshot:** a Langfuse trace of one question, showing embed → retrieve → rerank → generate with latency and cost.
3. **Architecture Decision Records** (`docs/adr/`): why Qdrant over pgvector, why Trigger.dev over a Vercel cron or queue, the chunking strategy, the auth model. Short, dated, and honest about trade-offs.
4. **A Mermaid architecture diagram** in the README, replacing the ASCII flow. Include a sequence diagram for upload → index → query.
5. **A security section that's actually true:** document the tenant-isolation model (server-issued storage paths, Qdrant `userId` filter, ownership checks) and link to the tests that prove it.
6. **Numbers:** p50/p95 answer latency, cost per 100 questions, and indexing time per 100 pages.

### Phase 4: presentation
- A README hero section with a one-line pitch, a **30–60 second GIF or Loom** (upload → progress → streamed answer → click a citation → PDF page highlights), a live demo link, and badges (CI, coverage, license).
- A "What I'd do next / Known limitations" section. Being candid about limits reads as seniority.
- A short **technical write-up or blog post** ("Building a production-grade RAG app: what actually moved the eval numbers"), linked from the README and your portfolio.
- Pin the repo, add topics (`rag`, `nextjs`, `qdrant`, `openai`, `trigger-dev`, `llm`), and add a social preview image.
- Keep the git history clean: meaningful commit messages and PRs per feature (the existing PR workflow is a good start).

### Optional stretch features
- Multi-document workspaces ("chat across all my contracts").
- Structured extraction mode: "extract all dates, parties and amounts into a table", then export to CSV.
- Tool-calling agent mode: compare two documents, or search within a section.
- Swappable model providers (OpenAI / Anthropic / local via Ollama) behind one `ai` interface, which shows clean abstraction.
- Share a read-only chat via a link.

---

## 10. Quick-win checklist

Done on branch `security/api-hardening`: signed uploads with server-chosen paths (1.1, 1.2), strict JWT verification that rejects refresh tokens (1.3), in-memory rate limits (1.4), zod validation and prompt hardening (1.6), security headers (1.7), `server-only` boundaries (1.8), 2.1, 2.2, 2.5, 2.11, 2.13, 2.15, 2.16, and a shared `withAuth` route wrapper (3.6).
Still open from sections 1–2: httpOnly cookies (1.5), CSP, a shared rate-limit store, and the ingestion/status items (2.3, 2.4, 2.6–2.10).

- [x] Validate the storage path ownership in `POST /documents` (1.1)
- [x] Add `issuer` / `audience` / `algorithms` to `jwtVerify` (1.3)
- [x] Rate limit `/search` and `/documents` (1.4)
- [x] `orderBy` on messages and chats (2.1, 2.2)
- [ ] Write `Document.status` from the job and drive the UI from it (2.3, 2.4)
- [ ] Deterministic chunk IDs + batched embeddings + one shared embedding model constant (2.6–2.8)
- [x] `try/catch` + zod on `/search` (2.11, 1.6)
- [x] Declare `zod`, `jose`, `server-only`; remove `from`, `import`, `@neondatabase/serverless` (3.3)
- [ ] Prisma singleton, indexes, enums (3.4)
- [x] `.env.example`
- [ ] Typed env module + README fixes + `LICENSE` (3.5, 8)
- [x] Default `internalApi` baseURL to `/api` (2.15)
- [ ] Fix the font className bug (2.20)
