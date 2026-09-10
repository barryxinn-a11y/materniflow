# Deployment Guide — MaterniFlow

## Quick Start

**Already deployed:** Visit https://materniflow-ai-agent.vercel.app/chat

**Want to deploy your own?** Follow the steps below.

---

## Prerequisites

- [ ] GitHub account with this repository
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] AWS account with Bedrock access
- [ ] NeonDB account (serverless PostgreSQL)
- [ ] Node.js 20+ and Python 3.12+ installed locally

---

## Part 1: Local Setup

### Step 1: Clone and Install

```bash
git clone https://github.com/barryxinn-a11y/materniflow.git
cd materniflow

# Install all dependencies
mise run inst
```

### Step 2: Create .env File

Copy credentials from your services:

```bash
# Create .env in project root
DB_HOST=ep-your-host-pooler.us-east-2.aws.neon.tech
DB_PORT=5432
DB_USER=neondb_owner
DB_PASS=your_neon_password
DB_NAME=neondb
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1
```

**Where to find these:**

| Variable | Source |
|----------|--------|
| `DB_HOST` | NeonDB console → Connection string |
| `DB_PORT` | NeonDB console → Connection string (usually 5432) |
| `DB_USER` | NeonDB console → Connection string |
| `DB_PASS` | NeonDB console → Connection string |
| `DB_NAME` | NeonDB console (usually "neondb") |
| `AWS_*` | AWS IAM console → Create access key |

### Step 3: Test Locally

```bash
# Download test data
mise run download-db

# Start dev servers (Next.js + FastAPI)
mise run dev
```

Visit: http://localhost:3000/chat

Test by asking the Agent a question. If it works locally, it'll work in production.

---

## Part 2: AWS Setup

### Create Bedrock Access

**Why:** The Agent uses Claude 3.5 Sonnet via AWS Bedrock.

**Steps:**

1. Go to https://console.aws.amazon.com/bedrock
2. Click "Model access" (left sidebar)
3. Click "Manage model access"
4. Find "Claude 3.5 Sonnet"
5. Click checkbox to enable
6. Click "Save changes"
7. Wait 5-10 minutes for approval

### Create IAM User for API Access

1. Go to https://console.aws.amazon.com/iam/home#/users
2. Click "Create user"
3. Name: `materniflow-bedrock-user`
4. Click "Next"
5. Click "Attach policies directly"
6. Search for and select `AmazonBedrockFullAccess`
7. Click "Next" → "Create user"
8. Click the user you just created
9. Go to "Security credentials" tab
10. Scroll to "Access keys"
11. Click "Create access key"
12. Select "Application running outside AWS"
13. Click "Next"
14. Copy the **Access Key ID** and **Secret Access Key**
15. Save these in your `.env` file

---

## Part 3: NeonDB Setup

### Create Database

1. Go to https://console.neon.tech
2. Click "Create new project"
3. Name: `materniflow` (or your preference)
4. Select region (closest to your deployment)
5. Click "Create project"
6. Wait for database to initialize

### Get Connection String

1. In NeonDB console, find "Connection string"
2. Copy the full URL that looks like:
   ```
   postgresql://neondb_owner:password@host:5432/neondb?sslmode=require
   ```
3. Extract values for your `.env`:
   - `DB_HOST` = the `host` part
   - `DB_USER` = `neondb_owner` (usually)
   - `DB_PASS` = the password part
   - `DB_NAME` = `neondb` (usually)
   - `DB_PORT` = `5432` (usually)

### Download Test Data

```bash
# This downloads pre-populated data from S3
mise run download-db
```

### Sync Data to NeonDB

```bash
# This syncs local SQLite to remote PostgreSQL
.venv/bin/python scripts/test_sync_data_to_remote_db.py
```

Wait for completion. You should see:
```
Sync completed successfully!
patient: 50 rows
admission: 15 rows
...
```

---

## Part 4: Vercel Deployment

### Step 1: Connect GitHub

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Click "Import Git Repository"
4. Authorize GitHub and select your fork of this repo
5. Click "Import"

### Step 2: Configure Environment Variables

1. On the import screen, you'll see "Environment Variables"
2. Add all 8 variables from your `.env` file:

| Variable | Value |
|----------|-------|
| `DB_HOST` | (from `.env`) |
| `DB_PORT` | 5432 |
| `DB_USER` | neondb_owner |
| `DB_PASS` | (from `.env`) |
| `DB_NAME` | neondb |
| `AWS_ACCESS_KEY_ID` | (from AWS) |
| `AWS_SECRET_ACCESS_KEY` | (from AWS) |
| `AWS_DEFAULT_REGION` | us-east-1 |

**⚠️ Important:** Make absolutely sure there are NO EXTRA SPACES in values. Spaces become part of the value!

### Step 3: Deploy

1. Click "Deploy"
2. Wait 3-5 minutes for build
3. When status shows "Ready", click "Visit"

**Congratulations! Your Agent is now live. 🎉**

Visit: `https://your-project-name.vercel.app/chat`

---

## Troubleshooting

### Deployment Failed

Check the build logs:

1. Go to Vercel project
2. Click "Deployments" tab
3. Click the failed deployment
4. Click "Logs"
5. Look for error messages

**Common issues:**

| Error | Cause | Fix |
|-------|-------|-----|
| `ModuleNotFoundError: psycopg2` | Missing dependencies | Ensure `.vercelignore` doesn't ignore `pyproject.toml` |
| `Database connection error` | Wrong credentials | Verify all 5 `DB_*` variables are correct in Vercel |
| `AccessDenied` | AWS credentials invalid | Verify `AWS_*` variables, check IAM permissions |
| `Build failed` | Node/Python version mismatch | Use Node 20+, Python 3.12+ |

### Agent Not Responding

If the chat loads but Agent doesn't respond:

1. Check Vercel "Functions" logs:
   - Go to project → "Logs" tab
   - Filter by `/api/chat` 
   - Look for error messages

2. Common causes:
   - Database offline (check NeonDB)
   - AWS credentials wrong
   - Bedrock model not enabled
   - Cold start timeout (refresh and try again)

### Slow Responses

First request may be slow (cold start). Subsequent requests are fast.

**If consistently slow:**
- Check NeonDB is not in Scale-to-Zero sleep mode (access it directly)
- Check AWS Bedrock latency (run a test query)
- Check network in browser DevTools

---

## Continuous Deployment

### Auto-Deploy on Git Push

Vercel auto-deploys on every push to your main branch.

**To deploy your changes:**

```bash
git add .
git commit -m "Your change"
git push origin main
```

Vercel will automatically:
1. Build the project
2. Run tests (if configured)
3. Deploy to production
4. Show status in GitHub PR/commit

**To disable auto-deploy:**
- Vercel dashboard → Settings → Git → uncheck "Deploy on push"
- Then manually click "Redeploy" when you want to deploy

---

## Monitoring

### Health Check

```bash
curl https://materniflow-ai-agent.vercel.app/api/hello
# Expected response: {"message":"Hello from FastAPI!","status":"success"}
```

### View Logs

```bash
# Install Vercel CLI
npm install -g vercel

# View last 50 log lines
vercel logs --project materniflow-ai-agent --follow
```

### Cold Start Tracking

Every request shows `x-vercel-id` header with:
- `sfo1` = region (San Francisco)
- `8l74p` = request ID
- `1789001918813` = timestamp
- Time taken in logs

### Performance Metrics

**Typical times:**
- Cold start: 500-1500ms
- Warm request: 50-300ms
- Agent reasoning: 2-5 seconds
- Database query: <100ms

---

## Scaling

### Currently

- **Single instance** on Vercel (scales automatically)
- **Single database** on NeonDB (serverless, auto-scales)
- **Free tier** suitable for demos and moderate traffic

### For Production

Consider:

1. **Multi-region deployment** (Vercel supports this)
2. **Database read replicas** (NeonDB paid tier)
3. **Caching layer** (Redis for frequently asked questions)
4. **Rate limiting** (prevent abuse)
5. **Cost tracking** (AWS + NeonDB billing)

---

## Costs

### Monthly Cost (Free Tier)

| Service | Free Tier | Cost |
|---------|-----------|------|
| **Vercel** | Hobby plan | $0 |
| **NeonDB** | 1 project, 0.5GB | $0* |
| **AWS Bedrock** | Pay per token | ~$0.10-1.00/day for light usage |
| **Total** | | ~$0-30/month |

*NeonDB charges only when database is active (not during Scale-to-Zero sleep).

### Optimize Costs

1. **Reduce token usage**
   - Ask the Agent clearer questions
   - Use shorter responses (configure in system prompt)

2. **Reduce database queries**
   - Cache schema between conversations
   - Batch queries where possible

3. **Monitor spending**
   - AWS Budgets alerts
   - NeonDB usage in console

---

## Security Checklist

Before going to production:

- [ ] Environment variables set in Vercel (not in code)
- [ ] `.env` file never committed to Git
- [ ] AWS credentials have minimal permissions (only Bedrock)
- [ ] Database credentials rotated after setup
- [ ] HTTPS enforced (Vercel does this by default)
- [ ] CORS configured for your domain
- [ ] Rate limiting enabled (future work)
- [ ] Error messages don't leak internals

---

## Rollback

If a deployment breaks:

```bash
# Option 1: Redeploy previous version
vercel deploy --prod

# Option 2: Git revert and redeploy
git revert HEAD
git push origin main
# Vercel auto-deploys

# Option 3: Vercel dashboard
# Click "Deployments" → find working version → click "..."  → "Redeploy"
```

---

## Debugging Production

### Enable Debug Logging

Set in Vercel:
```
DEBUG=true
```

This logs:
- All SQL queries
- Agent reasoning steps
- Tool calls
- Response times

### SSH into Vercel Functions (Not Possible)

Vercel functions are ephemeral. Cannot SSH. Use logs only.

### Run Diagnostics Locally

Replicate production environment locally:

```bash
# Use same database
# Same AWS credentials
# Same code version

mis run dev  # Works exactly like production
```

---

## Next Steps

1. **Test thoroughly** before sharing publicly
2. **Monitor costs** for first month
3. **Collect feedback** from users
4. **Plan improvements** (UI enhancements, new tools, etc.)
5. **Measure impact** (query volume, response quality, etc.)

---

## Getting Help

- **Build errors**: Check Vercel logs → deployment details
- **Runtime errors**: Check `/api/chat` function logs
- **Database issues**: Check NeonDB console
- **AWS issues**: Check IAM permissions and Bedrock model access

---

## Deployment Checklist

Before declaring success:

- [ ] Local dev works (`mise run dev`)
- [ ] NeonDB has test data synced
- [ ] Vercel project created
- [ ] 8 environment variables configured
- [ ] Build succeeds (Vercel shows "Ready")
- [ ] Chat page loads at production URL
- [ ] Agent responds to test query
- [ ] Thinking block appears when expanded
- [ ] Write operation works (can assign bed, etc.)

---

**Deployment complete!** 🚀

Your MaterniFlow Agent is now accessible globally at `https://your-project.vercel.app/chat`

Share the link with colleagues, interviewers, or users. No installation required — they just click and chat.
