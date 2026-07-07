# TxLINE backend

Node/Express backend that proxies the TxLINE REST API. **No routes are implemented yet — add your own.**

## Run

```bash
cd server
npm install
cp .env.example .env
npm run dev        # http://localhost:4000
```

## Endpoints the frontend expects

The Next app ([lib/txline/use-activate.ts](../lib/txline/use-activate.ts)) calls these on `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`):

| Method & path | Body | Returns |
|---|---|---|
| `POST /auth/guest/start` | — | `{ token }` (guest JWT) |
| `POST /api/token/activate` | `{ txSig, walletSignature, leagues, jwt }` | `{ token }` (API token) |

Point the frontend at this server by setting `NEXT_PUBLIC_API_URL` in the Next app's env. Add data endpoints (fixtures/odds/scores/stat-validation) here as needed.
