# GitHub + Cloudflare Development Setup Guide

## 1. GitHub Repository Structure

First, create a new GitHub repository with this structure:

```
najd-commercial-hub/
├── .gitignore
├── README.md
├── package.json
├── wrangler.toml
├── /src/
│   ├── /pages/
│   │   ├── index.html
│   │   ├── /css/
│   │   ├── /js/
│   │   └── /assets/
│   └── /worker/
│       └── index.js
├── /environments/
│   ├── dev.toml
│   └── prod.toml
└── /.github/
    └── /workflows/
        └── deploy.yml
```

## 2. Initial Repository Setup

### Create `.gitignore`
```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Cloudflare
dist/
.wrangler/
wrangler.toml.bak

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build outputs
build/
public/dist/
```

### Create `package.json`
```json
{
  "name": "najd-commercial-hub",
  "version": "1.0.0",
  "description": "Najd Commercial Hub - Landing Page and Contact Form Handler",
  "main": "index.js",
  "scripts": {
    "dev:pages": "wrangler pages dev src/pages --port 3000",
    "dev:worker": "wrangler dev src/worker/index.js --port 8787",
    "deploy:dev": "npm run deploy:worker:dev && npm run deploy:pages:dev",
    "deploy:prod": "npm run deploy:worker:prod && npm run deploy:pages:prod",
    "deploy:worker:dev": "wrangler deploy src/worker/index.js --env dev",
    "deploy:worker:prod": "wrangler deploy src/worker/index.js --env production",
    "deploy:pages:dev": "wrangler pages deploy src/pages --project-name najd-hub-dev",
    "deploy:pages:prod": "wrangler pages deploy src/pages --project-name najd-hub-prod"
  },
  "keywords": ["cloudflare", "workers", "pages", "contact-form"],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "wrangler": "^3.0.0"
  }
}
```

## 3. Cloudflare Wrangler Configuration

### Main `wrangler.toml`
```toml
name = "najd-contact-handler"
main = "src/worker/index.js"
compatibility_date = "2024-01-01"

# Default environment (development)
[env.dev]
name = "najd-contact-handler-dev"
vars = { ENVIRONMENT = "development" }

[env.production]
name = "najd-contact-handler-prod"
vars = { ENVIRONMENT = "production" }

# KV Namespaces (if needed later)
# [[env.dev.kv_namespaces]]
# binding = "LEADS_KV"
# id = "your-dev-kv-id"

# [[env.production.kv_namespaces]]
# binding = "LEADS_KV"
# id = "your-prod-kv-id"
```

## 4. Environment-Specific Configurations

### `environments/dev.toml`
```toml
# Development environment variables
GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_DEV_SCRIPT_ID/exec"
NOTIFICATION_EMAIL = "dev@najdcommercialhub.ma"
FROM_EMAIL = "noreply-dev@najdcommercialhub.ma"
ALLOWED_ORIGINS = ["http://localhost:3000", "https://najd-hub-dev.pages.dev"]
```

### `environments/prod.toml`
```toml
# Production environment variables
GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_PROD_SCRIPT_ID/exec"
NOTIFICATION_EMAIL = "info@najdcommercialhub.ma"
FROM_EMAIL = "noreply@najdcommercialhub.ma"
ALLOWED_ORIGINS = ["https://najdcommercialhub.ma", "https://www.najdcommercialhub.ma"]
```

## 5. GitHub Actions Workflow

### `.github/workflows/deploy.yml`
```yaml
name: Deploy to Cloudflare

on:
  push:
    branches:
      - main        # Production deployment
      - develop     # Development deployment
  pull_request:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Deploy to Development
        if: github.ref == 'refs/heads/develop'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy src/worker/index.js --env dev

      - name: Deploy Pages to Development
        if: github.ref == 'refs/heads/develop'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy src/pages --project-name najd-hub-dev

      - name: Deploy to Production
        if: github.ref == 'refs/heads/main'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy src/worker/index.js --env production

      - name: Deploy Pages to Production
        if: github.ref == 'refs/heads/main'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy src/pages --project-name najd-hub-prod
```

## 6. Step-by-Step Setup Instructions

### Step 1: Create GitHub Repository
1. Go to GitHub and create a new repository named `najd-commercial-hub`
2. Clone it locally:
```bash
git clone https://github.com/yourusername/najd-commercial-hub.git
cd najd-commercial-hub
```

### Step 2: Setup Local Environment
```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Initialize the project
npm init -y
npm install --save-dev wrangler

# Create the directory structure
mkdir -p src/pages/{css,js,assets}
mkdir -p src/worker
mkdir -p environments
mkdir -p .github/workflows
```

### Step 3: Add Your Files
- Move your existing HTML/CSS/JS files to `src/pages/`
- Move your worker code to `src/worker/index.js`
- Create the configuration files shown above

### Step 4: Configure Cloudflare
```bash
# Create development worker
wrangler deploy src/worker/index.js --env dev

# Create production worker
wrangler deploy src/worker/index.js --env production

# Create Pages projects
wrangler pages project create najd-hub-dev
wrangler pages project create najd-hub-prod
```

### Step 5: Setup GitHub Secrets
In your GitHub repository settings, add these secrets:
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

To get these:
```bash
# Get account ID
wrangler whoami

# Create API token at: https://dash.cloudflare.com/profile/api-tokens
# Use the "Custom token" template with these permissions:
# - Zone:Zone:Read (for your domain)
# - Zone:DNS:Edit (for your domain)
# - User:User Details:Read
# - Account:Cloudflare Workers:Edit
# - Account:Cloudflare Pages:Edit
```

## 7. Development Workflow

### Local Development
```bash
# Start local development for pages
npm run dev:pages

# Start local development for worker (in another terminal)
npm run dev:worker

# Test your forms locally at http://localhost:3000
# Worker will be available at http://localhost:8787
```

### Deployment Workflow
1. **Development**: Push to `develop` branch → Auto-deploys to dev environment
2. **Production**: Create PR from `develop` to `main` → Review → Merge → Auto-deploys to production

### Manual Deployment
```bash
# Deploy to development
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

## 8. Domain Configuration

### Development URLs
- Worker: `https://najd-contact-handler-dev.yoursubdomain.workers.dev`
- Pages: `https://najd-hub-dev.pages.dev`

### Production URLs
- Worker: `https://najd-contact-handler-prod.yoursubdomain.workers.dev`
- Pages: Custom domain `https://najdcommercialhub.ma`

### Setting Up Custom Domain
1. In Cloudflare Dashboard → Pages → najd-hub-prod → Custom domains
2. Add `najdcommercialhub.ma` and `www.najdcommercialhub.ma`
3. Cloudflare will automatically handle SSL certificates

## 9. Environment Variables Management

Update your worker code to use environment variables:

```javascript
export default {
  async fetch(request, env, ctx) {
    const ENVIRONMENT = env.ENVIRONMENT || 'development';
    const GOOGLE_SCRIPT_URL = env.GOOGLE_SCRIPT_URL;
    const NOTIFICATION_EMAIL = env.NOTIFICATION_EMAIL;
    
    // Your existing worker code here...
  }
};
```

## 10. Monitoring and Debugging

### View Logs
```bash
# Development worker logs
wrangler tail najd-contact-handler-dev

# Production worker logs
wrangler tail najd-contact-handler-prod
```

### Testing
```bash
# Test development worker
curl -X POST https://najd-contact-handler-dev.yoursubdomain.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","phone":"123456789"}'
```

This setup gives you:
- ✅ Separate dev/prod environments
- ✅ Automated deployments via GitHub Actions
- ✅ Environment-specific configurations
- ✅ Professional development workflow
- ✅ Easy local development and testing
- ✅ Proper version control and collaboration