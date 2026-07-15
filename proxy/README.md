# AURORA AI proxy (Cloudflare Worker)

Keeps **your** `XAI_API_KEY` secret on the server so the website + iPhone app can share one key without users pasting anything.

## One-time setup (~5 minutes)

### 1. Create a free Cloudflare account
https://dash.cloudflare.com/sign-up

### 2. Install Wrangler & login
```bash
cd ~/aurora-weather/proxy
npx wrangler login
```

### 3. Deploy the worker
```bash
npx wrangler deploy
```

Copy the URL it prints, e.g.  
`https://aurora-ai.<your-subdomain>.workers.dev`

### 4. Add your xAI key (secret — never commit)
```bash
npx wrangler secret put XAI_API_KEY
```
Paste the key from https://console.x.ai when prompted.

### 5. Tell the website about the proxy

**GitHub → your Aurora repo → Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|------|--------|
| `VITE_AI_PROXY_URL` | `https://aurora-ai.YOUR_SUBDOMAIN.workers.dev` |

Then re-run deploy (or push any commit) so the site rebuilds with that URL.

### 6. Local / iPhone dev
In `~/aurora-weather/.env`:
```
XAI_API_KEY=xai-...
VITE_AI_PROXY_URL=https://aurora-ai.YOUR_SUBDOMAIN.workers.dev
```

Local `npm run dev` can also use the built-in `/api/ask` proxy (reads `XAI_API_KEY` from `.env`).

For the iPhone app after changing env:
```bash
cd ~/aurora-weather
npm run build:ios
# then ▶ in Xcode
```

## Cost notes
- Proxy is free on Cloudflare’s free tier.
- You pay only xAI usage (short answers, cheap model).
- Rate limit: ~30 questions / minute / IP.
