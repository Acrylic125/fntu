# FNTU API
This is only meant to be used as a playground to explore what FNTU has scraped.

This project should be treated as a reference rather than a Managed API. We recommend you clone this project, change out the API to meet your use cases, and deploy to your own infrastructure.

## Development
Copy `.env.example` and name it `.env`. Configure it based on the instructions.
Run `pnpm dev` to run a local dev environment.

## Deployment
2 guided approaches that's *free*, but you can easily deploy this anywhere. [Read More](https://hono.dev/docs/getting-started/nodejs)
- Cloudflare Workers (Recommended for general prortotyping / production)
- NodeJS (Recommended for beginners)

### Deploy on Cloudflare (Recommended)
Cloudflare is pretty generous with their Free Tier limits, this approach is *recommended*.

The project uses:
- Cloudflare Workers to host/run the API.
- Worker KV to store user generated API Keys.
- PostgreSQL (Any PostgreSQL provider works)

Configure the environment accordingly,
```bash
# Create KV namespace, fntu_api_kv
npx wrangler kv namespace create fntu_api_kv

# Add database URL secret. Paste in the DB URL.
npx wrangler secret put DATABASE_URL

# Add API Key Secret for signing API Keys
# 1. Generate a secret. Use a different secret than the one you used for .env.
openssl rand -hex 32 
# 2. Add API KEY SECRET. Paste the generated string from (1).
npx wrangler secret put API_KEY_JWT_SECRET
```

When you are ready, run `pnpm run deploy` to deploy.

### Deploy Node
Recommended for beginners who have no prior experience.
(Guide coming soon)