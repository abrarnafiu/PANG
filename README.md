# PANG – Stock Data & Analysis

Full-stack app: Flask backend (stock APIs protected by Supabase JWT) and React + TypeScript + Vite frontend with **Supabase** login and dashboard/analysis pages.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **Authentication → Providers**, ensure **Email** is enabled.
3. (Optional) Under **Authentication → Settings**, turn off **Confirm email** if you want immediate sign-in without verification.
4. In **Settings → API** copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **JWT Secret** → `SUPABASE_JWT_SECRET` (backend only; keep secret)

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
```

Set the Supabase JWT secret (required to validate tokens):

```bash
export SUPABASE_JWT_SECRET="your-jwt-secret"
python app.py
```

Runs at **http://localhost:5000**.

### 3. Frontend

```bash
cd website
npm install
```

Copy env and add your Supabase keys:

```bash
cp .env.example .env
# Edit .env: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Runs at **http://localhost:5173**.

## Stack

- **Auth**: Supabase (email/password). Frontend uses `@supabase/supabase-js`; backend verifies Supabase JWTs with PyJWT.
- **Backend**: Flask, CORS, yfinance, pandas, numpy, scikit-learn.
- **Frontend**: React 18, TypeScript, Vite, React Router, Axios, styled-components, Chart.js, react-chartjs-2.

## API (all stock routes require Supabase JWT)

Send the Supabase access token in the header: `Authorization: Bearer <access_token>`.

- `GET /api/stocks/quote/<ticker>` – current price, previous close, market cap, P/E, 1d & 5d change %
- `GET /api/stocks/history/<ticker>?period=1mo` – OHLCV history
- `GET /api/stocks/analysis/<ticker>` – SMA-5, SMA-20, next-day prediction, trend (bullish/bearish/neutral)
- `GET /api/stocks/search?q=query` – ticker/company search

## App routes

- `/login` – sign in with **email** and password (Supabase)
- `/register` – sign up with email, password, and optional username (Supabase)
- `/dashboard` – protected; search ticker, quote cards, 1-month chart
- `/analysis/:ticker` – protected; SMAs, prediction, trend, OHLCV table
- `/` – redirects to `/dashboard` (then `/login` if not authenticated)
- `*` – 404

The Supabase session (and access token) is stored by the Supabase client; the token is also stored in `localStorage` under `token` and sent to the backend. On 401, the app clears storage and redirects to `/login`.
