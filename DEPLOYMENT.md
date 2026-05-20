# Rolio Deployment Guide — AWS EC2 + RDS + S3

Complete end-to-end deployment of Rolio to AWS with automatic CI/CD via GitHub Actions.

## Architecture

```
                    Internet
                       ↓
        Route53 / DNS (rolio.in, api.rolio.in)
                       ↓
            EC2 t3.medium (Ubuntu 22.04)
         Running Nginx (reverse proxy)
                       ↓
          ┌────────────┴────────────┐
          ↓                         ↓
    PM2: next start          PM2: uvicorn
    Port 3000                Port 8000
    (Frontend)               (Backend)
          │                         │
          └────────────┬────────────┘
                       ↓
            RDS PostgreSQL (private)
            Auto-backups enabled
                       ↓
                AWS S3 Bucket
            (Resume uploads)
```

**Cost**: ~$47/month (EC2 $30, RDS $15, S3 $2)

---

## Prerequisites

1. **AWS Account** with:
   - EC2 launch capability (default)
   - RDS access
   - S3 access
   
2. **Domain**: `rolio.in` with ability to create A records
   - Registrar: Namecheap, GoDaddy, Route 53, etc.

3. **GitHub** repository set up with this code

4. **AWS Credentials** (for S3 upload):
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - S3 bucket name

5. **JSearch API Key** from RapidAPI (already configured in code)

---

## Deployment Steps

### Step 1: Create AWS Infrastructure (10 min)

#### A. Launch EC2 Instance

1. Go to **AWS Console → EC2 → Instances → Launch Instance**

2. **AMI**: Ubuntu 22.04 LTS (free tier eligible)

3. **Instance Type**: `t3.medium` (2 vCPU, 4 GB RAM)
   - Handles both frontend and backend comfortably

4. **Key Pair**: Create new or use existing `.pem` file
   - ⚠️ **Save this file securely** — you'll need it for GitHub Actions

5. **Network Settings**:
   - Create new Security Group named `rolio-sg`
   - Inbound Rules:
     - SSH (22) — Source: Your IP (or 0.0.0.0/0 for testing)
     - HTTP (80) — Source: 0.0.0.0/0 (anywhere)
     - HTTPS (443) — Source: 0.0.0.0/0 (anywhere)

6. **Storage**: 20 GB (default gp2)

7. **Launch** → Note the Instance ID and Public IP

8. **Elastic IP**: 
   - Go to **EC2 → Elastic IPs → Allocate**
   - Associate with your instance (keep this IP static for DNS)

#### B. Create RDS PostgreSQL Database

1. Go to **AWS Console → RDS → Databases → Create Database**

2. **Engine**: PostgreSQL 15

3. **Instance Size**: `db.t3.micro`

4. **Storage**: 20 GB gp2, no Multi-AZ for now

5. **Master Username**: `rolio_user`

6. **Master Password**: Generate strong password (save it!)
   ```bash
   # Example strong password command
   openssl rand -base64 24
   ```

7. **Network**:
   - VPC: Default
   - DB Subnet Group: Create default
   - Public Accessibility: **No** (must go through EC2)
   - New Security Group: `rolio-db-sg`
   
8. **Security Group Rules**:
   - Edit `rolio-db-sg` → Inbound
   - Add rule: PostgreSQL (5432) from security group `rolio-sg` only

9. **Create Database** → Wait ~5 min for creation

10. **Note the Endpoint**: `rolio-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com`

#### C. Configure DNS

Point your domain to EC2's Elastic IP:

**In your domain registrar (Namecheap, GoDaddy, etc.):**
- `rolio.in` A record → [EC2 Elastic IP]
- `api.rolio.in` A record → [EC2 Elastic IP]
- `www.rolio.in` CNAME → `rolio.in`

**Wait 2-5 minutes for DNS to propagate** (check with `nslookup rolio.in`)

---

### Step 2: Setup EC2 Server (10 min)

1. **SSH into your EC2**:
   ```bash
   ssh -i your-key.pem ubuntu@[EC2_PUBLIC_IP]
   ```

2. **Download and run setup script**:
   ```bash
   cd /tmp
   wget https://raw.githubusercontent.com/YOUR_GITHUB_USER/auto-apply-jobs/main/scripts/setup-ec2.sh
   chmod +x setup-ec2.sh
   ./setup-ec2.sh
   ```

3. **When prompted**:
   - Enter your GitHub username

4. **Wait for script to complete** (~5-10 min)

5. **Edit backend `.env` file**:
   ```bash
   nano /home/ubuntu/auto-apply-jobs/backend/.env
   ```
   
   Replace these values:
   ```bash
   DATABASE_URL=postgresql://rolio_user:PASSWORD@rolio-db.xxxx.us-east-1.rds.amazonaws.com:5432/rolio
   SECRET_KEY=<your-32-char-random-string>
   AWS_ACCESS_KEY_ID=<your-aws-key>
   AWS_SECRET_ACCESS_KEY=<your-aws-secret>
   JSEARCH_API_KEY=<your-jsearch-key>
   ```

6. **Restart backend**:
   ```bash
   pm2 restart rolio-backend
   ```

---

### Step 3: Enable HTTPS with Let's Encrypt (5 min)

1. **Run Certbot** (after DNS has propagated):
   ```bash
   sudo certbot --nginx -d rolio.in -d www.rolio.in -d api.rolio.in
   ```

2. **Enter your email** when prompted

3. **Accept terms** (yes)

4. **Choose redirect** (select option 2: "Redirect HTTP to HTTPS")

5. **Verify SSL**:
   ```bash
   curl -I https://rolio.in     # Should show 200
   curl -I https://api.rolio.in/health  # Should show 200
   ```

---

### Step 4: Setup GitHub Actions CI/CD (5 min)

1. **Add your `.pem` key as a GitHub Secret**:
   - Go to GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `EC2_SSH_KEY`
   - Value: **Full contents** of your `.pem` file (including -----BEGIN/END-----lines)

2. **Add EC2 host secret**:
   - Name: `EC2_HOST`
   - Value: [EC2 Elastic IP]

3. **Verify workflow exists**:
   - File: `.github/workflows/deploy.yml` (should already be in repo)

4. **Test deployment**:
   - Make a small change to your code
   - Push to `main` branch
   - Go to **Actions** tab → watch the workflow run
   - Should see `Deployed at [timestamp]` in logs

---

## Verification

### Test the deployment:

```bash
# Frontend loads (HTTPS)
curl -I https://rolio.in
# Expected: HTTP/2 200

# Backend health check
curl https://api.rolio.in/health
# Expected: {"status":"ok","environment":"production"}

# Test login API
curl -X POST https://api.rolio.in/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123"}'
# Expected: JWT tokens
```

### Check logs on EC2:

```bash
ssh -i your-key.pem ubuntu@[EC2_IP]

# Backend logs
pm2 logs rolio-backend

# Frontend logs
pm2 logs rolio-frontend

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# PM2 process status
pm2 status
```

---

## CI/CD Workflow

**What happens when you push to `main`:**

1. GitHub Actions triggers
2. SSH into EC2 as `ubuntu` user
3. `git pull origin main`
4. Backend: `pip install -r requirements.txt` → restart PM2
5. Frontend: `npm run build` → restart PM2
6. Done! Changes live in ~2 minutes

**If deploy fails:**
- Check GitHub Actions logs (red ✗ in Actions tab)
- SSH into EC2 and check: `pm2 logs rolio-backend` or `pm2 logs rolio-frontend`
- Common issues:
  - Database credentials wrong → check backend/.env
  - S3 credentials wrong → check AWS_ACCESS_KEY_ID / SECRET
  - Node/Python modules missing → script will fix on next push

---

## Maintenance

### View running processes:
```bash
pm2 status        # Quick status
pm2 logs          # All logs
pm2 logs rolio-backend    # Backend only
pm2 logs rolio-frontend   # Frontend only
```

### Restart services (if needed):
```bash
pm2 restart rolio-backend
pm2 restart rolio-frontend
pm2 restart all
```

### View database:
```bash
# From EC2, connect to RDS
psql -h rolio-db.xxxx.us-east-1.rds.amazonaws.com -U rolio_user -d rolio

# List tables
\dt

# Exit
\q
```

### Backup database (RDS does this automatically):
- AWS RDS automatically creates backups
- Retention: 7 days (configurable in RDS console)

### Monitor costs:
- **AWS Console → Billing → Cost & Usage**
- Set up budget alerts if spending exceeds $100/month

---

## Troubleshooting

### ❌ "Cannot connect to database"
- Check EC2 security group allows EC2 itself
- Check RDS security group allows port 5432 from EC2 SG
- Verify DATABASE_URL in backend/.env is correct

### ❌ "Cannot find module 'spacy'"
- SSH and run: `source /home/ubuntu/auto-apply-jobs/backend/venv/bin/activate`
- Then: `python -m spacy download en_core_web_sm`

### ❌ "502 Bad Gateway"
- Nginx can't reach the backend/frontend
- Check: `pm2 status` — are processes running?
- Check: `pm2 logs` — are there errors?
- Nginx logs: `sudo tail -f /var/log/nginx/error.log`

### ❌ "SSL certificate not found"
- Certbot hasn't run yet
- SSH and run: `sudo certbot --nginx -d rolio.in -d www.rolio.in -d api.rolio.in`

### ❌ Deployment from GitHub fails
- Check EC2_HOST and EC2_SSH_KEY secrets are correct
- Check .pem file includes -----BEGIN/END----- lines
- SSH to EC2 and run: `tail -50 /home/ubuntu/auto-apply-jobs/backend/.env` (check if editable)

---

## Upgrading Later

### Scale up EC2:
1. AWS Console → EC2 → right-click instance → Instance Settings → Change Instance Type
2. Choose larger type (e.g., `t3.large`)
3. Reboot (brief downtime)

### Enable Multi-AZ for RDS:
1. RDS Console → Databases → Modify
2. Enable "Multi-AZ deployment"
3. Choose backup window (automatic failover enabled)

### Add Redis for caching (future):
1. ElastiCache → Create cache cluster → Redis
2. Update backend REDIS_URL
3. Deploy via GitHub Actions

---

## Rollback (if needed)

If a deployment goes wrong:

```bash
ssh -i your-key.pem ubuntu@[EC2_IP]

# Revert to previous commit
cd /home/ubuntu/auto-apply-jobs
git log --oneline -5   # See recent commits
git checkout <commit-hash>

# Rebuild
cd backend && pip install -r requirements.txt && pm2 restart rolio-backend
cd ../frontend && npm run build && pm2 restart rolio-frontend
```

Or restart from the last known-good PM2 save:
```bash
pm2 resurrect   # Restores previous process state
```

---

## Cost Breakdown

| Service | Size | Monthly Cost |
|---------|------|--------------|
| EC2 | t3.medium | $30 |
| RDS | db.t3.micro | $15 |
| S3 | <10 GB | ~$1 |
| Data Transfer | 15 GB out | ~$1 |
| **Total** | | **~$47** |

---

## Support

- **Backend logs**: `pm2 logs rolio-backend`
- **Frontend logs**: `pm2 logs rolio-frontend`
- **Nginx logs**: `sudo tail -f /var/log/nginx/error.log`
- **GitHub Actions**: Repo → Actions tab
- **AWS Status**: https://status.aws.amazon.com/

---

**Deployed! 🚀 Your Rolio app is now live at https://rolio.in**
