# HiveMind Frontend — Architecture

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.5 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4 |
| Server State | TanStack Query | 5.x |
| Client State | Zustand | 4.x |
| Forms | React Hook Form + Zod | 7.x / 3.x |
| HTTP | Axios | 1.7 |
| Animations | Framer Motion | 11.x |
| Theme | next-themes | 0.3 |

---

## Project Structure

```
hivemind-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Public routes (no auth required)
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (app)/              # Protected routes (AuthGuard)
│   │   │   ├── layout.tsx      # App shell: sidebar + modals
│   │   │   ├── feed/
│   │   │   ├── groups/
│   │   │   │   └── [groupId]/
│   │   │   ├── meetings/
│   │   │   ├── notifications/
│   │   │   ├── profile/
│   │   │   └── onboarding/
│   │   ├── layout.tsx          # Root layout: fonts, providers
│   │   ├── page.tsx            # Root redirect → /feed
│   │   └── globals.css
│   │
│   ├── components/             # Reusable UI primitives
│   │   ├── ui/                 # Design system atoms
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── modal.tsx
│   │   │   └── skeleton.tsx
│   │   ├── layout/             # App shell components
│   │   │   ├── sidebar.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── top-bar.tsx
│   │   ├── auth-guard.tsx      # Route protection
│   │   └── providers.tsx       # QueryClient, ThemeProvider, Toaster
│   │
│   ├── features/               # Feature-based modules
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   └── register-form.tsx
│   │   ├── posts/
│   │   │   ├── post-card.tsx
│   │   │   ├── create-post-modal.tsx
│   │   │   └── comments-panel.tsx
│   │   ├── groups/
│   │   │   ├── group-card.tsx
│   │   │   └── create-group-modal.tsx
│   │   ├── meetings/
│   │   │   └── meeting-card.tsx
│   │   └── notifications/
│   │       └── notification-item.tsx
│   │
│   ├── services/               # API layer (Axios wrappers)
│   │   ├── api-client.ts       # Axios instance + interceptors
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── group.service.ts
│   │   ├── post.service.ts
│   │   ├── meeting.service.ts
│   │   ├── notification.service.ts
│   │   └── media.service.ts
│   │
│   ├── hooks/                  # TanStack Query hooks
│   │   ├── use-auth.ts
│   │   ├── use-user.ts
│   │   ├── use-groups.ts
│   │   ├── use-posts.ts
│   │   ├── use-meetings.ts
│   │   └── use-notifications.ts
│   │
│   ├── store/                  # Zustand stores
│   │   ├── auth-store.ts       # JWT, userId, role (persisted)
│   │   └── ui-store.ts         # Modals, active group, sidebar
│   │
│   ├── types/                  # TypeScript DTOs (from backend)
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── group.ts
│   │   ├── post.ts
│   │   ├── meeting.ts
│   │   ├── notification.ts
│   │   ├── media.ts
│   │   └── index.ts
│   │
│   └── utils/
│       ├── cn.ts               # Tailwind class merger
│       └── format.ts           # Date, number formatters
│
├── docs/
│   ├── progress.md
│   └── architecture.md
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Data Flow

```
User Action
    │
    ▼
Feature Component (e.g. PostCard)
    │  calls hook
    ▼
TanStack Query Hook (e.g. useLikePost)
    │  calls service
    ▼
Service Layer (e.g. postService.likePost)
    │  uses axios instance
    ▼
api-client.ts (Axios)
    │  attaches Bearer token from Zustand auth-store
    │  handles 401 → logout
    ▼
API Gateway (:8080)
    │  validates JWT
    │  injects X-User-Id, X-User-Role headers
    ▼
Microservice (e.g. post-service :8084)
    │
    ▼
Response → TanStack Query cache → React re-render
```

---

## State Management

### Server State (TanStack Query)
All API data lives in TanStack Query's cache. Each resource has a typed query key factory:

```ts
postKeys.byGroup(groupId)   // ["posts", "group", groupId]
postKeys.comments(postId)   // ["posts", postId, "comments"]
groupKeys.mine()            // ["groups", "mine"]
notifKeys.count()           // ["notifications", "count"]
```

Cache invalidation is explicit — mutations invalidate related queries on success.

### Client State (Zustand)
Two stores:

**auth-store** (persisted to localStorage):
- `token` — JWT Bearer token
- `userId` — UUID string
- `role` — USER | ADMIN | SUPER_ADMIN
- `isAuthenticated` — boolean

**ui-store** (ephemeral):
- `activeGroupId` — which group context is active for post creation
- `isCreatePostOpen` / `isCreateGroupOpen` — modal visibility
- `isSidebarOpen` — mobile drawer

---

## Authentication Flow

```
1. User enters phone number
   → POST /api/v1/auth/sendOtp
   → Backend sends SMS via Twilio

2. User enters 6-digit OTP
   → POST /api/v1/auth/signin
   → Backend returns { token, userId, role }

3. Frontend stores in Zustand (persisted to localStorage)

4. Every subsequent request:
   → Axios interceptor reads token from Zustand
   → Adds Authorization: Bearer <token>

5. API Gateway validates JWT
   → Injects X-User-Id, X-User-Role headers
   → Downstream services read these headers

6. On 401 response:
   → Axios interceptor calls logout()
   → Redirects to /login
```

---

## Route Groups

| Group | Path | Auth |
|---|---|---|
| `(auth)` | /login, /register | Public |
| `(app)` | /feed, /groups/*, /meetings, /notifications, /profile, /onboarding | Protected (AuthGuard) |

---

## Design System

### Colors
- **Brand**: Purple gradient (`brand-500` = `#c044f0`)
- **Surface**: White / `#0f0f13` (dark)
- **Text**: Gray scale

### Typography
- Font: Inter (Google Fonts)
- Scale: 10px–24px via Tailwind

### Component Variants
- **Button**: primary, secondary, ghost, danger, outline × sm/md/lg/icon
- **Badge**: default, brand, success, warning, danger, active
- **Avatar**: xs/sm/md/lg/xl with initials fallback + color hash

### Animations
- Page transitions: `fade-in`, `slide-up`
- Card hover: `y: -2` spring
- Modal: scale + fade spring
- Sidebar drawer: x slide spring
