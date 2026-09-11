# LearnTube

LearnTube turns YouTube videos and playlists into a calmer, more structured way to learn.

You can import a video or playlist, watch it through a focused course player, resume from your last checkpoint, mark lessons complete, and see how your learning time adds up.

## What LearnTube Does

- Sign in with Google or a local email and password.
- Verify email addresses and recover forgotten passwords by email.
- Search YouTube for videos and playlists.
- Import YouTube videos and playlists as personal courses.
- Watch videos through a distraction-free player.
- Save playback checkpoints and watched activity.
- Mark videos complete and move through a course playlist.
- Sync playlists to discover newly added videos.
- View course progress, watch time, activity heatmaps, daily activity, and learning analytics.
- Manage your password and refresh-token-backed sessions.

## How It Fits Together

```text
frontend/  React, TypeScript, Vite, Tailwind CSS
backend/   Express, TypeScript, Drizzle ORM, PostgreSQL
```

The frontend talks to the backend through `/api/v1`. The backend handles authentication, YouTube API access, course storage, progress tracking, and analytics.

## User Journey

1. Visit the landing page at `/`.
2. Create an account or sign in with Google.
3. Add a YouTube URL or search YouTube for a course.
4. Open a course and choose a lesson.
5. Learn in the player while LearnTube records checkpoints and watch activity.
6. Resume later from the dashboard.
7. Review detailed progress on `/analytics` and account information on `/profile`.

## Repository Layout

```text
backend/   API server, database schema, migrations, and services
frontend/  React application and user interface
```

## Run Locally

You need Node.js 18 or newer and PostgreSQL.

### Start the backend

```bash
cd backend
npm install
npm run db:migrate
npm run dev
```

The API runs at `http://localhost:3000` by default.

### Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` by default.

The frontend Vite configuration proxies API requests to the local backend. Set `VITE_API_URL` when the frontend needs to call a deployed API directly.

## Required Services

A working local environment needs:

- PostgreSQL
- Google OAuth credentials
- A YouTube Data API v3 key
- Resend credentials for verification and password-reset email delivery

The backend configuration is documented in [backend/README.md](backend/README.md). Frontend routes and UI details are documented in [frontend/README.md](frontend/README.md).

## Current Product Areas

- **Landing and authentication:** public entry point, login, registration, Google OAuth, email verification, password recovery, and password reset.
- **Dashboard:** resume learning, browse courses, search YouTube, import URLs, filter courses, and remove courses.
- **Course view:** review course progress, browse all videos, mark lessons complete, and sync playlists.
- **Player:** watch a YouTube lesson, resume its checkpoint, save activity, move to the next lesson, and mark playlist items complete.
- **Analytics:** inspect annual activity, click into a day, review daily activity, and compare course progress.
- **Profile:** view account details, basic learning totals, password settings, and logout.

## Building

```bash
cd backend
npm run build

cd ../frontend
npm run build
```

There is currently no root-level package file, so commands are run from the relevant application directory.

## Project Status

LearnTube is an actively evolving application. The core learning loop is implemented, while future work may improve analytics performance by adding a consolidated analytics endpoint instead of loading each course's progress separately.
