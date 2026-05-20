# Rolio Deployment Checklist

Quick reference for deploying to AWS EC2.

## Pre-Deployment ✓

- [ ] AWS Account created and verified
- [ ] Domain (rolio.in) purchased and accessible
- [ ] GitHub repo set up with code pushed to `main`
- [ ] Collected credentials:
  - [ ] AWS Access Key ID
  - [ ] AWS Secret Access Key  
  - [ ] S3 bucket name (`auto-apply-jobs-resumes`)
  - [ ] JSearch API Key from RapidAPI
  - [ ] Strong password for RDS (generated via `openssl rand -base64 24`)

## AWS Infrastructure Setup (15 min)

### EC2 Instance
- [ ] Create EC2 instance (Ubuntu 22.04 LTS, t3.medium)
- [ ] Create security group (`rolio-sg`): SSH, HTTP, HTTPS inbound
- [ ] Allocate Elastic IP and attach to instance
- [ ] Note the Elastic IP address: _______________

### RDS PostgreSQL
- [ ] Create RDS instance (PostgreSQL 15, db.t3.micro)
- [ ] Username: `rolio_user`
- [ ] Password: _______________ (save securely)
- [ ] Create security group (`rolio-db-sg`): PostgreSQL from `rolio-sg` only
- [ ] Note RDS endpoint: _______________

### DNS Configuration
- [ ] Point `rolio.in` A record → [Elastic IP]
- [ ] Point `api.rolio.in` A record → [Elastic IP]
- [ ] Create `www.rolio.in` CNAME → `rolio.in`
- [ ] Verify DNS with: `nslookup rolio.in`

## EC2 Server Setup (10 min)

```bash
# 1. SSH into EC2
ssh -i your-key.pem ubuntu@[ELASTIC_IP]

# 2. Clone and run setup script
cd /tmp
wget https://raw.githubusercontent.com/YOUR_GITHUB_USER/auto-apply-jobs/main/scripts/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh

# 3. Edit backend .env with credentials
nano /home/ubuntu/auto-apply-jobs/backend/.env

# 4. Replace:
DATABASE_URL=postgresql://rolio_user:PASSWORD@[RDS_ENDPOINT]:5432/rolio
SECRET_KEY=[32-char random string]
AWS_ACCESS_KEY_ID=[your key]
AWS_SECRET_ACCESS_KEY=[your secret]
JSEARCH_API_KEY=[your key]

# 5. Restart backend to apply changes
pm2 restart rolio-backend
```

- [ ] SSH into EC2 successful
- [ ] setup-ec2.sh completed without errors
- [ ] backend/.env edited with credentials
- [ ] pm2 status shows both processes running

## HTTPS/SSL Setup (5 min)

```bash
# Wait for DNS to propagate first (2-5 min)
# Then run certbot:
ssh -i your-key.pem ubuntu@[ELASTIC_IP]
sudo certbot --nginx -d rolio.in -d www.rolio.in -d api.rolio.in

# Verify:
curl -I https://rolio.in     # Should be 200
curl https://api.rolio.in/health  # Should be {"status":"ok",...}
```

- [ ] Certbot completed successfully
- [ ] SSL certificates issued
- [ ] HTTPS working for rolio.in
- [ ] HTTPS working for api.rolio.in

## GitHub Actions CI/CD Setup (5 min)

```bash
# 1. Copy your .pem file contents (full, with -----BEGIN/END----- lines)
cat your-key.pem | pbcopy  # macOS
# or
cat your-key.pem | xclip -selection clipboard  # Linux

# 2. Go to GitHub repo → Settings → Secrets and variables → Actions
```

- [ ] GitHub Secret `EC2_SSH_KEY` = contents of .pem file
- [ ] GitHub Secret `EC2_HOST` = Elastic IP address
- [ ] `.github/workflows/deploy.yml` exists in repo
- [ ] Make test commit to `main` and verify GitHub Actions runs

## Final Verification (5 min)

### Test Frontend
```bash
curl -I https://rolio.in
# Expected: HTTP/2 200
```

### Test Backend
```bash
curl https://api.rolio.in/health
# Expected: {"status":"ok","environment":"production"}
```

### Test Auth API
```bash
curl -X POST https://api.rolio.in/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"12345678"}'
# Expected: JWT tokens
```

- [ ] Frontend loads at https://rolio.in
- [ ] Backend responds at https://api.rolio.in/health
- [ ] Auth endpoint returns JWT tokens
- [ ] CI/CD pipeline runs on git push to main

## Post-Deployment

### Monitoring
- [ ] Set up AWS billing alerts (console → Billing)
- [ ] Bookmark PM2 logs command: `pm2 logs`
- [ ] Save Elastic IP and RDS endpoint

### Backups
- [ ] RDS automated backups enabled (check RDS console)
- [ ] Test database connection from EC2:
  ```bash
  ssh -i your-key.pem ubuntu@[ELASTIC_IP]
  psql -h [RDS_ENDPOINT] -U rolio_user -d rolio
  # Type password when prompted
  \dt  # List tables
  \q  # Quit
  ```

### Documentation
- [ ] Share `DEPLOYMENT.md` with team
- [ ] Document any custom configurations
- [ ] Keep credentials in secure vault (1Password, LastPass, etc.)

## Quick Reference

### SSH into EC2
```bash
ssh -i your-key.pem ubuntu@[ELASTIC_IP]
```

### View Logs
```bash
pm2 logs rolio-backend     # Backend API
pm2 logs rolio-frontend    # Frontend
sudo tail -f /var/log/nginx/error.log  # Nginx errors
```

### Restart Services
```bash
pm2 restart rolio-backend
pm2 restart rolio-frontend
pm2 restart all
```

### Manual Deploy (if GitHub Actions fails)
```bash
ssh -i your-key.pem ubuntu@[ELASTIC_IP]
cd /home/ubuntu/auto-apply-jobs
git pull origin main
cd backend && pip install -r requirements.txt && pm2 restart rolio-backend
cd ../frontend && npm run build && pm2 restart rolio-frontend
```

### Costs
- EC2 t3.medium: $30/mo
- RDS db.t3.micro: $15/mo
- S3 + transfer: $2/mo
- **Total: ~$47/mo**

---

**Status**: ⏳ In Progress / ✅ Complete

Mark each section as you complete it!
