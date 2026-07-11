# Typeform Clone - Complete Deployment Guide

This guide covers how to deploy and run the Typeform Clone application in all environments: local development, Azure VM, and Vercel.

---

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Azure VM Deployment](#azure-vm-deployment)
3. [Vercel Frontend Deployment](#vercel-frontend-deployment)
4. [Environment Variables](#environment-variables)
5. [Database & Persistence](#database--persistence)
6. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python 3.8+** (for backend)
- **Git**
- **npm** or **yarn**

### Step 1: Clone the Repository

```bash
git clone https://github.com/Saksham-Gupta-GH/Typeform.git
cd Typeform
```

### Step 2: Backend Setup

```bash
cd backend

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (runs on http://localhost:8000)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will create a SQLite database (`typeform.db`) automatically on first run.

### Step 3: Frontend Setup (in a new terminal)

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file (optional for local development)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server (runs on http://localhost:3000)
npm run dev
```

### Step 4: Access the Application

- **Dashboard**: http://localhost:3000/
- **Backend API**: http://localhost:8000/docs (interactive API docs)

---

## Azure VM Deployment

### Prerequisites

- Azure Virtual Machine running Linux (Ubuntu 20.04+ recommended)
- SSH access to the VM
- Ports 3000 and 8000 open in firewall rules

### Step 1: Connect to Azure VM

```bash
# Replace IP with your actual Azure VM public IP
ssh azureuser@20.219.130.205
```

### Step 2: Install Dependencies on VM

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python and pip
sudo apt install -y python3 python3-pip python3-venv

# Install Git
sudo apt install -y git

# Install process manager (optional but recommended)
sudo npm install -g pm2
```

### Step 3: Clone and Setup Backend

```bash
# Clone repository
git clone https://github.com/Saksham-Gupta-GH/Typeform.git
cd Typeform/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend with pm2 (recommended for persistence)
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name typeform-backend

# OR start directly (in screen session for persistence)
screen -S backend
uvicorn main:app --host 0.0.0.0 --port 8000
# Press Ctrl+A then D to detach from screen
```

### Step 4: Setup Frontend

```bash
# In a new terminal session
cd ~/Typeform/frontend

# Install dependencies
npm install

# Create production build
npm run build

# Start with pm2 (recommended)
pm2 start "npm start" --name typeform-frontend --listen 3000

# OR start directly
npm start
```

### Step 5: Configure Environment Variables

Create `.env.local` in the frontend directory:

```bash
# Point frontend to your Azure VM's backend
echo "NEXT_PUBLIC_API_URL=http://20.219.130.205:8000" > .env.local
```

### Step 6: Verify Deployment

```bash
# Check if services are running
pm2 list

# View logs
pm2 logs typeform-backend
pm2 logs typeform-frontend

# Access the application
# Frontend: http://20.219.130.205:3000/
# Backend API: http://20.219.130.205:8000/docs
```

### Step 7: Save pm2 Process List (Optional)

```bash
pm2 save
pm2 startup
# Follow the output instructions to enable auto-start on reboot
```

---

## Vercel Frontend Deployment

### Prerequisites

- Vercel account (free tier available)
- GitHub account with repository pushed
- Backend deployed and accessible via URL

### Step 1: Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository (`Typeform`)
4. Select the `frontend` directory as the root

### Step 2: Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

```
NEXT_PUBLIC_API_URL=http://20.219.130.205:8000
# OR if you have a custom backend domain:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Step 3: Configure Build Settings

- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Install Command**: `npm install`

### Step 4: Deploy

Click "Deploy". Vercel will automatically:
1. Install dependencies
2. Build the Next.js project
3. Deploy to their CDN
4. Generate a production URL (e.g., `typeform-clone.vercel.app`)

### Step 5: Custom Domain (Optional)

1. In Vercel Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

---

## Environment Variables

### Frontend Environment Variables

Create `.env.local` in the `frontend` directory:

```bash
# Required: Backend API URL (no trailing slash)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: OpenRouter API key for AI features
# If not set, uses free tier (subject to rate limits)
NEXT_PUBLIC_OPENROUTER_API_KEY=your-openrouter-api-key-here
```

### Backend Environment Variables

Create `.env` in the `backend` directory (optional):

```bash
# CORS - comma-separated list of allowed origins
ALLOWED_ORIGINS=http://localhost:3000,http://20.219.130.205:3000

# Database path (default: ./typeform.db)
DATABASE_URL=sqlite:///./typeform.db
```

---

## Database & Persistence

### SQLite Database

The application uses **SQLite** for data persistence:

- **Location**: `backend/typeform.db`
- **Format**: Single file-based database
- **Backup**: Copy the `typeform.db` file to backup all data

### Backing Up Data

```bash
# On Azure VM
cp ~/Typeform/backend/typeform.db ~/typeform.db.backup
scp azureuser@20.219.130.205:~/typeform.db.backup ./

# Or locally
cp backend/typeform.db backend/typeform.db.backup
```

### Seeding Sample Data (Optional)

```bash
cd backend
python3 seed.py
```

This creates a sample form with test questions and responses.

---

## Troubleshooting

### Frontend Cannot Connect to Backend

**Error**: `Failed to fetch` or CORS errors

**Solutions**:

```bash
# 1. Verify backend is running
curl http://20.219.130.205:8000/

# 2. Check NEXT_PUBLIC_API_URL in .env.local
cat frontend/.env.local

# 3. Restart frontend with correct env var
export NEXT_PUBLIC_API_URL=http://20.219.130.205:8000
npm run dev

# 4. Check firewall (Azure VM)
# Ensure port 8000 is open in Network Security Group
```

### Backend Database Locked

**Error**: `database is locked`

**Solutions**:

```bash
# 1. Restart backend server
pm2 restart typeform-backend
# or Ctrl+C and restart uvicorn

# 2. Remove lock file if exists
rm backend/typeform.db-wal
rm backend/typeform.db-shm

# 3. Rebuild database
rm backend/typeform.db
# Database will recreate on next server start
```

### AI Form Generation Fails (429 Error)

**Error**: `AI is currently busy due to high demand`

**Solutions**:

```bash
# 1. Use paid OpenRouter API key
# Set NEXT_PUBLIC_OPENROUTER_API_KEY in .env.local

# 2. Try again in a few seconds (rate limit is temporary)

# 3. Check API key validity at https://openrouter.ai
```

### Port Already in Use

**Error**: `Address already in use`

**Solutions**:

```bash
# Find process using port 3000 or 8000
lsof -i :3000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different ports
npm run dev -- -p 3001
uvicorn main:app --port 8001
```

### npm/pip Dependencies Issues

**Solutions**:

```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Clear pip cache
pip cache purge
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## Performance Tips

### Frontend Optimization

```bash
# Build for production
cd frontend
npm run build

# Test production build locally
npm start

# Enable caching headers for Vercel
# (automatically handled by Vercel)
```

### Backend Optimization

```bash
# Use Gunicorn for production (more efficient than uvicorn)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 main:app

# Or with uvicorn workers
uvicorn main:app --workers 4 --host 0.0.0.0 --port 8000
```

### Database Optimization

```bash
# Vacuum database to reclaim space
sqlite3 backend/typeform.db "VACUUM;"
```

---

## Monitoring & Logging

### Using pm2 for Monitoring

```bash
# Real-time dashboard
pm2 monit

# View logs
pm2 logs

# View specific service logs
pm2 logs typeform-backend
pm2 logs typeform-frontend
```

### Vercel Deployment Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments"
4. Select a deployment and view logs

---

## Security Considerations

1. **CORS Configuration**: Update `ALLOWED_ORIGINS` in backend for production
2. **API Keys**: Never commit `.env` files with keys; use environment variables
3. **HTTPS**: Enable SSL/TLS for production (Vercel handles this automatically)
4. **Database Access**: Restrict direct access to `typeform.db`
5. **Input Validation**: Pydantic handles validation on the backend

---

## Support & Troubleshooting

For issues, refer to:

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Azure VM Setup Guide](https://docs.microsoft.com/en-us/azure/virtual-machines/)

---

## Quick Reference: Commands

### Local Development
```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate && uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Azure VM
```bash
# Start services
pm2 start typeform-backend typeform-frontend
pm2 logs

# Access: http://20.219.130.205:3000
```

### Vercel
```bash
# Push to GitHub triggers auto-deploy
git push origin main

# Access: https://typeform-clone.vercel.app
```
