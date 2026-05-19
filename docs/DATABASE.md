# Database Schema

PostgreSQL database with tables for users, authentication, resumes, jobs, and matches.

---

## Tables

### users
Stores user account information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
```

---

### user_api_keys
Stores encrypted API keys for OpenAI and Anthropic Claude.

```sql
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('openai', 'anthropic')),
  encrypted_key TEXT NOT NULL,
  model_preference VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);
```

**Notes**:
- `encrypted_key`: AES-256 encrypted (never stored in plaintext)
- `provider`: 'openai' or 'anthropic'
- `model_preference`: e.g., 'gpt-4', 'claude-3-opus'
- Unique constraint ensures one key per provider per user

---

### user_preferences
User's job search preferences.

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  preferred_roles TEXT[] DEFAULT '{}',
  preferred_locations TEXT[] DEFAULT '{}',
  salary_min INTEGER,
  salary_max INTEGER,
  remote_preference VARCHAR(50) DEFAULT 'any' 
    CHECK (remote_preference IN ('remote', 'hybrid', 'onsite', 'any')),
  years_of_experience INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

**Notes**:
- `preferred_roles`: Array of job titles/roles
- `preferred_locations`: Array of cities/regions
- `salary_min, salary_max`: Annual salary range
- `remote_preference`: Job location flexibility

---

### resumes
Stores uploaded resume PDFs and parsed data.

```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255),
  s3_file_path TEXT NOT NULL,
  parsed_data JSONB NOT NULL,
  raw_text TEXT,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);
```

**parsed_data JSONB structure**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-0123",
  "location": "San Francisco, CA",
  "summary": "Experienced backend engineer with 5+ years...",
  "skills": ["Python", "FastAPI", "PostgreSQL", "AWS", "React"],
  "languages": ["English", "Spanish"],
  "certifications": ["AWS Solutions Architect", "CKA"],
  "experience": [
    {
      "company": "TechCorp",
      "role": "Senior Backend Engineer",
      "start_date": "2020-01",
      "end_date": "present",
      "location": "San Francisco, CA",
      "description": "Led backend architecture redesign...",
      "skills_used": ["Python", "FastAPI", "PostgreSQL"]
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "institution": "University of California",
      "graduation_year": 2018,
      "gpa": 3.8
    }
  ]
}
```

---

### jobs_cache
Caches job listings from JSearch API (24-hour TTL).

```sql
CREATE TABLE jobs_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jsearch_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  is_remote BOOLEAN DEFAULT FALSE,
  salary_min INTEGER,
  salary_max INTEGER,
  description TEXT,
  requirements TEXT[],
  apply_url TEXT NOT NULL,
  source VARCHAR(50) DEFAULT 'jsearch',
  posted_at TIMESTAMP,
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours'
);

CREATE INDEX idx_jobs_cache_jsearch_id ON jobs_cache(jsearch_id);
CREATE INDEX idx_jobs_cache_cached_at ON jobs_cache(cached_at);
CREATE INDEX idx_jobs_cache_expires_at ON jobs_cache(expires_at);
CREATE INDEX idx_jobs_cache_company ON jobs_cache(company);
CREATE INDEX idx_jobs_cache_location ON jobs_cache(location);
```

**Cleanup**: Periodically delete where `expires_at < NOW()`.

---

### user_job_matches
Stores computed job matches with AI-generated match scores.

```sql
CREATE TABLE user_job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs_cache(id) ON DELETE CASCADE,
  match_score FLOAT NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_reasons JSONB,
  embedding_score FLOAT,
  raw_similarity FLOAT,
  salary_match BOOLEAN,
  location_match BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, job_id)
);

CREATE INDEX idx_user_job_matches_user_id ON user_job_matches(user_id);
CREATE INDEX idx_user_job_matches_job_id ON user_job_matches(job_id);
CREATE INDEX idx_user_job_matches_created_at ON user_job_matches(created_at);
CREATE INDEX idx_user_job_matches_score ON user_job_matches(match_score DESC);
```

**match_reasons JSONB structure**:
```json
{
  "reasons": [
    "Strong Python skills match (5+ years)",
    "Senior role matches your experience level",
    "Salary range $140k-$180k within your preference",
    "Remote role matches your preference",
    "San Francisco is in your preferred locations"
  ],
  "matching_skills": ["Python", "FastAPI", "PostgreSQL"],
  "role_match_confidence": 0.92,
  "location_penalty": 0.0,
  "salary_penalty": 0.0
}
```

---

### user_job_actions
Tracks user interactions with job listings.

```sql
CREATE TABLE user_job_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs_cache(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('saved', 'dismissed', 'applied')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, job_id, action)
);

CREATE INDEX idx_user_job_actions_user_id ON user_job_actions(user_id);
CREATE INDEX idx_user_job_actions_job_id ON user_job_actions(job_id);
CREATE INDEX idx_user_job_actions_action ON user_job_actions(action);
```

**Notes**:
- `action`: 'saved' | 'dismissed' | 'applied'
- Unique constraint prevents duplicate actions of same type

---

## Relationships

```
users
  ├─ 1 ─── ∞ user_api_keys
  ├─ 1 ─── 1 user_preferences
  ├─ 1 ─── 1 resumes
  ├─ 1 ─── ∞ user_job_matches
  └─ 1 ─── ∞ user_job_actions

jobs_cache
  ├─ 1 ─── ∞ user_job_matches
  └─ 1 ─── ∞ user_job_actions

user_job_matches → user_job_actions (implicit: same user_id + job_id)
```

---

## Migrations

Using Alembic for schema versioning.

```bash
# Create migration after model changes
alembic revision --autogenerate -m "Add new column"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

Migration files stored in `backend/alembic/versions/`.

---

## Indexing Strategy

**Primary Indexes** (for frequently queried columns):
- `users.email` — Login lookups
- `user_api_keys.user_id` — Retrieve user's API keys
- `user_job_matches.user_id` — List user's matches
- `jobs_cache.jsearch_id` — Deduplication on JSearch imports
- `user_job_actions.user_id` — Track user interactions

**Secondary Indexes** (for filtering/sorting):
- `jobs_cache.expires_at` — Cache cleanup queries
- `user_job_matches.match_score` — Sort by relevance
- `user_job_matches.created_at` — Sorting by recency
- `jobs_cache.location` — Filter by location
- `user_job_actions.action` — Count saved/dismissed/applied

---

## Query Examples

**Find all matches for a user, sorted by score**:
```sql
SELECT m.*, j.title, j.company, j.location
FROM user_job_matches m
JOIN jobs_cache j ON m.job_id = j.id
WHERE m.user_id = $1
ORDER BY m.match_score DESC
LIMIT 20;
```

**Get non-expired jobs from cache**:
```sql
SELECT * FROM jobs_cache
WHERE expires_at > NOW()
AND location = $1
ORDER BY posted_at DESC;
```

**Count user actions**:
```sql
SELECT action, COUNT(*) as count
FROM user_job_actions
WHERE user_id = $1
GROUP BY action;
```

**Cleanup expired jobs**:
```sql
DELETE FROM jobs_cache
WHERE expires_at < NOW();
```

---

## Performance Considerations

1. **JSONB columns**: Indexes on JSONB fields if querying by specific keys:
   ```sql
   CREATE INDEX idx_resume_skills ON resumes USING gin(parsed_data -> 'skills');
   ```

2. **Pagination**: Always use `LIMIT + OFFSET` for large result sets.

3. **Connection pooling**: Backend uses SQLAlchemy connection pooling (pool_size=10, max_overflow=20).

4. **Cache invalidation**: Jobs cache expires after 24 hours. Manual cleanup can be run nightly:
   ```sql
   DELETE FROM jobs_cache WHERE expires_at < NOW();
   ```

5. **Archival**: Consider archiving old matches annually if table grows large:
   ```sql
   -- Monthly archive table
   CREATE TABLE user_job_matches_archive_202405 AS
   SELECT * FROM user_job_matches
   WHERE created_at < '2024-05-01';
   ```

---

## Backup Strategy

- **Nightly automated backups** to S3 (if using managed DB)
- **Point-in-time recovery** (PITR) enabled
- **Replication** to standby server for HA
- **Monthly full backups** to separate storage

---

## Development Database Setup

```bash
# Start PostgreSQL via Docker Compose
docker-compose up -d postgres

# Wait for DB to be ready
docker-compose logs postgres | grep "database system is ready"

# Apply migrations
cd backend && alembic upgrade head
```

---

See **ARCHITECTURE.md** for data flow diagrams and entity relationships.
