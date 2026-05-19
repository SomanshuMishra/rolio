# Architecture & Data Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       User Browser                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Next.js Frontend (React + Framer Motion + Three.js)    │   │
│  │  - Landing page (3D particles, animations)              │   │
│  │  - Auth (login/register with glassmorphism)             │   │
│  │  - Dashboard (resume, jobs, settings, profile)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS + JWT tokens
                       │ (access + refresh)
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Python)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ API Routers (REST endpoints)                             │   │
│  │  - auth.py (register, login, refresh, logout)           │   │
│  │  - profile.py (add/remove API keys, get profile)         │   │
│  │  - resume.py (upload, parse, retrieve)                  │   │
│  │  - jobs.py (search trigger, get matches, actions)       │   │
│  │  - settings.py (preferences CRUD)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                       │
│  ┌──────────────────────┴──────────────────────────────────┐   │
│  │                  Core Services                          │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ 1. Resume Parser Service                           │ │   │
│  │  │    - Input: PDF file from user upload             │ │   │
│  │  │    - Process: pdfplumber (text extraction)        │ │   │
│  │  │    - Process: spaCy NER (entity recognition)      │ │   │
│  │  │    - Output: Structured JSON (name, email,        │ │   │
│  │  │      phone, skills[], experience[], education[])  │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ 2. AI Provider Service                             │ │   │
│  │  │    - Abstraction layer for multiple providers     │ │   │
│  │  │    - Provider options: OpenAI, Anthropic Claude   │ │   │
│  │  │    - Methods:                                      │ │   │
│  │  │      * get_embedding(text) → vector               │ │   │
│  │  │      * analyze_match(resume, job) → score+reasons │ │   │
│  │  │    - Uses user's encrypted API key from DB        │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ 3. JSearch API Client                              │ │   │
│  │  │    - RapidAPI integration (free basic plan)        │ │   │
│  │  │    - Fetches real job listings from Indeed, etc.   │ │   │
│  │  │    - Input: job title, location, salary range     │ │   │
│  │  │    - Output: Job array with title, company,       │ │   │
│  │  │      location, salary, description, apply URL     │ │   │
│  │  │    - Caching: 24hr cache in DB to reduce calls    │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ 4. Job Matcher Service                             │ │   │
│  │  │    - Input: Parsed resume, user preferences, jobs  │ │   │
│  │  │    - Process:                                       │ │   │
│  │  │      1. Generate embeddings for resume summary     │ │   │
│  │  │      2. Generate embeddings for each job description│ │   │
│  │  │      3. Calculate cosine similarity                │ │   │
│  │  │      4. Filter by salary + location + remote pref  │ │   │
│  │  │      5. Rank by similarity score (0-100)           │ │   │
│  │  │    - Output: Ranked job list with match score      │ │   │
│  │  │      + explanation (why this job matched)          │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
           │                         │                    │
           │ PostgreSQL              │ S3                 │ OpenAI/Claude
           ▼                         ▼                    ▼
    ┌─────────────────┐      ┌──────────────┐     ┌─────────────────┐
    │   PostgreSQL    │      │   AWS S3     │     │  AI APIs        │
    │   (Docker)      │      │              │     │  (user keys)    │
    │ - users         │      │ - resumes/   │     │                 │
    │ - api_keys      │      │   PDFs       │     │ - Embeddings    │
    │ - resumes       │      │              │     │ - Analysis      │
    │ - jobs_cache    │      └──────────────┘     └─────────────────┘
    │ - matches       │
    │ - actions       │
    └─────────────────┘
```

## User Flow: Job Search

```
1. USER REGISTRATION & API KEY SETUP
   ├─ Frontend: Register form (email, password, name)
   ├─ POST /api/auth/register
   ├─ Backend: Hash password, create user, generate JWT tokens
   └─ Frontend: Store JWT + refresh token in localStorage

2. USER ADDS OPENAI/CLAUDE API KEY
   ├─ Frontend: Settings page, form to add API key (provider + key)
   ├─ POST /api/profile/api-keys
   ├─ Backend: Encrypt API key with AES-256, store in DB
   └─ Frontend: Clear form, show success message

3. USER UPLOADS RESUME
   ├─ Frontend: Drag-and-drop PDF upload
   ├─ POST /api/resume/upload (multipart/form-data)
   ├─ Backend: 
   │   ├─ Save PDF to AWS S3
   │   ├─ Extract text using pdfplumber
   │   ├─ Parse with spaCy (entities, skills, experience)
   │   └─ Store parsed JSON + raw text in DB
   └─ Frontend: Display extracted resume data

4. USER SETS JOB PREFERENCES
   ├─ Frontend: Preferences form (roles, locations, salary range, remote)
   ├─ PUT /api/settings/preferences
   ├─ Backend: Update user_preferences table
   └─ Frontend: Show confirmation

5. USER TRIGGERS JOB SEARCH
   ├─ Frontend: "Find Jobs" button
   ├─ POST /api/jobs/search
   ├─ Backend:
   │   ├─ Get user's resume + preferences + API key
   │   ├─ Query JSearch API (location + job role filters)
   │   ├─ Cache results in jobs_cache (24hr TTL)
   │   ├─ For each job:
   │   │   ├─ Generate resume embedding (via user's AI provider)
   │   │   ├─ Generate job description embedding
   │   │   ├─ Calculate cosine similarity (0-100 scale)
   │   │   ├─ Apply salary + remote filters
   │   │   ├─ Store match result in user_job_matches
   │   │   └─ Generate match explanation (why matched)
   │   └─ Return top N matches sorted by score
   └─ Frontend: Display job cards with match scores

6. USER INTERACTS WITH JOBS
   ├─ Save job: POST /api/jobs/{id}/save
   ├─ Dismiss job: POST /api/jobs/{id}/dismiss
   ├─ Apply: POST /api/jobs/{id}/apply (open external link)
   └─ Backend: Track action in user_job_actions table
```

## Data Flow: Job Matching Algorithm

```
Input:
  Resume (parsed):
    {
      name: "John Doe",
      email: "john@example.com",
      skills: ["Python", "React", "PostgreSQL", "AWS"],
      experience: "5 years backend engineer",
      target_roles: ["Senior Backend Engineer", "Full Stack Engineer"]
    }
  
  User Preferences:
    {
      preferred_roles: ["Backend", "Full Stack"],
      preferred_locations: ["San Francisco", "Remote"],
      salary_min: 120000,
      salary_max: 200000,
      remote_preference: "remote"
    }

  Job (from JSearch):
    {
      title: "Senior Backend Engineer",
      company: "TechCorp",
      location: "San Francisco, CA",
      salary_min: 140000,
      salary_max: 180000,
      description: "Looking for an experienced Python engineer...",
      is_remote: true
    }

Process:
  1. Resume Summary Embedding
     resume_text = "John Doe, Senior Backend Engineer with 5 years experience..."
     resume_embedding = ai_provider.get_embedding(resume_text)
     # Example: [0.12, 0.34, -0.56, 0.78, ..., 256 dimensions]

  2. Job Description Embedding
     job_text = "Senior Backend Engineer. TechCorp is looking for an experienced
                  Python engineer with 5+ years in backend development..."
     job_embedding = ai_provider.get_embedding(job_text)
     # Example: [0.15, 0.32, -0.54, 0.80, ..., 256 dimensions]

  3. Cosine Similarity Calculation
     similarity = cosine_distance(resume_embedding, job_embedding)
     # Range: -1 to 1, normalize to 0-100
     base_score = (similarity + 1) / 2 * 100  # 0-100

  4. Filter by Constraints
     if job.salary < preferences.salary_min: skip
     if job.salary > preferences.salary_max: skip
     if preferences.remote_only and not job.is_remote: skip
     if job.location not in preferences.locations: reduce_score by 10%

  5. Final Match Score
     final_score = base_score * constraint_multiplier
     # Range: 0-100

Output:
  {
    job_id: 12345,
    match_score: 87.5,
    match_reasons: [
      "Strong Python skills match (5+ years)",
      "Location preference: Remote role available",
      "Salary range: $140k-$180k within preference",
      "Role title matches: Senior Backend Engineer"
    ]
  }
```

## Database Schema Overview

```
users
  id (PK)
  email (UNIQUE)
  hashed_password
  full_name
  created_at, updated_at
  is_active

user_api_keys
  id (PK)
  user_id (FK)
  provider (openai | anthropic)
  encrypted_key
  model_preference
  created_at
  (Indexes: user_id)

user_preferences
  id (PK)
  user_id (FK, UNIQUE)
  preferred_roles (TEXT[])
  preferred_locations (TEXT[])
  salary_min, salary_max
  remote_preference
  years_of_experience
  created_at, updated_at

resumes
  id (PK)
  user_id (FK, UNIQUE)
  filename
  s3_file_path
  parsed_data (JSONB)
  raw_text (TEXT)
  upload_date
  is_active
  (Indexes: user_id)

jobs_cache
  id (PK)
  jsearch_id (UNIQUE)
  title, company, location
  is_remote
  salary_min, salary_max
  description (TEXT)
  requirements (TEXT[])
  apply_url
  source
  posted_at
  cached_at
  (Indexes: cached_at for 24hr purge)

user_job_matches
  id (PK)
  user_id (FK)
  job_id (FK)
  match_score (0-100 FLOAT)
  match_reasons (JSONB)
  embedding_score (FLOAT)
  created_at
  (Indexes: user_id, created_at)

user_job_actions
  id (PK)
  user_id (FK)
  job_id (FK)
  action (saved | dismissed | applied)
  created_at
  (Indexes: user_id, job_id)
```

## Authentication Flow

```
1. LOGIN
   ├─ POST /api/auth/login (email, password)
   ├─ Backend:
   │   ├─ Look up user by email
   │   ├─ Verify password with bcrypt.verify()
   │   ├─ Generate JWT tokens:
   │   │   ├─ access_token (30min expiry)
   │   │   └─ refresh_token (7 day expiry, stored in DB with user_id)
   │   └─ Return both tokens
   └─ Frontend: Store in localStorage, set Axios Authorization header

2. AUTHENTICATED REQUEST
   ├─ Frontend: Attach JWT in Authorization: Bearer <token> header
   ├─ Backend: Middleware validates JWT signature + expiry
   └─ If valid → process request, if expired → return 401

3. TOKEN REFRESH
   ├─ Frontend detects 401 response
   ├─ POST /api/auth/refresh with refresh_token
   ├─ Backend:
   │   ├─ Verify refresh token signature
   │   ├─ Check token in DB (not revoked)
   │   ├─ Rotate: create new refresh token, delete old one
   │   └─ Return new access_token + new refresh_token
   └─ Frontend: Update localStorage, retry original request

4. LOGOUT
   ├─ POST /api/auth/logout
   ├─ Backend: Delete refresh_token from DB
   └─ Frontend: Clear localStorage, redirect to /login
```

## Deployment Architecture (Future)

```
Internet
  ↓
CDN (CloudFlare)
  ↓
┌──────────────────────────────────────────┐
│ Vercel (Next.js Frontend)                │
│ - Auto-deploy on git push                │
│ - Global CDN edge locations              │
│ - Serverless functions (optional)        │
└──────────────────────────────────────────┘
  ↓ HTTPS + JWT
┌──────────────────────────────────────────┐
│ Cloud Run / Heroku (FastAPI Backend)     │
│ - Docker container                       │
│ - Auto-scaling                           │
│ - Health checks                          │
└──────────────────────────────────────────┘
  ↓
┌──────────────────────────────────────────┐
│ Cloud SQL (PostgreSQL)                   │
│ - Managed DB                             │
│ - Automated backups                      │
│ - Point-in-time recovery                 │
└──────────────────────────────────────────┘
  ↓
AWS S3 (Resumes)
  ↓
OpenAI/Claude APIs (user's keys)
```

---

See **API.md** for complete endpoint specifications.
