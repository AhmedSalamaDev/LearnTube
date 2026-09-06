# LearnTube Backend

A YouTube-based learning platform backend that tracks video watch progress, generates activity heatmaps, and provides comprehensive learning analytics.

## 🚀 Features

- **Google OAuth Authentication** - Secure login with Google accounts
- **YouTube Integration** - Add videos and playlists from YouTube
- **Progress Tracking** - Resume videos from where you left off
- **Activity Logging** - Track watch time in 15-second intervals
- **Analytics Dashboard** - View learning statistics and heatmaps
- **Multi-user Support** - Multiple users can track the same courses independently

## 🛠️ Tech Stack

- **Framework:** Express.js with TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Passport.js (Google OAuth 2.0) + JWT
- **APIs:** YouTube Data API v3
- **Session Management:** express-session

## 📋 Prerequisites

- Node.js (v18+)
- PostgreSQL database
- Google Cloud Console project with OAuth credentials
- YouTube Data API key

## ⚙️ Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/learntube
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
YOUTUBE_API_KEY=your_youtube_api_key
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret_key
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

4. **Run database migrations**

```bash
npm run db:migrate
```

5. **Start the development server**

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete endpoint documentation and frontend integration guide.

### Quick Overview

- **Auth:** `/auth/google`, `/auth/me`
- **Courses:** `/courses` (CRUD operations)
- **Activity:** `/activity/log`, `/activity/progress/:videoId`
- **Analytics:** `/activity/dashboard`, `/activity/heatmap`

## 🗄️ Database Schema

7-table architecture optimized for fast reads:

- `users` - User accounts
- `courses` - Course metadata
- `videos` - Video metadata
- `progress` - Per-video resume positions
- `user_activity` - Raw activity log
- `daily_activity` - Aggregated daily stats
- `course_progress` - Aggregated course stats

## 🔧 Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run db:generate  # Generate new migration
npm run db:migrate   # Apply migrations to database
npm run db:studio    # Open Drizzle Studio (database GUI)
```

## 📝 Environment Variables

| Variable               | Description                          | Required |
| ---------------------- | ------------------------------------ | -------- |
| `DATABASE_URL`         | PostgreSQL connection string         | ✅       |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID               | ✅       |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret           | ✅       |
| `GOOGLE_CALLBACK_URL`  | OAuth callback URL                   | ✅       |
| `YOUTUBE_API_KEY`      | YouTube Data API key                 | ✅       |
| `JWT_SECRET`           | Secret for signing JWT tokens        | ✅       |
| `SESSION_SECRET`       | Secret for session encryption        | ✅       |
| `FRONTEND_URL`         | Frontend application URL             | ✅       |
| `NODE_ENV`             | Environment (development/production) | ❌       |

## 🔐 Getting API Keys

### Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`

### YouTube API Key

1. In the same Google Cloud project
2. Enable "YouTube Data API v3"
3. Create API key under "Credentials"

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

ISC
