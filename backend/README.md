# LearnTube Backend

The LearnTube backend is an Express and TypeScript API backed by PostgreSQL. It is responsible for authentication, YouTube integration, course storage, progress tracking, activity logging, and analytics.

## Technology

- Express 5
- TypeScript
- PostgreSQL
- Drizzle ORM
- Passport Google OAuth 2.0
- JWT access tokens
- Rotating opaque refresh tokens
- YouTube Data API v3
- Resend email delivery

## Setup

### Requirements

- Node.js 18 or newer
- PostgreSQL
- Google OAuth credentials
- YouTube Data API v3 key
- Resend API key for verification and password-reset emails

### Install and configure

```bash
npm install
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/learntube
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
YOUTUBE_API_KEY=your_youtube_api_key
ACCESS_JWT_SECRET=your_access_token_secret
SESSION_SECRET=your_session_secret
FRONTEND_URL=http://localhost:5173
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=onboarding@resend.dev
NODE_ENV=development
PORT=3000
```

`JWT_SECRET` is accepted as a backward-compatible fallback for `ACCESS_JWT_SECRET`.

Apply the Drizzle migrations and start the server:

```bash
npm run db:migrate
npm run dev
```

The API listens on `http://localhost:3000` by default.

## Scripts

```bash
npm run dev          # Start with tsx watch mode
npm run build        # Compile TypeScript
npm run start        # Start the API
npm run db:generate  # Generate a Drizzle migration
npm run db:migrate   # Apply database changes
npm run db:studio    # Open Drizzle Studio
npm test             # Placeholder; automated tests are not configured yet
```

## API Base Path

All application routes are mounted under:

```text
/api/v1
```

Authenticated requests use:

```http
Authorization: Bearer <access-token>
```

Course and activity routes also require the user's email to be verified.

## Route Overview

### Authentication

| Method | Route                       | What it does                                          |
| ------ | --------------------------- | ----------------------------------------------------- |
| `GET`  | `/auth/google`              | Starts Google OAuth                                   |
| `GET`  | `/auth/google/callback`     | Completes Google OAuth and redirects to the frontend  |
| `GET`  | `/auth/failure`             | Returns the OAuth failure response                    |
| `POST` | `/auth/register`            | Creates a local account and sends verification email  |
| `POST` | `/auth/login`               | Issues access and refresh tokens                      |
| `POST` | `/auth/refresh`             | Rotates a refresh token and issues a new access token |
| `POST` | `/auth/logout`              | Revokes the supplied refresh token                    |
| `GET`  | `/auth/me`                  | Returns the authenticated user                        |
| `POST` | `/auth/verify-email`        | Verifies an email token                               |
| `POST` | `/auth/resend-verification` | Sends a new verification email                        |
| `POST` | `/auth/forgot-password`     | Emails a password-reset link                          |
| `POST` | `/auth/reset-password`      | Resets a password using a reset token                 |
| `POST` | `/auth/set-password`        | Sets a password for an account without one            |
| `POST` | `/auth/change-password`     | Changes an existing local password                    |

Password reset tokens are stored hashed and are valid for 15 minutes. Verification tokens are valid for 24 hours. Access tokens last 15 minutes and refresh tokens last 30 days.

### Courses

| Method   | Route                   | What it does                                     |
| -------- | ----------------------- | ------------------------------------------------ |
| `GET`    | `/courses/search?q=...` | Searches YouTube videos and playlists            |
| `POST`   | `/courses`              | Imports a YouTube video or playlist for the user |
| `GET`    | `/courses`              | Lists the user's courses                         |
| `GET`    | `/courses/:id`          | Returns a course and its ordered videos          |
| `DELETE` | `/courses/:id`          | Removes the user's course enrollment             |
| `POST`   | `/courses/:id/sync`     | Updates playlist metadata and adds new videos    |

Deleting a course removes the user's link to it. It does not delete the shared course or its videos.

### Activity and progress

| Method  | Route                                    | What it does                             |
| ------- | ---------------------------------------- | ---------------------------------------- |
| `POST`  | `/activity/log`                          | Records a watched-time activity chunk    |
| `PATCH` | `/activity/progress/:videoId`            | Saves a checkpoint and completion state  |
| `GET`   | `/activity/progress/:videoId`            | Returns one video's progress             |
| `GET`   | `/activity/course-progress/:courseId`    | Returns course totals and video progress |
| `GET`   | `/activity/day-activity?date=YYYY-MM-DD` | Returns activity details for a day       |
| `GET`   | `/activity/heatmap?year=YYYY`            | Returns daily totals for a year          |
| `GET`   | `/activity/dashboard`                    | Returns overall learning totals          |

The frontend currently composes detailed analytics from these existing endpoints. In particular, it loads the user's courses and then requests progress for each course. A future consolidated analytics endpoint can reduce that number of requests.

## Data Model

The database separates shared course content from each user's learning state:

- `users` - Local and Google account information
- `courses` - Shared course metadata
- `videos` - Videos belonging to courses
- `user_courses` - Which users have added which courses
- `progress` - Per-user, per-video checkpoints and completion
- `user_activity` - Raw watched-time events
- `daily_activity` - Aggregated daily watch totals
- `course_progress` - Aggregated course watch time and completed-video counts
- Refresh-token tables - Rotating token records and token families

## Google OAuth

Configure the Google OAuth callback URL as:

```text
http://localhost:3000/api/v1/auth/google/callback
```

The backend redirects successful authentication to:

```text
http://localhost:5173/auth/callback
```

The frontend stores the returned access and refresh tokens and uses `/auth/me` to load the user.

## Email Delivery

The backend sends:

- Email verification messages after registration
- Password-reset messages after a recovery request

Set `RESEND_API_KEY`, `FROM_EMAIL`, and `FRONTEND_URL` before testing these flows. In development, a missing or invalid email configuration will prevent real delivery.

## Security Notes

- Access JWTs are checked for signature, expiry, and access-token type.
- Refresh tokens are stored hashed and rotated after use.
- Reuse of a rotated refresh token revokes its token family.
- Login attempts are tracked and accounts are temporarily locked after repeated failures.
- Registration, login, refresh, and password-recovery routes are rate-limited.
- Course and activity routes require a verified email.

## Current Testing Status

The backend has a TypeScript build command but no automated test suite yet:

```bash
npm run build
```

Use the frontend application with a configured database and API keys to verify full OAuth, email, YouTube, progress, and analytics flows end to end.
