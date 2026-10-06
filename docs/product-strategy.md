# GwenBooks: technical and product assessment

**Assessment date:** 5 October 2026  
**Scope:** source tree, local configuration, production HTTP behavior, and public documentation from upstream book and study products. No production database or Vercel project settings were available for inspection. Environment variable names were inventoried without exposing values.

## Executive assessment

GwenBooks is an existing Next.js App Router application with a PostgreSQL/Neon database, Auth.js sessions, public book discovery, a full-text reader, user accounts, and book upload moderation. Its strongest working foundation is the reader plus live metadata/text sources. It currently has no demonstrated product advantage over free public-domain libraries, and the profile workflow is partly disconnected from its APIs. It should not be marketed as a broad digital library or an AI research product yet.

**Current broad-library idea: 2/10.** Continue only as a focused product experiment, not as a feature expansion. The product hypothesis to validate is a structured reading workspace for literature and history students working with public-domain primary texts. That focus uses the existing reader and text sources, but its commercial viability is unproven. If students do not repeatedly return for question-led reading and course-linked context, stop or reposition before investing in AI or institutional sales.

## 1. What exists today

- **Framework:** Next.js 14 App Router, React 18, TypeScript, Tailwind, client and server components. Route groups include `(auth)` and `(root)`.
- **Authentication:** Auth.js / NextAuth v5 beta with JWT sessions, credential sign-up/sign-in, Google sign-in, email verification, password reset, and account approval fields. The initial source had two conflicting Auth.js configurations; this revision uses one edge-safe shared configuration for middleware and the server-side handlers.
- **Database:** Neon serverless Postgres accessed with Drizzle. Schema includes users/roles/status, books, borrow records, reset tokens, favorites, reading progress, uploaded books, pending uploads, and notifications. Migrations are present through migration 0012. Runtime database contents and migration state were not queried.
- **Book data:** Gutendex (Project Gutenberg catalogue), Open Library, Internet Archive, Wikisource, and OpenStax image host configuration. Discovery searches Gutendex, Open Library/Archive and Wikisource; the library route separately requests popular English Gutendex text books. There is no first-party catalogue API or durable provider cache.
- **Reader:** Fetches a source text server-side, normalizes and chunks text, then presents paginated reading, local reading preferences/progress, favorites, sharing, and PDF export. The former summary control called a placeholder endpoint that returned the first few lines, not an AI summary; this misleading control and endpoint were removed in this revision.
- **User experience:** landing page, search, book reader, sign-up/sign-in, profile, uploads, and admin screens. The initial profile used a fixed Open Library “best books” query, not personalization; this revision removes that panel and loads the user's saved favorites/progress from authenticated endpoints.
- **Uploads:** Supabase Storage service role from a server endpoint; user-submitted files are marked pending. Admin moderation routes and pages exist in duplicate/inconsistent forms.
- **External services/config:** Neon, Upstash Redis and Workflow, Supabase Storage, ImageKit, SMTP/Gmail, Google OAuth, Vercel Analytics. `.env` variable names are configured for these services; their live credentials, service health, and Vercel environment settings were not inspected.
- **Caching/rate limits:** in-memory 5-minute book-search and Archive metadata maps (per process/instance); Next fetch revalidation on one library request; Upstash fixed-window limiter used for credential sign-in/sign-up. Search, uploads, AI placeholder, and most provider calls have no app-level rate limit.
- **Deployment:** `vercel.json` sets build environment variables but no routes/rewrites. `next.config.js` has image hosts and still skips lint during builds because the repository has existing lint errors. This revision re-enables build type checking; `npx tsc --noEmit --incremental false` now passes. Git main matches the observed deployed commit. The pre-build `.next` output was stale/incomplete and had no route artifacts for `/library` or `/my-profile`.
- **Dependencies:** Next 14 with `eslint-config-next` 15, React 18 with React type packages 19, Auth.js beta, Drizzle/Neon, Upstash, Supabase, ImageKit, Nodemailer, and a large unused/unclear UI and image-processing set. Package name still says `university-library`.

## 2. What works, is incomplete, and has value

### Verified from code / live deployment

- `/` and `/sign-in` return the app shell in production. Direct unauthenticated requests to `/library` and `/my-profile` currently return a “This page could not be found” document with HTTP 200. `/library` is matched by Vercel as a route, so it is not a missing rewrite. Its local implementation calls `notFound()` if the Gutendex request yields no books; a provider failure is therefore rendered as a missing page. The incomplete `.next` directory is consistent with route build output being stale, but cannot alone establish why the deployed response has an empty catalogue.
- `/library` is intentionally outside the authenticated `(root)` route group and should be public.
- The `(root)` layout calls `auth()` server-side and redirects unauthenticated users to `/sign-in`. This is the correct boundary for `/my-profile`, if the route is present in the deployment. A URL alone cannot satisfy that check. The profile route group is used for `/my-profile`; it should remain protected. Authenticated/unauthenticated browser refreshes were not possible without a test account; live direct unauthenticated navigation was checked.
- Reader progress is written to localStorage and POSTed to `/api/progress/save`; favorite changes are POSTed to authenticated add/remove endpoints. The profile previously POSTed to those endpoints as if they were reads. This revision adds authenticated GET paths, fixes profile retrieval, and persists source-qualified book IDs from the reader.
- The reader uses the current fetched text rather than fabricated content. Provider returns can be empty or unavailable and are silently collapsed in several places.

### Clearly broken, incomplete, or cosmetic

- **Broken route state:** the library translates an empty provider response into 404 UI; deployment currently shows that empty-page behavior. Its “popular” listing is a live external query, not a curated or owned catalogue.
- **Auth split (fixed in this revision):** Google sign-in used the `/api/auth/[...nextauth]` handler wired to a second config; its Credentials provider returned the hard-coded ID `1`, while normal credential sign-in used a different config and real database UUIDs. The handler now shares `auth.ts`, Google users map to database UUIDs, and credential access requires `APPROVED` status.
- **Authorization gaps:** the `/admin` layout checks the database role, and admin user APIs check it, but `/api/books/pending`, `/api/books/list`, `/api/books/approve`, and `/api/books/reject` do not. These expose uploader emails/files and allow unauthenticated moderation. UI route protection is not sufficient for these API mutations.
- **Profile is not personalization:** “Best Books” calls a fixed Open Library query; it is neither a recommendation nor based on user goals.
- **Former AI label was inaccurate:** `/api/ai/summarize` was unauthenticated, accepted unbounded JSON/text, and returned the beginning of the text. It was a naive excerpt operation, not AI; this revision removes the endpoint and reader control.
- **Legacy/dangling flows:** separate upload/moderation endpoints and pages disagree on paths and payload shape. Some admin forms, borrow schema, notification schema, auth workflow, image endpoints, and fallback downloads have no clear working user journey. `BookOverview` displays a user ID and borrow UI without corresponding transactional functionality.
- **Cosmetic values:** generic rating fields and default genres are not sourced from live ratings; placeholder covers, placeholder descriptions, decorative status and progress may look like catalogue content. They must never be treated as usage or popularity evidence.

## 3. Architecture, debt, and security findings

1. **High — unauthenticated book moderation (fixed in this revision).** Pending/list APIs exposed upload metadata; approve/reject APIs mutated state without checking role. These endpoints now require a server-verified ADMIN role.
2. **High — split identity implementation (fixed in this revision).** Two NextAuth configs created inconsistent IDs and credentials. The route handler now uses the same config as middleware; Google identities map to a persisted GwenBooks user.
3. **High — account status enforcement (fixed in this revision).** Credential authorization and protected layouts now require `APPROVED`.
4. **High — uploaded documents are served from a public Supabase URL.** The service-role upload endpoint now restricts submissions to PDF/EPUB under 4 MB and checks account approval, but storage objects are still stored public, byte-level inspection is absent, and uploads lack rate limiting. This risks exposure and storage abuse. Do not rely on the UI status field for privacy.
5. **Medium — former AI endpoint resource abuse and misrepresentation (removed in this revision).** It had no auth/rate/size/schema bounds, and returned a text excerpt rather than a summary. Any replacement needs a grounded design.
6. **Medium — insufficient schema constraints.** Favorites/progress use unconstrained text user/book IDs; favorites lack a unique constraint; repeated favorites could duplicate. Reads now exist and duplicate favorite inserts are avoided at the application layer, but a database uniqueness constraint and password-null support for OAuth accounts remain follow-up work.
7. **Medium — open URL/content handling.** Reader takes source URLs through query parameters, with partial host validation in `fetchBooks`; HTML is regex-stripped. Provider text should be bounded and sanitized with tested formats. The download proxy has a host allowlist and redirect validation, a useful control, but fetch size/time caps remain relevant.
8. **Medium — weak abuse controls.** Sign-up/sign-in share an IP bucket of three requests per minute and trust the first forwarded-for value. Search, uploads, verification/reset, and admin endpoints lack consistent abuse limits. Search fan-out has three external providers; in-memory caching is not shared across Vercel instances.
9. **Operational debt:** dependency versions/types mismatch and no test suite is defined. The initial lint command opened Next's interactive setup; this revision makes it run ESLint directly, but existing lint errors remain and the build skips lint. Build type checking is re-enabled and passes. `next-env.d.ts` is generated/untracked, and the initial `.next` output was incomplete. No structured logging/observability or error monitoring was found.
10. **Data/licensing:** Open Library asks app builders to register their use case and says its APIs are not intended as a third-party data backend. Project Gutenberg advises non-US users to check local copyright and restricts use of its trademark in commercial use. An East African launch must evaluate work/translation rights country-by-country. Do not mirror provider books or imply every provider item is globally public domain.

## 4. Route access policy

| Route | Policy | Enforcement |
| --- | --- | --- |
| `/`, `/sign-in`, `/sign-up`, `/verify`, `/forgot-password`, `/reset-password` | Public | Public shell; sign-in pages may redirect an existing session for convenience |
| `/library`, `/books/search`, public `/read/[id]` | Public | Provider-backed results; empty/error state remains a valid page |
| `/my-profile`, `/users/*` | Authenticated, approved account | Server layout/page guard plus per-user authenticated APIs; redirect to sign-in when no session |
| `/admin/*` | Authenticated database role `ADMIN` | Server layout and each API mutation/read independently check current database role |
| `/api/auth/*` | Public protocol endpoints | Auth.js provider validation and secure cookie/session configuration |
| `/api/books/search`, `/api/books/[id]`, public content download | Public, bounded | Input validation, provider allowlist, timeouts and rate limits |
| `/api/favorites/*`, `/api/progress/*`, upload APIs | Authenticated user | Derive owner only from session; never accept caller-supplied user ID |
| `/api/admin/*`, book moderation APIs | Admin only | Current database role check on every request |

## 5. Product opportunity assessment

Ratings below are comparative hypotheses from code fit and publicly documented alternatives, not market research or user interviews. Willingness to pay is unverified.

| Candidate | Severity / frequency and first users | Alternatives and gap | Fit, cost, recurrence, judgment |
| --- | --- | --- | --- |
| Generic free digital library | Low-to-medium / occasional; general readers | Gutenberg, Open Library, Internet Archive already have larger catalogues and trusted access | Easy to operate but no moat, very low willingness to pay and retention. **Do not pursue as a business.** |
| Find course-relevant books/textbooks cheaply | High / each term; university students | Campus libraries, Google, OpenStax, course sites; availability varies by institution and licensed textbook | Current app lacks syllabi, local catalogue rights, and textbook coverage. OpenStax already offers peer-reviewed free books. Could serve an institution only after partnerships/content clearance. **Promising need, poor current fit.** |
| Prepare for literature/history reading with primary sources | Medium-high / weekly during courses; literature/history undergraduates and independent learners | Google Scholar finds scholarly books/papers; NotebookLM supports source discovery and grounded Q&A; Gutenberg exposes full texts. The gap to test is a course-task-to-primary-text reading path with short contextual orientation and saved notes, not another general search engine. | Goodest current fit: reader and public-domain texts exist. Sources are uneven, not course-linked, and text search is crude. Human curation/context is ongoing cost. Free individual use likely; instructor/department plans possible later. **Best experiment, not validated business.** |
| Grounded AI tutor for difficult books | High / frequent for some students | NotebookLM and general AI tools already support document Q&A with citations; textbooks often have companion resources. | GwenBooks has no real AI provider, chunk retrieval, citations, evaluations, or budget controls. High API/legal/privacy costs and crowded. **Do not build now.** |
| Personal knowledge manager from reading | Medium / weekly for serious readers | Notion, Obsidian, Readwise and reader apps have notes, highlights and retrieval. | Current notes are absent and existing generic reader has no import/export ecosystem. High switching cost and retention needs. **Later only after repeat readership evidence.** |

### Primary direction

**Test a reading workspace for literature and history students studying public-domain primary texts.** GwenBooks would help a student start from a course question, locate a legitimately readable source, orient to it, read it with progress saved, and retain their own evidence-linked notes. At present only catalogue search, reading, local progress, and favorites exist in partial form. The distinctive orientation and evidence-linked notes are planned, not current. The first validation should be interviews and a tiny manually curated pilot for one course; the code should not imply automated scholarly coverage.

The hardest constraint is distribution and specificity: student need is real in principle, but no interviews, course partnerships, usage data, or willingness-to-pay evidence were supplied. A free experience over public-domain books has low direct monetization. If one course does not show repeat use, GwenBooks is probably a useful personal project, not a venture-scale business.

## 6. Product specification

### Status labels

- **CURRENT:** public provider search, source-linked browser reading, local reading preferences, favorite/progress storage, user accounts, uploads awaiting moderation, and admin screens.
- **PLANNED:** one course-specific primary-source collection, source context, notes tied to a text location, exports, and an instructor pilot.
- **HYPOTHETICAL:** repeat student demand, willingness to pay, course/department subscriptions, retention improvements, and any market size or revenue projection. None has been measured.

### Identity

**GwenBooks helps literature and history students solve the “I have a course question but do not know which primary text is relevant or how to work through it” problem by connecting a narrow, source-verified collection to a focused reading and evidence-capture workflow.**

### Core workflow

Course question or assigned topic → search the limited collection by title/author/topic → inspect source, date, language, and reading availability → open full text → save progress and mark a passage/note tied to its source location → return to notes when preparing class discussion or an essay.

### MVP scope

**MUST HAVE**

- Public library/search routes that remain usable on provider outage and honestly say what is/was searched.
- A small, clearly scoped corpus of rights-reviewed literary/historical primary sources with source links and honest metadata.
- Reader, favorites/progress, account boundary, and notes anchored to a book/page or passage (only after schema/API design).
- User-visible report/source link and robust empty/loading/error states.
- Admin-only upload/moderation APIs, private upload storage, and deletion/retention rules.

**SHOULD HAVE**

- Course/reading-list collections created by an instructor or editor, with citations to authoritative source records.
- Export notes/citations in a simple open format.
- Basic usage instrumentation that records consent-respecting aggregate events, not invented or misleading book popularity.

**LATER**

- More regions, languages, and open textbook/scholarly sources after licensing and source reliability review.
- Evidence-grounded AI explanation over a selected passage, with exact source anchors, user limits, and measured answer quality/cost.
- Instructor or department subscriptions after a paid pilot.

**DO NOT BUILD**

- A generic “AI summarize any book” button, social feed/reviews/ratings, fake rankings, broad publisher catalogue, public file uploads without rights review, or a generic “personalized recommendations” label without behavior data.

## 7. Revenue model and economics

| Model | User pays for / reason | Revenue and costs | Risks / build difficulty |
| --- | --- | --- | --- |
| Freemium individual study plan (recommended first test) | Free discovery/reading; a small monthly plan for saved evidence notes, exports, and multiple course collections | Recurring if students return each term; direct cost mostly database/storage/support, with AI kept off by default | Student budgets are low; free alternatives are strong; must prove repeat use and payment before implementing billing. Medium effort. |
| Instructor/course collection | Instructor pays for prepared course workspace, source notes, reading lists, and class-level setup | Per-course or annual license; curation/onboarding and support dominate infra cost | Requires instructor trust, rights checks, and sales; longer cycle. More plausible than selling raw public-domain books. |
| Department/university license | SSO, private reading lists, usage reporting, and accessible readings | Annual recurring contract; support, integrations, privacy/security, procurement | Long procurement, institution's library already has products, and reports must not expose student reading without policy. High effort. |
| AI add-on | Bounded, passage-specific explanations with citations | Recurring/usage based, but each request causes model and retrieval cost | Hallucination, copyright/content input, per-user abuse and vendor dependence. Too early. |
| Affiliate links | Referral to legally available editions/print copies | Small non-recurring commission | Must disclose; irrelevant when readers choose free text; coverage and conversions unproven. Not a core model. |

**Recommendation:** validate a free, one-course pilot first. If it creates repeat use, test a paid instructor-created course collection, then a low-cost student plan for portable notes/export. There is no revenue today, no usage/traction evidence, and no unit economics to quote. Do not charge for access to texts whose source terms do not allow the proposed commercial use.

## 8. Differentiation, market, and pitch

The opportunity is a workflow gap to validate, not a quantified market claim: public catalogues expose books, scholarly indexes expose references, and source-grounded study tools work over chosen documents. GwenBooks could connect a course prompt, a trustworthy open primary text, reading progress, and the student's own evidence-linked notes in one lightweight place. That is only differentiation if students actually use the path and educators trust the corpus. No TAM, user counts, conversion rates, traction, or revenue are asserted.

### Concise pitch (hypothesis)

- **Problem:** students face a gap between a broad course question and a primary text they can actually read and cite.
- **Solution/product:** GwenBooks is a focused primary-source reading workspace, not a replacement for a university library or scholarly index.
- **Target:** literature and history undergraduates, beginning with one course and a manually reviewed source set.
- **Why now:** open catalogues and browser reading are accessible; source-grounded study tools have made evidence-linked workflows familiar, but generic AI alone does not curate course-specific primary sources.
- **Differentiation:** one course question → source and rights context → full text → student-owned notes tied to a location.
- **Business model:** test instructor/course setup fees and only later an affordable student plan; no sale of book access.
- **Growth:** pilot with educators, measure course completion/repeat use, curate adjacent course sets, then approach departments if evidence supports it.
- **Technical advantage:** existing App Router, reader, user identity, progress/favorites, and external catalogue connections are a starting point, not a moat.
- **Roadmap:** route/auth reliability → one course corpus and evidence notes → instructor pilot → evaluate paid use → only then consider bounded AI or institution features.

## 9. Technical plan, data and risks

### Current architecture

Next.js App Router renders pages and API handlers. Auth.js JWT sessions are intended to guard server layouts; Drizzle uses Neon Postgres for users and reading state; Supabase Storage handles uploads; Upstash provides Redis, workflow, and a sign-up/sign-in rate limiter. The client reader fetches server-provided text and persists display preferences/progress in localStorage while also POSTing progress. External catalogue requests are issued from server-side functions with short in-memory caches and partial timeouts.

### Data sources and AI

- Gutendex supplies Project Gutenberg metadata and text-format URLs; cite and link to source records and retain per-work terms/territory caveats.
- Open Library provides catalogue metadata/covers; register the use case, follow its usage guidance, and do not treat it as a bulk backend.
- Internet Archive metadata/files are used only where current code infers open status; publication date alone is not proof of worldwide public-domain status. Verify each source/license.
- Wikisource supplies searchable text; attribution and reuse terms vary by work/edition.
- OpenStax host appears only in an image allowlist; no OpenStax catalogue integration was found.
- Current “AI” is deterministic excerpting (first lines); no model provider, embeddings, or retrieval system is configured. Planned AI must quote/cite selected passages and be optional; never promise trustworthy summaries before evaluation.

### Cost structure

Today: Vercel hosting/compute, Neon database, Upstash request/cache/workflow volume, Supabase storage/bandwidth, SMTP, ImageKit, and third-party catalogue load. Highest variable risk would be public file storage/downloads and future AI model calls. Current per-request search fans out to multiple providers; the in-memory cache does not reduce work across serverless instances. No measured bill or request volumes were available.

### Risks and controls needed

- **Legal:** country-specific public-domain status, translation/edition rights, third-party cover rights, Gutenberg trademark terms, and user-uploaded copyright.
- **Data/product:** thin catalogues, unreliable metadata, no content ownership, and no validated student demand.
- **AI:** hallucination, copied copyrighted input, privacy leakage, and unpredictable per-request cost.
- **Security/privacy:** remaining risks include public upload storage, missing byte-level content checks, weak abuse controls, and no deep review of Vercel or database production settings. This revision addresses the duplicate auth identity, approval checks, moderation authorization, and basic upload limits.
- **Competition:** large free repositories, search engines and increasingly capable source-grounded assistants; a reader UI is not a moat.
- **Operations:** provider rate limits, no shared cache/observability, deployment output mismatch, and suppressed type/build errors.

## 10. Roadmap

1. **MVP foundation (now):** restore build/deployment route reliability; unify auth; enforce account and role checks at pages/APIs; fix reading-state APIs; add true provider empty/error states.
2. **Course pilot:** validate with one literature/history educator; curate a small legally reviewed primary-source set; build evidence notes and clear source context only if interviews confirm this workflow.
3. **Version 2:** instructor collection management, export/citations, accessibility, and measured opt-in analytics.
4. **Future:** evaluate grounded passage Q&A and institutional contracts against usage, cost, quality, and procurement evidence.

## 11. Changes in this revision

This document records the initial audit and product hypothesis. Code changes in this work repair production route/error behavior, consolidate authentication identity, enforce account and admin boundaries, repair progress/favorite retrieval, and remove the misleading placeholder AI control. No catalogue seed data, book records, recommendation numbers, ratings, or AI results were fabricated. Course collections, notes, billing, and model-powered AI remain planned, not implemented.

## References

- Google Scholar describes its coverage and discovery of scholarly literature in its [Search Help](https://scholar.google.com/intl/us/scholar/help.html).
- Google describes NotebookLM's topic-based source discovery with Q&A, citations, and note taking in its [Discover Sources announcement](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-discover-sources/).
- Open Library's [API guidance](https://openlibrary.org/developers/api) asks applications to follow use guidelines and notes its API is not intended as a third-party data backend.
- Project Gutenberg's [Terms of Use](https://www.gutenberg.org/policy/terms_of_use.html), [permission guidance](https://www.gutenberg.org/policy/permission), and [license](https://www.gutenberg.org/policy/license) explain territory/copyright caveats and commercial trademark rules.
- OpenStax describes its current free, peer-reviewed, openly licensed higher-education materials on its [Higher Education page](https://openstax.org/higher-education).

