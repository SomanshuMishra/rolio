# Auto Apply Jobs - Codebase Guide

**Master entry point for Claude AI sessions. Read this first.**

## Project Overview

Resume-driven AI job matching platform where users:
1. Create account + provide OpenAI/Claude API key
2. Upload resume → system parses it using pdfplumber + spaCy
3. Set preferences (salary, location, job role, remote preference)
4. Trigger job search → backend fetches from JSearch API + uses AI embeddings to rank matches
5. View matched jobs with match scores and reasons
6. Save/dismiss/apply to jobs

**Tech Stack**: Next.js (frontend) + FastAPI (backend) + PostgreSQL + AWS S3 + OpenAI/Claude APIs

---

## Key Architecture

**Frontend** (`/frontend`)
- Next.js 14 with App Router
- Framer Motion + Three.js for animations (landing page 3D particles, page transitions, card flips)
- Zustand + React Query for state & data fetching
- Pages: Landing → Auth (login/register) → Dashboard (profile, resume, jobs, settings)

**Backend** (`/backend`)
- FastAPI async API
- SQLAlchemy ORM with PostgreSQL
- Core services:
  - `services/resume_parser.py` — pdfplumber + spaCy for parsing PDFs
  - `services/ai_provider.py` — abstraction for OpenAI/Claude (embeddings + analysis)
  - `services/jsearch_client.py` — RapidAPI JSearch integration + job caching
  - `services/job_matcher.py` — cosine similarity scoring
  - `routers/auth.py` — JWT authentication
  - `routers/resume.py` — upload/retrieve resume
  - `routers/jobs.py` — search trigger + match retrieval
  - `routers/profile.py` — API key management (encrypted storage)

**Database** (PostgreSQL via Docker Compose)
- `users` — authentication
- `user_api_keys` — encrypted OpenAI/Claude keys
- `user_preferences` — role/location/salary filters
- `resumes` — parsed resume data + raw text
- `jobs_cache` — JSearch results (24hr cache)
- `user_job_matches` — computed matches with scores
- `user_job_actions` — saved/dismissed/applied tracking

**File Storage**: AWS S3 for uploaded resume PDFs

---

## Key Files & Concepts

### Critical Backend Files
- `app/main.py` — FastAPI app initialization + CORS setup
- `app/config.py` — Environment variables & settings
- `app/database.py` — SQLAlchemy engine & session factory
- `app/models/*.py` — SQLAlchemy models (User, Resume, Job, etc.)
- `app/schemas/*.py` — Pydantic request/response DTOs
- `app/routers/*.py` — API endpoint groups
- `app/services/*.py` — Business logic (parsing, AI, matching)
- `app/utils/security.py` — JWT, bcrypt, AES encryption for API keys
- `alembic/` — Database migrations

### Critical Frontend Files
- `src/app/layout.tsx` — Root layout + providers setup
- `src/app/page.tsx` — Landing page with animations
- `src/app/(auth)/login/page.tsx` — Login page
- `src/app/(auth)/register/page.tsx` — Register page
- `src/app/(dashboard)/layout.tsx` — Dashboard sidebar + nav wrapper
- `src/app/(dashboard)/resume/page.tsx` — Resume upload & parsing display
- `src/app/(dashboard)/jobs/page.tsx` — Job matches list
- `src/app/(dashboard)/settings/page.tsx` — API key + preference management
- `src/components/animations/*.tsx` — Reusable animation wrappers
- `src/lib/api.ts` — Axios instance with JWT interceptors
- `src/store/authStore.ts` — Zustand auth state
- `src/store/jobStore.ts` — Zustand job state

---

## Important Concepts

### Encrypted API Keys
User-provided OpenAI/Claude API keys are encrypted with AES-256 before storage. Decrypted only when making API calls in background jobs. Never logged or exposed.

### Job Matching Algorithm
1. Parse resume → extract skills, experience level, target roles
2. Fetch jobs from JSearch API → filter by user preferences (location, salary, remote)
3. Use user's chosen AI provider to generate embeddings for resume summary + job descriptions
4. Calculate cosine similarity between vectors
5. Rank & return top N matches with match score (0-100) + explanation

### Resume Parsing
Uses pdfplumber to extract text from PDF, spaCy NER for entity recognition (skills, companies, education), and regex patterns for structured fields (dates, degrees).

### Authentication
JWT with access token (30min) + refresh token (7 days). Refresh tokens stored in DB with rotation to prevent token reuse attacks.

---

## Development Workflow

### Local Setup
```bash
# Install dependencies
cd frontend && npm install
cd ../backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt

# Start database + redis
docker-compose up -d

# Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Run migrations
cd backend && alembic upgrade head

# Start servers
# Terminal 1: uvicorn app.main:app --reload
# Terminal 2 (frontend): npm run dev
```

### Key API Endpoints
- `POST /api/auth/register` → `POST /api/auth/login` → get JWT tokens
- `POST /api/profile/api-keys` → add encrypted API key
- `POST /api/resume/upload` → parse & store resume
- `POST /api/jobs/search` → trigger matching (uses user's API key + preferences)
- `GET /api/jobs/matches` → retrieve matched jobs with scores

### Testing User Flow
1. Register account
2. Add OpenAI/Claude API key in settings
3. Upload a sample resume (PDF)
4. Set preferences (salary, location, job role)
5. Trigger job search → verify real JSearch results + AI ranking
6. Check match scores are between 0-100 with reasonable explanations

---

## Related Documentation

- **docs/ARCHITECTURE.md** — Data flow diagrams, service boundaries, integration points
- **docs/API.md** — Complete API endpoint reference with schemas
- **docs/DATABASE.md** — Full schema with relationships + indexes
- **docs/ANIMATIONS.md** — Animation patterns, Framer Motion utilities, when to use what
- **docs/DEVELOPMENT.md** — Detailed local setup, debugging, Docker commands

---

## Common Tasks

**Add a new API endpoint**
1. Create Pydantic schema in `app/schemas/`
2. Create router function in `app/routers/`
3. Add to `app/main.py` with `app.include_router()`
4. Test via Swagger UI at `/docs`

**Parse a new field from resume**
1. Update `resume_parser.py` extraction logic
2. Update `Resume` model JSONB structure
3. Update `ResumeSchema` Pydantic model
4. Test with a real PDF resume

**Change job matching algorithm**
1. Edit `job_matcher.py` similarity scoring
2. Adjust weights if comparing multiple fields
3. Test with sample resume + jobs → verify scores make sense

**Add a new animation component**
1. Create in `frontend/src/components/animations/`
2. Use Framer Motion + GSAP for complex sequences
3. Prefer reusable, parametrized components
4. Add example in Storybook or component file

---

## Git Workflow

- Main branch: `master` (stable, deployable)
- Feature branches: `feature/xyz`, `bugfix/abc`
- Keep commits atomic & descriptive
- Run `black` + `flake8` before committing Python code

---

## Common Issues & Solutions

**"Module not found" errors in Python**
→ Activate venv: `source backend/venv/bin/activate`

**PostgreSQL connection refused**
→ Check docker: `docker-compose ps`, `docker-compose logs postgres`

**Resume parsing returns empty data**
→ Check PDF format (scanned PDFs won't extract text). Use `pdfplumber` CLI: `python -c "import pdfplumber; print(pdfplumber.open('file.pdf').pages[0].extract_text())"`

**AI embedding API fails**
→ Verify API key in settings, check RapidAPI/OpenAI account quota

**Jobs not matching**
→ Check JSearch API returns results, verify user preferences aren't too restrictive

---

## Next Steps When Adding Features

1. Update relevant docs (ARCHITECTURE.md, API.md)
2. Add database migration if schema changes
3. Create Pydantic schema + route
4. Implement service logic
5. Write integration test
6. Create frontend component with animations
7. Test e2e
