# Deploying to Vercel

The app is two Vercel projects from this repository, plus a free MongoDB Atlas cluster.

## 1. Database

Create a MongoDB Atlas cluster and copy its connection string by following
[Connecting MongoDB](../mongodb-setup.md).

## 2. API project

Create a Vercel project with **Root Directory** `backend`, and set:

| Variable | Value |
| --- | --- |
| `MONGO_URI` | Atlas connection string |
| `JWT_SECRET` | Value from `backend/.env` |
| `WALLET_ENCRYPTION_KEY` | Value from `backend/.env` |
| `STELLAR_DISTRIBUTOR_SECRET` | Value from `backend/.env` |
| `STELLAR_STABLECOIN_ISSUER_SECRET` | Value from `backend/.env` |
| `CLIENT_URL` | The web project's URL, once known |

Keep `WALLET_ENCRYPTION_KEY` unchanged after launch. Stored wallet and issuer keys can't be decrypted
without it.

Seed the database from your machine:

```bash
cd backend
MONGO_URI="<atlas connection string>" npm run seed
```

Create the admin account the same way, and keep the password it prints somewhere private. Use a
different password from any local demo account.

```bash
MONGO_URI="<atlas connection string>" npm run user:create -- <admin email> admin "BlockPass Admin"
```

Check `https://<api-project>.vercel.app/api/health` returns `{"status":"ok"}`.

## 3. Web project

Create a Vercel project with **Root Directory** `frontend`, and set `API_URL` to
`https://<api-project>.vercel.app/api`. Set it before the first build, because the `/api` proxy is
fixed at build time.

## 4. Verify

Buy a ticket on the deployed site, and confirm the transaction opens on StellarExpert. Vercel's
function logs show the `order.received` and `mint.confirmed` lines for the SOW's log evidence.
