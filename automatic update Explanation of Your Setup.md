Okay, let's break down your setup and then fix the deployment issue.

## Explanation of Your Setup

You have a well-structured project for deploying a Cloudflare Worker (for backend logic like handling form submissions) and Cloudflare Pages (for your static website frontend) using GitHub Actions for CI/CD.

**Key Components:**

1.  **`src/worker/index.js` (Cloudflare Worker Code):**
    *   This is the JavaScript code that runs on Cloudflare's edge.
    *   It's designed to handle POST requests, likely from a contact form on your website.
    *   It uses `env.MAILCHANNELS_API_KEY` to get the API key for MailChannels.
    *   It differentiates behavior based on `env.ENVIRONMENT` (`development` or `production`).
    *   It implements CORS (Cross-Origin Resource Sharing) to control which domains can make requests to it.
    *   It sends an admin notification email and, in production, a confirmation email to the user via MailChannels.
    *   It expects other environment variables like `PROD_ADMIN_EMAIL`, `DEV_ADMIN_EMAIL`, etc., which are currently *not* being set in your `deploy.yml` or `wrangler.toml` (this is another potential issue).

2.  **`src/pages/` (Cloudflare Pages Site):**
    *   This directory contains the static files (HTML, CSS, JS, assets) for your website.
    *   Cloudflare Pages will build and deploy this.

3.  **`wrangler.toml` (Worker Configuration):**
    *   Defines the main entry point for your worker (`src/worker/index.js`).
    *   Sets up two environments: `dev` and `production`.
    *   For each environment, it sets a `name` for the deployed worker (e.g., `najd-contact-handler-dev`) and a plain-text variable `ENVIRONMENT`.
    *   **Important:** This file is for *non-sensitive* configuration. Secrets like API keys should *not* be placed here.

4.  **`.github/workflows/deploy.yml` (GitHub Actions Workflow):**
    *   This automates your deployment process.
    *   **Trigger:** Runs on pushes to `main` and `develop` branches.
    *   **Job `deploy`:**
        *   Checks out your code.
        *   Sets up Node.js.
        *   Installs npm dependencies (`npm ci`).
        *   **Conditional Deployment Steps:**
            *   If the push is to `develop`:
                *   Deploys the Worker to the `dev` environment using `cloudflare/wrangler-action`. It passes `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from GitHub secrets. It *tries* to pass `MAILCHANNELS_API_KEY` as an environment variable *to the action runner*.
                *   Deploys Pages to the `najd-hub-dev` project.
            *   If the push is to `main`:
                *   Deploys the Worker to the `production` environment.
                *   Deploys Pages to the `najd-hub-prod` project.

5.  **`cloudflare-github-setup.md` (Your Setup Guide):**
    *   This document outlines the intended structure and setup steps. It's mostly aligned with your current files, but there are some discrepancies (e.g., it mentions `environments/dev.toml` and `environments/prod.toml` which are not directly used by `wrangler deploy` for secrets unless you were to manually parse them and use `wrangler secret put`). The primary way secrets are handled in CI/CD is via GitHub Secrets passed to the `wrangler-action`.

6.  **GitHub Secrets (from screenshot):**
    *   `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID.
    *   `CLOUDFLARE_API_TOKEN`: An API token allowing GitHub Actions to deploy to Cloudflare.
    *   `MAILCHANNELS_API_KEY`: Your MailChannels API key.

## The Issue: `MAILCHANNELS_API_KEY` Not Set in Worker Environment

The log "CRITICAL: MAILCHANNELS_API_KEY secret is not set in Worker environment!" tells you exactly what's wrong.

Even though `MAILCHANNELS_API_KEY` is a GitHub secret and you're setting it in the `env` block of your GitHub Actions step:

```yaml
      - name: Deploy Worker to Development
        if: github.ref == 'refs/heads/develop'
        uses: cloudflare/wrangler-action@v3
        env: # THIS SETS THE ENV VAR FOR THE ACTION RUNNER
          MAILCHANNELS_API_KEY: ${{ secrets.MAILCHANNELS_API_KEY }}
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env dev
```

This `env:` block makes `MAILCHANNELS_API_KEY` available as an environment variable *to the GitHub Actions runner* that is executing the `cloudflare/wrangler-action`. However, the `wrangler-action` itself needs to be explicitly told to take this runner environment variable and set it as a **secret** in the Cloudflare Worker environment.

## How to Resolve the Issue

You need to use the `secrets` input within the `with:` block of the `cloudflare/wrangler-action` step. This input tells the action which environment variables (that are present in the runner's environment) should be uploaded as secrets to Cloudflare.

**Modify your `deploy.yml`:**

You need to add the `secrets: |` block to your worker deployment steps.

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches:
      - main
      - develop

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    timeout-minutes: 10

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit
        timeout-minutes: 3

      # Deploy with the secret injected as environment variable
      - name: Deploy Worker to Development
        if: github.ref == 'refs/heads/develop'
        uses: cloudflare/wrangler-action@v3
        env: # This makes the GitHub secret available as an env var to the runner
          MAILCHANNELS_API_KEY: ${{ secrets.MAILCHANNELS_API_KEY }}
          # Add other secrets your dev worker needs here, e.g.:
          # DEV_ADMIN_EMAIL: ${{ secrets.DEV_ADMIN_EMAIL_SECRET }}
          # DEV_FROM_EMAIL: ${{ secrets.DEV_FROM_EMAIL_SECRET }}
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env dev
          secrets: | # This tells wrangler-action to upload these runner env vars as secrets
            MAILCHANNELS_API_KEY
            # Add other secret names here if you defined them above, e.g.:
            # DEV_ADMIN_EMAIL
            # DEV_FROM_EMAIL

      - name: Deploy Worker to Production
        if: github.ref == 'refs/heads/main'
        uses: cloudflare/wrangler-action@v3
        env: # This makes the GitHub secret available as an env var to the runner
          MAILCHANNELS_API_KEY: ${{ secrets.MAILCHANNELS_API_KEY }}
          # Add other secrets your prod worker needs here, e.g.:
          # PROD_ADMIN_EMAIL: ${{ secrets.PROD_ADMIN_EMAIL_SECRET }}
          # PROD_FROM_EMAIL: ${{ secrets.PROD_FROM_EMAIL_SECRET }}
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env production
          secrets: | # This tells wrangler-action to upload these runner env vars as secrets
            MAILCHANNELS_API_KEY
            # Add other secret names here if you defined them above, e.g.:
            # PROD_ADMIN_EMAIL
            # PROD_FROM_EMAIL

      - name: Deploy Pages to Development
        if: github.ref == 'refs/heads/develop'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy src/pages --project-name najd-hub-dev

      - name: Deploy Pages to Production
        if: github.ref == 'refs/heads/main'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy src/pages --project-name najd-hub-prod
```

**Explanation of Changes:**

1.  **`env:` block (unchanged logic, but important for context):**
    *   `MAILCHANNELS_API_KEY: ${{ secrets.MAILCHANNELS_API_KEY }}`
    *   This line makes the value of your GitHub repository secret `MAILCHANNELS_API_KEY` available as an environment variable named `MAILCHANNELS_API_KEY` to the GitHub Actions runner environment when this step executes.

2.  **`secrets: |` block (the fix):**
    *   `secrets: |`
        `  MAILCHANNELS_API_KEY`
    *   This is an input to the `cloudflare/wrangler-action`. You provide a multi-line string where each line is the *name* of an environment variable (that exists in the runner's environment, thanks to the `env:` block).
    *   The `wrangler-action` will then take the *values* of these specified runner environment variables and set them as **secrets** in your Cloudflare Worker's settings for the given environment (`dev` or `production`).

**Additional Necessary Steps (VERY IMPORTANT):**

Your `index.js` worker code also uses other environment variables like:
*   `env.PROD_ADMIN_EMAIL`
*   `env.PROD_FROM_EMAIL`
*   `env.DEV_ADMIN_EMAIL`
*   `env.DEV_FROM_EMAIL`

These are **NOT** currently being set for your worker! You need to:

1.  **Add them as GitHub Secrets:**
    *   Go to your GitHub repository -> Settings -> Secrets and variables -> Actions.
    *   Add new repository secrets, for example:
        *   `PROD_ADMIN_EMAIL_SECRET` (e.g., `contact@najdcommercialhub.ma`)
        *   `PROD_FROM_EMAIL_SECRET` (e.g., `noreply@najdcommercialhub.ma`)
        *   `DEV_ADMIN_EMAIL_SECRET` (e.g., `dev-contact@najdcommercialhub.ma`)
        *   `DEV_FROM_EMAIL_SECRET` (e.g., `noreply-dev@najdcommercialhub.ma`)
        *(I've added `_SECRET` to the GitHub secret names to make it clear they are GitHub secrets, and the worker will access them via `env.PROD_ADMIN_EMAIL` etc. You can name them identically if you prefer, but ensure the mapping is correct in `deploy.yml`)*

2.  **Update `deploy.yml` to pass these new secrets:**
    I've added placeholders for these in the corrected `deploy.yml` above. You'll need to uncomment and adjust them.

    For example, for the development worker deployment:
    ```yaml
          env:
            MAILCHANNELS_API_KEY: ${{ secrets.MAILCHANNELS_API_KEY }}
            DEV_ADMIN_EMAIL: ${{ secrets.DEV_ADMIN_EMAIL_SECRET }} # Use the actual GitHub secret name
            DEV_FROM_EMAIL: ${{ secrets.DEV_FROM_EMAIL_SECRET }}   # Use the actual GitHub secret name
          with:
            # ... other settings
            secrets: |
              MAILCHANNELS_API_KEY
              DEV_ADMIN_EMAIL # This must match the key used in the 'env' block above
              DEV_FROM_EMAIL  # This must match the key used in the 'env' block above
    ```
    And similarly for the production worker deployment, mapping to `PROD_ADMIN_EMAIL_SECRET` and `PROD_FROM_EMAIL_SECRET`.

After making these changes to `deploy.yml` and adding the necessary GitHub secrets, commit and push. The GitHub Action should now correctly deploy your worker with all the required secrets, and the "MAILCHANNELS_API_KEY secret is not set" error should be resolved. You can then verify in the Cloudflare Dashboard (Workers & Pages -> Your Worker -> Settings -> Variables -> Environment Variables -> Edit variables -> check for "Secret" type variables).