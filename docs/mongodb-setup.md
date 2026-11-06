# Connecting MongoDB

BlockPass stores events, orders, reviews and encrypted wallet keys in MongoDB. The API reads its
connection from one environment variable, `MONGO_URI`.

Use [MongoDB Atlas](#option-1-mongodb-atlas) for anything deployed, and
[local MongoDB](#option-2-local-mongodb) for development on your own machine.

## Option 1: MongoDB Atlas

Atlas is MongoDB's hosted service, and its free tier is enough for the demo.

### 1. Create a cluster

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register).
2. Create a project, for example `BlockPass`.
3. Create a free cluster, and choose the region closest to your users.

### 2. Create a database user

1. Open **Database Access** and select **Add New Database User**.
2. Choose **Password** authentication, and use the generated password.
3. Give the user **Read and write to any database**.
4. Save the password somewhere private. Atlas won't show it again.

### 3. Allow network access

Open **Network Access** and select **Add IP Address**.

| Where the API runs | What to allow |
| --- | --- |
| Your own computer | **Add Current IP Address** |
| Vercel | `0.0.0.0/0`, because Vercel doesn't use fixed IP addresses |

`0.0.0.0/0` lets any address attempt to connect, so the database then relies entirely on its
password. Use a long, generated one.

### 4. Copy the connection string

1. Open **Database**, select **Connect** on your cluster, and choose **Drivers**.
2. Copy the string, which looks like this:

   ```text
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```

3. Replace `<username>` and `<password>` with your database user's details.
4. Add the database name `blockpass` after `.mongodb.net/`:

   ```text
   mongodb+srv://blockpass_app:YOUR_PASSWORD@cluster0.abcde.mongodb.net/blockpass?retryWrites=true&w=majority
   ```

If your password contains special characters such as `@`, `:`, `/` or `#`, replace them with their
[percent-encoded](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) values. For
example, `@` becomes `%40`.

### 5. Connect the API

**On your computer**, set the value in `backend/.env`:

```bash
MONGO_URI=mongodb+srv://blockpass_app:YOUR_PASSWORD@cluster0.abcde.mongodb.net/blockpass?retryWrites=true&w=majority
```

`backend/.env` is ignored by Git. Never commit a connection string.

**On Vercel**, open the API project, go to **Settings > Environment Variables**, add `MONGO_URI`,
and redeploy. See [the deployment guide](round-one/deployment.md) for the other variables.

### 6. Add the data

Run these from `backend/`. They use `MONGO_URI` from `backend/.env`, and the demo purchases in the
seed are real Stellar testnet transactions, so it takes a few minutes.

```bash
npm run stellar:setup
npm run seed
npm run user:create -- admin@blockpass.co.ke admin "BlockPass Admin"
```

The last command prints a password for the admin account. Save it privately. To create the organizer
and attendee demo logins, run it again with `organizer` or `attendee`:

```bash
npm run user:create -- organizer@blockpass.co.ke organizer
npm run user:create -- attendee@blockpass.co.ke attendee
```

To seed a deployed database without changing `backend/.env`, set the value for one command:

```bash
MONGO_URI="<your Atlas connection string>" npm run seed
```

Use the same `WALLET_ENCRYPTION_KEY` here and on the deployed API. Wallet and issuer keys encrypted
with one key can't be read with another.

### 7. Check the connection

Start the API with `npm run dev`, then open these URLs, using your `PORT` value if it isn't 5000:

- `http://localhost:5000/api/health` should return `{"status":"ok"}`.
- `http://localhost:5000/api/events` should list the seeded events.

In Atlas, select **Browse Collections** to see the `blockpass` database.

## Option 2: Local MongoDB

1. Install [MongoDB Community Edition](https://www.mongodb.com/docs/manual/administration/install-community/).
2. Start it. On Linux, run `sudo systemctl start mongod`.
3. Set this value in `backend/.env`:

   ```bash
   MONGO_URI=mongodb://127.0.0.1:27017/blockpass
   ```

4. Run the commands in [Add the data](#6-add-the-data).

## Troubleshooting

| Message or symptom | Likely cause | Fix |
| --- | --- | --- |
| `MONGO_URI is not defined in the environment` | The variable is missing | Add it to `backend/.env`, and run the command from `backend/` |
| `bad auth : authentication failed` | Wrong username or password | Check the database user, not your Atlas login, and percent-encode special characters |
| `Could not connect to any servers` or a timeout | Your IP address isn't allowed | Add it under **Network Access** |
| `ECONNREFUSED 127.0.0.1:27017` | Local MongoDB isn't running | Start `mongod` |
| `querySrv ENOTFOUND` | Mistyped cluster address | Copy the connection string from Atlas again |
| The API connects but the storefront is empty | The database hasn't been seeded, or the name is different | Run `npm run seed`, and check the database name in `MONGO_URI` |
| Tickets fail after moving databases | `WALLET_ENCRYPTION_KEY` changed | Restore the key that encrypted the data |
