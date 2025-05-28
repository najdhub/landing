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
