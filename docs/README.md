# HiveMind Frontend

> Next.js Social Platform Client Application

## Overview

The hivemind-frontend is a modern, responsive single-page application built with Next.js (App Router). It connects to the HiveMind backend microservices via the API Gateway and provides a full social platform experience including authentication, groups, posts, meetings, notifications, and messaging.

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.3 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4.6 |
| Server State | TanStack React Query | 5.51.1 |
| Client State | Zustand | 4.5.4 |
| HTTP Client | Axios | 1.7.3 |
| Forms | React Hook Form + Zod | 7.52 + 3.23 |
| Animations | Framer Motion | 11.3.8 |
| Icons | Lucide React | 0.414.0 |
| Theming | next-themes | 0.3.0 |
| File Upload | react-dropzone | 14.2.3 |
| Dates | date-fns | 3.6.0 |
| Toasts | react-hot-toast | 2.4.1 |

## Project Structure

```
hivemind-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   ├── (app)/             # Protected pages (feed, groups, etc.)
│   │   ├── layout.tsx         # Root layout
│   │   ├── providers.tsx      # QueryClient, ThemeProvider
│   │   └── globals.css        # Tailwind + custom styles
│   ├── features/              # Feature-specific components
│   │   ├── auth/              # Login form, register form
│   │   ├── chat/              # Chat UI components
│   │   ├── groups/            # Group cards, create modal
│   │   ├── meetings/          # Meeting cards
│   │   ├── notifications/     # Notification items
│   │   ├── posts/             # Post cards, comments, create modal
│   │   └── stories/           # Stories feature
│   ├── components/            # Shared UI components
│   │   ├── ui/               # Design system (Button, Input, Modal, etc.)
│   │   └── layout/           # Sidebar, TopBar, MobileNav
│   ├── hooks/                 # TanStack Query wrappers
│   │   ├── use-auth.ts
│   │   ├── use-user.ts
│   │   ├── use-groups.ts
│   │   ├── use-posts.ts
│   │   ├── use-meetings.ts
│   │   ├── use-notifications.ts
│   │   ├── use-chat.ts
│   │   └── use-stories.ts
│   ├── services/              # Axios service layer
│   │   ├── api-client.ts     # Base Axios instance + interceptors
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── group.service.ts
│   │   ├── post.service.ts
│   │   ├── meeting.service.ts
│   │   ├── notification.service.ts
│   │   └── media.service.ts
│   ├── store/                 # Zustand stores
│   │   ├── auth-store.ts     # Token, user, isAuthenticated
│   │   ├── ui-store.ts       # Modals, sidebar, active group
│   │   ├── chat-store.ts     # Chat state
│   │   ├── friend-store.ts
│   │   ├── group-social-store.ts
│   │   └── story-store.ts
│   ├── types/                 # TypeScript interfaces
│   │   └── index.ts          # All DTOs (auth, user, group, post, etc.)
│   └── utils/                 # Utility functions
│       ├── cn.ts             # Tailwind class merger
│       ├── format.ts         # Date, number formatting
│       └── sanitize.ts       # Input sanitization
├── public/
│   └── manifest.json          # PWA manifest
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

## Routes

### Auth Group `(auth)/`

| Path | Component | Description |
|------|-----------|-------------|
| `/login` | LoginPage | 2-step OTP login (phone → OTP) |
| `/register` | RegisterPage | New user registration |

### App Group `(app)/` — Protected by AuthGuard

| Path | Component | Description |
|------|-----------|-------------|
| `/feed` | FeedPage | Group-tabbed post feed |
| `/groups` | GroupsPage | User's groups list |
| `/groups/[groupId]` | GroupDetailPage | Posts, meetings, members tabs |
| `/meetings` | MeetingsPage | All meetings across groups |
| `/notifications` | NotificationsPage | Notification list + mark-all-read |
| `/profile` | ProfilePage | View/edit profile, followers/following |
| `/chat` | ChatPage | Messaging interface |
| `/settings` | SettingsPage | App settings |
| `/onboarding` | OnboardingPage | Post-registration welcome |

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Pages (Routes)                         │
│  Compose feature components and handle page-level logic  │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│              Feature Components                           │
│  PostCard, CreatePostModal, GroupCard, MeetingCard, etc. │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                Custom Hooks                               │
│  usePosts, useGroups, useMeetings (TanStack Query)      │
│  → cache invalidation, optimistic updates, toast         │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                  Services                                 │
│  Axios wrappers per domain (post.service, group.service) │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                 api-client.ts                             │
│  Base Axios instance, JWT interceptor, 401 auto-logout  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
                  API Gateway (:8080)
```

## State Management

### Server State — TanStack Query

All data from the API is managed via TanStack Query with:
- Typed query keys per domain
- Automatic background refetching
- Cache invalidation on mutations
- Loading/error states handled per-query

### Client State — Zustand

| Store | Purpose | Persistence |
|-------|---------|-------------|
| auth-store | Token, userId, role, isAuthenticated | localStorage |
| ui-store | Modal visibility, sidebar state, active group | — |
| chat-store | Active conversation, messages | — |
| friend-store | Friend requests state | — |
| group-social-store | Group social features | — |
| story-store | Stories state | — |

## Authentication Flow

```
1. User enters phone number → POST /api/v1/auth/sendOtp
2. Backend sends OTP via Twilio SMS
3. User enters OTP → POST /api/v1/auth/signin
4. Backend returns { token, userId, role }
5. Frontend stores token in auth-store (Zustand → localStorage)
6. All subsequent API calls include Authorization: Bearer <token>
7. 401 response → auto-logout → redirect to /login
```

## API Client (api-client.ts)

- Base URL: `NEXT_PUBLIC_API_URL` (default: `http://localhost:8080`)
- Request interceptor: Attaches `Authorization: Bearer <token>` from auth-store
- Response interceptor: On 401, clears auth-store and redirects to `/login`
- Error normalization: Extracts error message from response body

## Design System

### UI Components

| Component | Variants | Description |
|-----------|----------|-------------|
| Button | primary, secondary, ghost, danger, outline + loading | Accessible button |
| Input | default + error state | Form input with label |
| Textarea | default | Multi-line input |
| Avatar | with image / initials fallback + color hash | User avatar |
| Badge | default, success, warning, error, info, purple | Status indicator |
| Modal | animated + keyboard close + overlay click | Dialog |
| Skeleton | text, circular, rectangular, card | Loading placeholders |

### Tailwind Theme

- Brand colors: Purple gradient palette
- Dark mode: Full dark theme via next-themes
- Custom animations: fade-in, slide-up, pulse-soft
- Font: Inter (system font fallback)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| NEXT_PUBLIC_API_URL | http://localhost:8080 | API Gateway URL |

## Running Locally

```bash
cd hivemind-frontend
npm install
npm run dev
```

Open http://localhost:3000

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |

## Features Status

### Implemented
- [x] OTP-based login/registration
- [x] User profile view/edit
- [x] Follow/unfollow
- [x] Group CRUD + join/leave
- [x] Posts with media upload
- [x] Comments and likes
- [x] Meeting scheduling + join/leave
- [x] Notifications with mark-read
- [x] Dark/light theme
- [x] Responsive mobile layout
- [x] File upload with drag-and-drop

### Frontend-Only (Backend Not Yet Implemented)
- [ ] Chat/messaging (frontend components ready)
- [ ] Stories (frontend components ready)
- [ ] Search
- [ ] Friend requests

## Known Issues

1. No token refresh — user must re-login after 24h
2. Optimistic updates not implemented for all mutations
3. No offline support/service worker
4. Image optimization relies on Next.js Image component
