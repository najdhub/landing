#!/bin/bash

# Complete Setup Script for Najd Commercial Hub
# This creates all configuration files and sets up the development environment

echo "⚙️ Setting up configuration files..."

# Create package.json
cat > package.json << 'EOF'
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
    "deploy:pages:prod": "wrangler pages deploy src/pages --project-name najd-hub-prod",
    "local:test": "concurrently \"npm run dev:pages\" \"npm run dev:worker\"",
    "update:paths": "node scripts/update-paths.js"
  },
  "keywords": ["cloudflare", "workers", "pages", "contact-form", "najd", "commercial"],
  "author": "Najd Commercial Hub",
  "license": "MIT",
  "devDependencies": {
    "wrangler": "^3.0.0",
    "concurrently": "^8.0.0"
  }
}
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
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

# Logs
logs/
*.log
EOF

# Create wrangler.toml
cat > wrangler.toml << 'EOF'
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

# Future KV Namespaces (uncomment when needed)
# [[env.dev.kv_namespaces]]
# binding = "LEADS_KV"
# id = "your-dev-kv-id"

# [[env.production.kv_namespaces]]
# binding = "LEADS_KV"
# id = "your-prod-kv-id"
EOF

# Create environment configurations
cat > environments/dev.toml << 'EOF'
# Development environment variables
GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_DEV_SCRIPT_ID/exec"
NOTIFICATION_EMAIL = "dev@najdcommercialhub.ma"
FROM_EMAIL = "noreply-dev@najdcommercialhub.ma"
ALLOWED_ORIGINS = ["http://localhost:3000", "https://najd-hub-dev.pages.dev"]
SEND_CONFIRMATION_EMAIL = "true"
EOF

cat > environments/prod.toml << 'EOF'
# Production environment variables
GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_PROD_SCRIPT_ID/exec"
NOTIFICATION_EMAIL = "info@najdcommercialhub.ma"
FROM_EMAIL = "noreply@najdcommercialhub.ma"
ALLOWED_ORIGINS = ["https://najdcommercialhub.ma", "https://www.najdcommercialhub.ma"]
SEND_CONFIRMATION_EMAIL = "true"
EOF

# Create GitHub Actions workflow
cat > .github/workflows/deploy.yml << 'EOF'
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

      - name: Deploy Worker to Development
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

      - name: Deploy Worker to Production
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
EOF

# Create README.md
cat > README.md << 'EOF'
# Najd Commercial Hub

Professional landing page and contact form system for Najd Commercial Hub investment opportunities.

## 🏗️ Architecture

- **Cloudflare Pages**: Static site hosting with global CDN
- **Cloudflare Workers**: Serverless contact form processing
- **MailChannels**: Transactional email delivery
- **Google Sheets**: Lead data storage via Apps Script
- **GitHub Actions**: Automated CI/CD pipeline

## 🚀 Development

### Local Development
```bash
# Install dependencies
npm install

# Start development servers
npm run local:test

# Or run separately:
npm run dev:pages    # http://localhost:3000
npm run dev:worker   # http://localhost:8787
```

### Deployment
- **Development**: Push to `develop` branch
- **Production**: Push to `main` branch

### Manual Deployment
```bash
npm run deploy:dev   # Deploy to development
npm run deploy:prod  # Deploy to production
```

## 📁 Project Structure

```
najd-commercial-hub/
├── src/
│   ├── pages/          # Static website files
│   │   ├── index.html
│   │   ├── css/
│   │   ├── js/
│   │   └── assets/
│   └── worker/         # Cloudflare Worker
│       └── index.js
├── environments/       # Environment configurations
├── .github/workflows/  # CI/CD pipeline
└── package.json
```

## 🔧 Configuration

### Environment Variables (Cloudflare Dashboard)
- `GOOGLE_SCRIPT_URL`: Google Apps Script webhook URL
- `NOTIFICATION_EMAIL`: Recipient for form submissions
- `FROM_EMAIL`: Sender email address

### GitHub Secrets
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID

## 🌐 URLs

### Development
- Pages: https://najd-hub-dev.pages.dev
- Worker: https://najd-contact-handler-dev.yoursubdomain.workers.dev

### Production
- Pages: https://najdcommercialhub.ma
- Worker: https://najd-contact-handler-prod.yoursubdomain.workers.dev

## 📊 Monitoring

```bash
# View worker logs
wrangler tail najd-contact-handler-dev    # Development
wrangler tail najd-contact-handler-prod   # Production
```

## 🧪 Testing

```bash
# Test development worker
curl -X POST https://najd-contact-handler-dev.yoursubdomain.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","phone":"123456789"}'
```
EOF

# Create scripts directory and path updater
mkdir -p scripts
cat > scripts/update-paths.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Update HTML file paths for new structure
const htmlFile = 'src/pages/index.html';

if (fs.existsSync(htmlFile)) {
    let content = fs.readFileSync(htmlFile, 'utf8');
    
    // Update image paths
    content = content.replace(/src="images\//g, 'src="assets/images/');
    content = content.replace(/src="\.\/images\//g, 'src="assets/images/');
    
    // Update CSS paths
    content = content.replace(/href="([^"]*\.css)"/g, 'href="css/$1"');
    
    // Update JS paths
    content = content.replace(/src="([^"]*\.js)"/g, 'src="js/$1"');
    
    fs.writeFileSync(htmlFile, content);
    console.log('✅ Updated paths in index.html');
} else {
    console.log('❌ index.html not found in src/pages/');
}
EOF

echo "✅ Configuration files created!"
echo ""
echo "📝 Created files:"
echo "  - package.json"
echo "  - .gitignore"
echo "  - wrangler.toml"
echo "  - environments/dev.toml"
echo "  - environments/prod.toml"
echo "  - .github/workflows/deploy.yml"
echo "  - README.md"
echo "  - scripts/update-paths.js"