# LearnTube Frontend

The LearnTube frontend is the React application where people discover courses, watch lessons, and understand their learning progress.

It is built with React 18, TypeScript, Vite, Tailwind CSS, React Router, Axios, `react-youtube`, and `react-calendar-heatmap`.

## Start the Frontend

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:5173`.

The Vite development proxy sends `/api` requests to `http://localhost:3000`. To use a different API origin, set:

```env
VITE_API_URL=https://your-api.example.com/api/v1
```

Build and preview the production bundle with:

```bash
npm run build
npm run preview
```

Lint the project with:

```bash
npm run lint
```

## Routes

### Public routes

| Route              | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `/`                | Public LearnTube landing page            |
| `/login`           | Login and registration                   |
| `/auth/callback`   | Google OAuth callback handling           |
| `/verify-email`    | Email verification                       |
| `/forgot-password` | Request a password-reset email           |
| `/reset-password`  | Set a new password from an emailed token |

### Protected routes

| Route                              | Purpose                                                            |
| ---------------------------------- | ------------------------------------------------------------------ |
| `/dashboard`                       | Course library and resume-learning card                            |
| `/analytics`                       | Detailed watch-time, heatmap, daily activity, and course analytics |
| `/profile`                         | Account details and basic learning summary                         |
| `/profile/security`                | Set or change a local password                                     |
| `/course/:id`                      | Course overview, progress, video list, sync, and removal           |
| `/course/:courseId/video/:videoId` | YouTube player and course playlist                                 |

Protected pages are wrapped by `ProtectedLayout`. Users without a verified email see the verification prompt instead of course content.

## Main Features

### Authentication

- Local email/password login and registration
- Google OAuth
- Email verification
- Password recovery and reset
- Password set/change for authenticated users
- Access-token refresh with refresh-token rotation
- Logout with refresh-token revocation

Access and refresh tokens are stored in browser local storage. The Axios client adds the access token to requests and retries an expired authenticated request once after rotating the refresh token.

### Course dashboard

The dashboard can:

- Load the user's courses
- Calculate course progress from existing progress endpoints
- Identify the latest watched course for the resume card
- Search YouTube
- Add a video or playlist by URL
- Filter courses by all, in-progress, or completed
- Remove a course from the user's library

### Course and player flow

The course page shows:

- Course metadata
- Total duration
- Watched progress
- Completed video count
- Video list
- Playlist synchronization
- Mark-complete actions
- Course removal

The player shows the YouTube video and the rest of the playlist. Playback checkpoints, watch activity, and completion state are sent to the backend.

### Analytics and profile

`/analytics` uses the existing activity endpoints to show:

- Total watch time
- Active study days
- Completed videos
- Longest activity streak calculated from heatmap data
- Average course progress
- Annual activity heatmap
- Clickable daily activity details
- Course-by-course performance

`/profile` stays intentionally lighter and focuses on account information, basic totals, password settings, and logout.

## Frontend Structure

```text
src/
├── components/
│   ├── course/       Course video rows
│   ├── dashboard/    Course cards, import, and search modals
│   ├── layout/       Navigation and protected layout
│   ├── player/       YouTube player and activity tracking
│   ├── profile/      Heatmap presentation
│   └── ui/           Shared buttons and loading states
├── context/          Global authentication state
├── hooks/            React hooks such as useAuth
├── lib/              Axios API client
├── pages/            Route-level screens
├── App.tsx           Router configuration
└── index.css         Atelier theme and global styles
```

## Backend Contract Used by the Frontend

The frontend calls the backend under `/api/v1`.

- Authentication: `/auth/login`, `/auth/register`, `/auth/google`, `/auth/me`, `/auth/refresh`, `/auth/logout`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/set-password`, `/auth/change-password`
- Courses: `/courses`, `/courses/search`, `/courses/:id`, `/courses/:id/sync`
- Activity: `/activity/log`, `/activity/progress/:videoId`, `/activity/course-progress/:courseId`, `/activity/heatmap`, `/activity/day-activity`, `/activity/dashboard`

See [backend/README.md](../backend/README.md) for the backend setup and endpoint details.

## Design Direction

The current interface uses the LearnTube Atelier style:

- Dark navy surfaces for long study sessions
- Violet primary accents for navigation and actions
- Rose accents for important actions and destructive states
- Green accents for progress and completion
- Plus Jakarta Sans for headings, Inter for interface text, and JetBrains Mono for timing and metrics
- Responsive layouts for desktop and mobile
