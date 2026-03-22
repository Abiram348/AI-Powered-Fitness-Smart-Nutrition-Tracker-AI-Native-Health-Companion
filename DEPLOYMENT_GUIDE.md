# FitTrack AI Deployment and Store Release Guide

This guide is the exact release runbook for this repository.

## 1. Current App Identity (Already Set)

- iOS bundle ID: `com.fittrack.ai` (`mobile/app.json`)
- Android package: `com.fittrack.ai` (`mobile/app.json`)
- App name: `FitTrack AI`
- Health endpoint: `GET /health` (`backend/server.py`)

## 2. Backend Hosting (Exact Values)

Backend code is in `backend/` and starts with `uvicorn server:app`.

### Option A: Render (Web Service)

Create a new Web Service with these exact values:

- Name: `fittrack-api`
- Environment: `Python 3`
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- Health Check Path: `/health`

Environment variables to add in Render:

- `MONGO_URL` = `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`
- `DB_NAME` = `fittrack_ai`
- `JWT_SECRET` = `<long-random-secret>`
- `GOOGLE_API_KEY` = `<gemini-api-key>`
- `CORS_ORIGINS` = `https://<your-web-domain>,https://www.<your-web-domain>`

### Option B: Railway (Service)

Create a new service from your GitHub repo with these exact values:

- Service Name: `fittrack-api`
- Root Directory: `backend`
- Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

Railway usually auto-installs from `requirements.txt`. If needed, add build command:

- Build Command: `pip install -r requirements.txt`

Environment variables in Railway are the same as Render:

- `MONGO_URL`
- `DB_NAME=fittrack_ai`
- `JWT_SECRET`
- `GOOGLE_API_KEY`
- `CORS_ORIGINS=https://<your-web-domain>,https://www.<your-web-domain>`

After deploy, save your backend URL:

- Render style: `https://fittrack-api.onrender.com`
- Railway style: `https://<service>.up.railway.app`

## 3. Web Frontend Hosting (Exact Values)

Frontend code is in `frontend/` and builds to `frontend/build`.

Use these settings in Vercel/Netlify/Render Static Site:

- Root Directory: `frontend`
- Build Command: `npm ci && npm run build`
- Publish Directory: `build`

Set env variable:

- `REACT_APP_BACKEND_URL=https://<your-backend-domain>`

Example:

- `REACT_APP_BACKEND_URL=https://fittrack-api.onrender.com`

## 4. Mobile Production API Wiring

Mobile reads backend URL from `EXPO_PUBLIC_API_URL`.

Local file:

```bash
cd mobile
cp .env.example .env
```

Set:

```env
EXPO_PUBLIC_API_URL=https://<your-backend-domain>
```

Set same value in EAS environment variables:

```bash
cd mobile
npx eas-cli env:create production --name EXPO_PUBLIC_API_URL --value https://<your-backend-domain> --visibility plaintext --scope project --non-interactive
```

## 5. EAS Build and Submit (Exact Commands)

Use `eas-cli` commands in this environment.

```bash
cd mobile
npx eas-cli login
npx eas-cli whoami
npx eas-cli build --platform android --profile production
npx eas-cli build --platform ios --profile production
```

Before submit, fill placeholders in `mobile/eas.json`:

Note: `expo.extra.eas.projectId` (UUID) is already configured in `mobile/app.json`. The iOS `ascAppId` below is a different value from App Store Connect (numeric app record ID), not this UUID.

- `submit.production.ios.appleId`
- `submit.production.ios.ascAppId`
- `submit.production.ios.appleTeamId`
- `submit.production.android.serviceAccountKeyPath` (path to Play JSON key)

Submit:

```bash
cd mobile
npx eas-cli submit --platform android --profile production
npx eas-cli submit --platform ios --profile production
```

## 6. Store Console Values

### Google Play

- Application ID: `com.fittrack.ai`
- Pricing: `Free`
- Track: `production`

### App Store Connect

- Bundle ID: `com.fittrack.ai`
- Pricing: `Tier 0 (Free)`
- App Record ID (`ascAppId`): value from App Store Connect app page

## 7. Final Pre-Launch QA Checklist

Use this checklist before clicking final submit.

### A. Backend and Web

1. `https://<your-backend-domain>/health` returns `{"status":"ok"...}`.
2. Web app loads and can register/login.
3. Web API calls hit production backend (not localhost).
4. `CORS_ORIGINS` contains exact web domain(s) with `https://` and no spaces.

### B. Mobile Runtime Safety

1. Fresh install opens without crash.
2. Login/logout cycle works.
3. Food image pick and AI analysis complete without app freeze.
4. Water log, workout log, and dashboard stats update correctly.
5. Chat tab loads history and sends/receives messages.
6. App recovers to fallback screen if a render error occurs (ErrorBoundary).
7. Network interruption does not crash app; retry and recover path works.

### C. Store Readiness

1. `mobile/eas.json` submit placeholders are replaced with real values.
2. Android service account JSON is valid and has Play Console permissions.
3. Privacy Policy URL is live and reachable.
4. App icon, screenshots, and descriptions are final.
5. Data safety and privacy questionnaire are completed.

### D. Post-Upload Smoke Test

1. Install internal test builds from Play Internal Testing and TestFlight.
2. Create a new user and run full daily flow:
	food -> water -> workout -> dashboard -> chat.
3. Confirm no blocking crash and no broken API response parsing.

## 8. If Something Breaks in Production

Check these first:

1. `EXPO_PUBLIC_API_URL`
2. `REACT_APP_BACKEND_URL`
3. `CORS_ORIGINS`
4. `mobile/eas.json` submit values
5. Backend logs around `/api/chatbot/message` and `/api/food/analyze`
