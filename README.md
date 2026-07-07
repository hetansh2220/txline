# TxLINE

Monorepo with two independent apps.

```
txline/
├─ web/      Next.js frontend — wallet connect + TxLINE subscribe/activate
└─ server/   Node/Express backend — proxies the TxLINE REST API (write your own routes)
```

## Run

**Frontend** (http://localhost:3000):
```bash
cd web
pnpm install
pnpm dev
```

**Backend** (http://localhost:4000):
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

The frontend reaches the backend via `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`). Set it in `web/.env.local` to point at a deployed backend.

## Deploy

The two apps deploy independently — frontend to a static/edge host (e.g. Vercel), backend to a Node host (e.g. Railway/Render). Secrets live only in the backend; lock CORS to the real frontend origin in production.
