# Development Guide

**Local setup, running services, and debugging tips.**

---

## Prerequisites

- **Python 3.11+** (backend)
- **Node.js 18+** (frontend)
- **Docker & Docker Compose** (database + Redis)
- **Git** (version control)
- **AWS Account** (S3 for resume storage — can mock locally)
- **API Keys**:
  - OpenAI API key (for testing AI features) — optional, can test with Claude
  - Anthropic Claude API key — optional, can test with OpenAI
  - RapidAPI key for JSearch API — get free tier key

---

## Project Setup

### 1. Clone & Navigate
```bash
cd /path/to/auto-apply-jobs
```

### 2. Backend Setup

```bash
# Create Python virtual environment
python3 -m venv venv

# Activate (macOS/Linux)
source venv/bin/activate
# OR Windows
# venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Download spaCy model for NLP
python -m spacy download en_core_web_sm
```

### 3. Database Setup

```bash
# Start PostgreSQL & Redis via Docker Compose
docker-compose up -d

# Verify containers are running
docker-compose ps
# Output should show postgres and redis as "Up"

# Run database migrations
cd backend
alembic upgrade head
cd ..

# Test connection
python -c "from app.database import SessionLocal; db = SessionLocal(); print('DB OK')"
```

### 4. Frontend Setup

```bash
# Install Node dependencies
cd frontend
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your settings (optional, defaults work for local dev)
```

---

## Running the Application

### Backend

```bash
# From project root, with venv activated
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Access Swagger UI: http://localhost:8000/docs

**Logs** should show:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Frontend

```bash
# From project root (in a new terminal)
cd frontend
npm run dev
```

Access app: http://localhost:3000

**Logs** should show:
```
> ready - started server on 0.0.0.0:3000
```

### Database

Postgres is running in Docker. Access via:
```bash
# Connect to DB shell
docker-compose exec postgres psql -U auto_apply_user -d auto_apply_jobs_db

# Useful commands
\dt              # List tables
\d <table_name>  # Describe table
SELECT * FROM users;  # Query
\q               # Quit
```

### Redis

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Useful commands
PING        # Test connection
KEYS *      # List all keys
GET key     # Get value
FLUSHDB     # Clear all keys
```

---

## Environment Variables

### Backend (backend/.env)

```ini
# Database
DATABASE_URL=postgresql://auto_apply_user:auto_apply_dev_password@localhost:5432/auto_apply_jobs_db

# JWT
SECRET_KEY=your-super-secret-key-min-32-chars-change-in-prod
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# AWS S3 (optional for local dev)
AWS_ACCESS_KEY_ID=local-key-or-your-actual-key
AWS_SECRET_ACCESS_KEY=local-secret-or-your-actual-key
AWS_S3_BUCKET_NAME=auto-apply-jobs-resumes-local
AWS_S3_REGION=us-east-1

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:8000"]

# Environment
ENVIRONMENT=development
DEBUG=True

# JSearch API (sign up at RapidAPI)
JSEARCH_API_KEY=your-rapidapi-jsearch-key
JSEARCH_API_HOST=jsearch.p.rapidapi.com

# Redis
REDIS_URL=redis://localhost:6379
```

### Frontend (frontend/.env.local)

```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_ENVIRONMENT=development
```

---

## Testing User Flows

### 1. Register & Login
```bash
# Visit http://localhost:3000
# Click "Sign Up"
# Register with email: test@example.com, password: test123456
# Should redirect to dashboard
```

### 2. Add API Key
```bash
# Go to Settings page
# Add OpenAI API key OR Claude API key
# Click "Add API Key"
# Should show success message + key preview
```

### 3. Upload Resume
```bash
# Get a sample PDF resume (google "sample resume PDF")
# Go to "Resume" page
# Drag & drop PDF or click to select
# Should parse and display extracted data
# Verify skills, experience, education are extracted
```

### 4. Set Preferences
```bash
# Go to "Settings" > "Preferences"
# Set:
#   - Preferred roles: "Backend Engineer"
#   - Preferred locations: "Remote"
#   - Salary: $100,000 - $200,000
#   - Remote: "Remote"
# Click "Save"
```

### 5. Search Jobs
```bash
# Go to "Jobs" page
# Click "Search Jobs"
# Wait for results (should take 3-5 seconds)
# Should see jobs with match scores (0-100)
# Each job shows match reasons
```

### 6. Interact with Jobs
```bash
# Click "Save" on a job → should appear in saved list
# Click "Dismiss" → should disappear
# Click "Apply" → opens external job link
```

---

## API Testing

### Via Swagger UI
Visit http://localhost:8000/docs to test endpoints interactively.

1. **Register**:
   - POST /auth/register
   - Body: `{"email": "test@ex.com", "password": "pass123456", "full_name": "Test User"}`

2. **Login**:
   - POST /auth/login
   - Body: `{"email": "test@ex.com", "password": "pass123456"}`
   - Copy `access_token` from response

3. **Authenticate subsequent requests**:
   - Click "Authorize" button (top right)
   - Paste: `Bearer <access_token>`
   - Click "Authorize"

4. **Test Protected Endpoints**:
   - GET /profile
   - POST /resume/upload (multipart)
   - POST /jobs/search
   - etc.

### Via cURL

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ex.com","password":"pass123456"}'

# Get token from response
export TOKEN="eyJ0eXAi..."

# Use token in subsequent requests
curl -X GET http://localhost:8000/api/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## Debugging

### Python Errors

**Import Error**: `ModuleNotFoundError: No module named 'app'`
→ Ensure you're in `backend/` directory and venv is activated

**Database Connection Error**: `could not translate host name "postgres" to address`
→ Check `docker-compose ps`, ensure postgres container is running: `docker-compose up -d`

**spaCy Model Error**: `OSError: [E050] Can't find model 'en_core_web_sm'`
→ Run: `python -m spacy download en_core_web_sm`

### JavaScript/TypeScript Errors

**Module not found**: `Cannot find module '@/components/...`
→ Check path alias in `frontend/tsconfig.json`, ensure file exists

**CORS error**: `Access to XMLHttpRequest blocked by CORS policy`
→ Backend is not running or CORS origins mismatch in `.env`

**Node modules issue**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database Issues

**Cannot connect to PostgreSQL**:
```bash
# Check if container is running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

**Migration failed**:
```bash
# Check migration status
alembic current

# Downgrade to previous version
alembic downgrade -1

# Re-apply
alembic upgrade head
```

---

## Code Style

### Python
```bash
# Format code
black backend/

# Lint
flake8 backend/

# Type check
mypy backend/
```

### JavaScript/TypeScript
```bash
# Format code
cd frontend
npm run lint -- --fix
```

---

## Database Migrations

When you modify SQLAlchemy models:

```bash
cd backend

# Auto-generate migration file
alembic revision --autogenerate -m "Add new column to users table"

# Review generated migration in alembic/versions/
# Verify it looks correct (sometimes manual tweaks needed)

# Apply migration
alembic upgrade head

# Downgrade if needed
alembic downgrade -1
```

---

## Common Commands

### Docker
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Remove containers and volumes (WARNING: deletes data)
docker-compose down -v
```

### Backend
```bash
# Run server with auto-reload
uvicorn app.main:app --reload

# Run tests
pytest

# Interactive Python shell
python -c "from app.database import SessionLocal; db = SessionLocal(); ..."
```

### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm run start

# Type check
npm run type-check
```

### Git
```bash
# Create feature branch
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
gh pr create --title "Add new feature" --body "..."
```

---

## Performance Testing

### Backend
```bash
# Time a single request
time curl -X POST http://localhost:8000/api/jobs/search \
  -H "Authorization: Bearer $TOKEN"

# Load test with Apache Bench
ab -n 100 -c 10 http://localhost:8000/api/jobs/matches
```

### Frontend
```bash
# Use Lighthouse in Chrome DevTools
# Audit → Performance

# Or run via CLI
npm install -g lighthouse
lighthouse http://localhost:3000
```

### Database
```bash
# Check slow queries
EXPLAIN ANALYZE SELECT * FROM user_job_matches WHERE user_id = 'uuid';

# Check table size
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Troubleshooting Checklist

Before reporting bugs:

- [ ] Venv activated: `which python` shows path to venv
- [ ] Docker running: `docker-compose ps` shows containers up
- [ ] Migrations applied: `alembic current` shows latest version
- [ ] API running: `curl http://localhost:8000/docs` returns 200
- [ ] Frontend running: `http://localhost:3000` loads
- [ ] No duplicate services: `lsof -i :8000` and `lsof -i :3000`
- [ ] Redis running: `redis-cli ping` returns PONG
- [ ] DB connection works: Test query in psql or Python
- [ ] Environment variables loaded: Check `.env` files exist and are copied from examples
- [ ] No stale cache: Clear browser cache & localhost storage

---

## Useful Resources

- FastAPI docs: https://fastapi.tiangolo.com/
- Next.js docs: https://nextjs.org/docs
- Framer Motion: https://www.framer.com/motion/
- SQLAlchemy: https://docs.sqlalchemy.org/
- PostgreSQL docs: https://www.postgresql.org/docs/
- JWT.io: https://jwt.io/ (decode tokens)

---

## Getting Help

1. Check **CLAUDE.md** for architecture overview
2. Check **API.md** for endpoint details
3. Run tests: `pytest` (backend) or `npm test` (frontend)
4. Check logs: `docker-compose logs` or terminal output
5. Debug in browser: Chrome DevTools (Network, Console, Sources tabs)

---

See **ARCHITECTURE.md** for system design and **ANIMATIONS.md** for UI animation details.
