# Mailflow backend

API and SMTP server for the Mailflow temporary email service. Uses **Postgres** (local or in Docker) for storage.

## Run with Docker Compose (recommended)

From the **project root** (parent of `backend/`):

```bash
docker compose up -d
```

- **Postgres**: port `5432`, database `mailflow`, user/password `mailflow`. Schema is applied automatically from `backend/schema/01_init.sql`.
- **Backend API**: http://localhost:3004
- **SMTP**: port `2525` (inside Docker; use 25 when running backend locally if you have permission)

To rebuild after code changes:

```bash
docker compose up -d --build
```

## Run locally (no Docker)

1. Start Postgres (e.g. local install or a Postgres container with the same credentials).
2. Create the schema once (if not using Docker init):

   ```bash
   cd backend
   psql -h localhost -p 5432 -U mailflow -d mailflow -f schema/01_init.sql
   ```

3. Copy `.env.example` to `.env` and set `DB_*` to match your Postgres:

   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

4. Install and run:

   ```bash
   npm install
   npm start
   ```

- API: http://localhost:3004  
- SMTP: port 25 (or set `SMTP_PORT=2525` to use 2525)

## Required tables and columns

See **`schema/TABLES.md`** for the list of tables and columns. The only table is **`mails`** (id, sender, receiver, header, body, created_at, is_read). Schema is in **`schema/01_init.sql`**.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/config` | Public config (domain) |
| GET | `/api/email/random` | Generate a random temporary email |
| GET | `/api/inbox/:email` | List emails for address |
| GET | `/api/mail/:id` | Get one email (marks as read) |
| GET | `/api/stats/:email` | Email count for address |
| PATCH | `/api/inbox/:email/read` | Mark all as read |
| PATCH | `/api/mail/:id/read` | Mark one as read |
| DELETE | `/api/mail/:id` | Delete one email |
| DELETE | `/api/inbox/:email` | Delete all emails for address |

## Frontend

Run the Vite frontend from the project root. It proxies `/api` to this backend when using `npm run dev`.
