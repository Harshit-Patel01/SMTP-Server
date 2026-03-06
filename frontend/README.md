# Mailflow

Temporary (disposable) email service: get an instant address, receive mail in the browser, no signup.

## Run the project

### Backend (API + SMTP)

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase URL and anon key
npm install
npm start
```

- API runs on **port 3004**
- SMTP runs on port 25 (if available)

See `backend/README.md` for Supabase table setup and API details.

### Frontend

From the **project root**:

```bash
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend at port 3004.

### Production

- Build frontend: `npm run build` (output in `dist/`)
- Serve `dist/` with any static host and point API requests to your backend URL (set `VITE_API_URL` when building if needed).

## Stack

- **Frontend:** React, TypeScript, Vite, React Router
- **Backend:** Express, Supabase, SMTP server (mailparser)

## Features

- Generate random temporary emails
- Copy address, generate new, multiple addresses per session
- Inbox with auto-refresh (30s), search, mark all read, delete all / single
- Full email view (HTML and plain text)
- Dark/light theme, keyboard shortcut (Ctrl+R to refresh)
- Landing page with “Why Mailflow”, “How it works”, FAQ, CTA
