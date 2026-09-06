# LearnTube Frontend

A React + TypeScript frontend for tracking your learning progress from YouTube videos.

## ✅ Completed Milestones

### Milestone 0: Project Setup & Backend Proxy ✅

- ✅ Vite + React + TypeScript setup
- ✅ Tailwind CSS configuration
- ✅ Axios API client with `/api` proxy to backend
- ✅ Basic UI components (Button, Spinner)
- ✅ Project structure created

**Key Files:**

- `vite.config.ts` - Configured proxy to forward `/api` → `http://localhost:3000`
- `src/lib/api.ts` - Axios client with `withCredentials: true` for auth cookies
- `tailwind.config.js` - Tailwind configuration

### Milestone 1: Authentication & Protected Routing ✅

- ✅ AuthContext for global auth state
- ✅ useAuth hook for easy access to auth
- ✅ ProtectedLayout wrapper with auth checks
- ✅ LoginPage with Google OAuth
- ✅ Navbar with user info and logout
- ✅ React Router setup with protected routes

**Key Files:**

- `src/context/AuthContext.tsx` - Manages user state, checks `/auth/me`
- `src/hooks/useAuth.ts` - Hook to access AuthContext
- `src/components/layout/ProtectedLayout.tsx` - Protects routes, shows spinner while loading
- `src/components/layout/Navbar.tsx` - Navigation with Dashboard/Profile links
- `src/pages/LoginPage.tsx` - Google login button
- `src/App.tsx` - Router configuration

**Routes:**

- `/login` - Public login page
- `/` - Dashboard (protected)
- `/profile` - Profile with heatmap (protected)
- `/course/:id` - Course videos list (protected)
- `/player/:videoId` - Video player (protected)

## 🚀 Running the App

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The app will run on `http://localhost:5173`

### Backend Requirements

Your backend must be running on `http://localhost:3000` with these endpoints:

- `GET /auth/google` - Initiates Google OAuth
- `GET /auth/me` - Returns current user
- `POST /auth/logout` - Logs out user

## 📁 Project Structure

```
src/
├── components/
│   ├── dashboard/        # Dashboard-specific components
│   ├── layout/
│   │   ├── Navbar.tsx           ✅ Complete
│   │   └── ProtectedLayout.tsx  ✅ Complete
│   ├── player/           # Video player components
│   ├── profile/          # Profile page components
│   └── ui/
│       ├── Button.tsx            ✅ Complete
│       └── Spinner.tsx           ✅ Complete
├── context/
│   └── AuthContext.tsx           ✅ Complete
├── hooks/
│   └── useAuth.ts                ✅ Complete
├── lib/
│   └── api.ts                    ✅ Complete
├── pages/
│   ├── DashboardPage.tsx         ✅ Basic structure
│   ├── ProfilePage.tsx           ✅ Basic structure
│   ├── CoursePage.tsx            ✅ Basic structure
│   ├── PlayerPage.tsx            ✅ Basic structure
│   └── LoginPage.tsx             ✅ Complete
├── App.tsx                       ✅ Complete
├── main.tsx                      ✅ Complete
└── index.css                     ✅ Complete
```

## 🧪 Testing Milestone 1

### Test Authentication Flow:

1. Start the backend server on port 3000
2. Start frontend: `npm run dev`
3. Navigate to `http://localhost:5173`
4. You should be redirected to `/login`
5. Click "Continue with Google"
6. After Google auth, you should land on Dashboard
7. Check React DevTools - AuthContext should show your user info
8. Test navigation between Dashboard and Profile
9. Click Logout - should return to login page

## 🎯 Next Steps: Milestone 2

### What's Next:

- [ ] Implement DashboardPage with course list
- [ ] Create CourseCard component
- [ ] Add "Add Course" modal
- [ ] Implement ProfilePage with activity heatmap
- [ ] Create Heatmap component
- [ ] Fetch and display course progress data

### API Endpoints Needed:

- `GET /courses` - List all user's courses
- `POST /courses` - Create course from YouTube URL
- `GET /activity/heatmap?year=2025` - Get heatmap data

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router v6** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **react-youtube** - YouTube player (for Milestone 4)
- **react-calendar-heatmap** - Activity heatmap (for Milestone 2)

## 📝 Notes

### Authentication

- Uses cookies for auth (not localStorage tokens)
- Backend redirects to `http://localhost:5173/auth/callback?token=<JWT>` after Google OAuth
- AuthContext automatically checks `/auth/me` on mount
- All API calls include `withCredentials: true` to send cookies

### Proxy Configuration

All `/api/*` requests are proxied to `http://localhost:3000`
Example: `api.get('/courses')` → `http://localhost:3000/courses`

### Error Handling

- 401 responses automatically redirect to `/login`
- Loading states handled by Spinner component
- Protected routes show Spinner while checking auth

## 🔧 Environment Variables

Currently using hardcoded URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

TODO: Move to environment variables in production.

## 📦 Ready to Commit

Once you verify everything works:

```bash
git add .
git commit -m "feat: complete Milestone 0 & 1 - project setup and authentication"
```

---

**Status:** ✅ Milestones 0 & 1 Complete  
**Next:** Milestone 2 - Dashboard & Profile Pages  
**Last Updated:** October 29, 2025
