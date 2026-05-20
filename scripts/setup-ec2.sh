#!/bin/bash
set -e

echo "=== Rolio EC2 Setup Script ==="
echo "This script sets up a complete Rolio deployment on EC2 (Ubuntu 22.04)"

# Update system packages
echo "Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y git curl wget nginx certbot python3-certbot-nginx \
  python3.11 python3.11-venv python3-pip build-essential libssl-dev libffi-dev

# Install Node.js 20 via nvm
echo "Installing Node.js 20..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"
nvm install 20
nvm alias default 20
npm install -g pm2

# Clone repository
echo "Cloning repository..."
cd /home/ubuntu
if [ ! -d "auto-apply-jobs" ]; then
  echo "Enter your GitHub username:"
  read GITHUB_USER
  git clone https://github.com/$GITHUB_USER/auto-apply-jobs.git
fi
cd auto-apply-jobs

# Setup backend Python environment
echo "Setting up backend Python environment..."
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python -m spacy download en_core_web_sm
deactivate

# Create production .env file for backend
echo "Creating backend .env file..."
cat > .env << 'EOF'
# ===== Configure these values =====
DATABASE_URL=postgresql://rolio_user:PASSWORD@rolio-db.xxxx.us-east-1.rds.amazonaws.com:5432/rolio
SECRET_KEY=CHANGE_ME_TO_32_CHAR_RANDOM_STRING
AWS_ACCESS_KEY_ID=YOUR_AWS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET
JSEARCH_API_KEY=YOUR_JSEARCH_KEY

# ===== Pre-configured =====
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
AWS_S3_BUCKET_NAME=auto-apply-jobs-resumes
AWS_S3_REGION=us-east-1
CORS_ORIGINS=["https://rolio.in","https://www.rolio.in","https://api.rolio.in"]
ENVIRONMENT=production
DEBUG=False
JSEARCH_API_HOST=jsearch.p.rapidapi.com
REDIS_URL=redis://localhost:6379
EOF

echo "❌ IMPORTANT: Edit backend/.env with your actual database URL, AWS keys, and JWT secret before running Certbot!"

# Setup frontend
echo "Setting up frontend..."
cd ../frontend
echo "NEXT_PUBLIC_API_URL=https://api.rolio.in" > .env.local
npm install
NEXT_PUBLIC_API_URL=https://api.rolio.in npm run build

# Setup Nginx
echo "Configuring Nginx..."
sudo cp /home/ubuntu/auto-apply-jobs/nginx/rolio.conf /etc/nginx/sites-available/rolio
sudo ln -s /etc/nginx/sites-available/rolio /etc/nginx/sites-enabled/ 2>/dev/null || true
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Start PM2
echo "Starting PM2 processes..."
cd /home/ubuntu/auto-apply-jobs
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/home/ubuntu/.nvm/versions/node/v20.*/bin \
  pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | sudo bash

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with real credentials:"
echo "   nano /home/ubuntu/auto-apply-jobs/backend/.env"
echo "2. Point your DNS records to this EC2's Elastic IP:"
echo "   rolio.in A <EC2_IP>"
echo "   api.rolio.in A <EC2_IP>"
echo "3. Run Certbot for SSL (after DNS propagates):"
echo "   sudo certbot --nginx -d rolio.in -d www.rolio.in -d api.rolio.in"
echo "4. Check PM2 status:"
echo "   pm2 status"
echo ""
echo "Logs:"
echo "   pm2 logs rolio-backend"
echo "   pm2 logs rolio-frontend"
echo "   sudo tail -f /var/log/nginx/error.log"
