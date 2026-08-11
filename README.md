# HiveMind Frontend

> A modern social platform built with Next.js 15, React 19, and Tailwind CSS.

## Features

- **Feed** — Group-based posts with media, likes, comments
- **Groups** — Create, join, manage communities (public/private)
- **Live Rooms** — Real-time meeting rooms with camera, mic, reactions, and chat
- **Stories** — Group-based ephemeral content (24h expiry)
- **Messaging** — Real-time group and private chat (server-backed via Redis polling)
- **Notifications** — Push-style notifications for group activity
- **Search** — Discover public groups and users
- **Profile** — Avatar, cover photo, bio, privacy controls
- **Auth** — OTP-based login (passwordless via Vonage Verify)
- **Dark Mode** — Full dark theme with system detection

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 15 | App Router, SSR, API rewrites |
| React 19 | UI components |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| Framer Motion | Animations |
| TanStack Query | Server state, caching, polling |
| Zustand | Client state (auth, chat, groups) |
| Zod | Form validation |
| React Hook Form | Form management |

## Architecture

```
Browser → Next.js (port 3000)
              ↓ rewrites /api/v1/*
         API Gateway (port 8080, internal)
              ↓ JWT validation + routing
         Microservices (auth, user, group, post, meeting, etc.)
```

- **No CORS issues** — All API calls go through same-origin Next.js rewrites
- **No WebSocket** — Real-time chat uses HTTP polling (5s interval)
- **No third-party auth** — Custom OTP via Vonage Verify API

## Local Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

Environment variables:
```env
NEXT_PUBLIC_API_URL=         # Empty = relative (uses rewrites)
API_GATEWAY_INTERNAL_URL=http://localhost:8080
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/         # Login, Register pages
│   ├── (app)/          # Main app (feed, groups, chat, meetings, profile, settings)
│   └── api/config/     # Runtime config endpoint
├── components/
│   ├── layout/         # Sidebar, TopBar, MobileNav
│   ├── ui/             # Button, Input, Avatar, Modal, Badge, etc.
│   └── ...
├── features/
│   ├── auth/           # LoginForm, RegisterForm
│   ├── posts/          # PostCard, CreatePostModal, CommentsPanel
│   ├── groups/         # GroupCard, CreateGroupModal
│   ├── meetings/       # MeetingCard, CreateMeetingModal, MeetingRoom
│   ├── chat/           # ConversationItem, MessageBubble
│   ├── stories/        # StoriesBar, StoryViewer, CreateStoryModal
│   └── notifications/  # NotificationItem
├── hooks/              # Custom React hooks (use-auth, use-posts, use-chat, etc.)
├── services/           # API clients (auth, user, group, post, meeting, chat, media)
├── store/              # Zustand stores (auth, chat, group-context, stories, friends)
├── types/              # TypeScript interfaces
├── utils/              # Helpers (cn, format, sanitize)
└── providers/          # Context providers
```

## Key Design Decisions

1. **Server-side API proxy** — Next.js rewrites `/api/v1/*` to the API gateway internally. No CORS, no exposed backend URLs.

2. **OTP stored in Redis** — Vonage Verify request IDs stored in Redis (not in-memory) so auth works across pod restarts and multiple replicas.

3. **Chat via REST polling** — Messages stored in Redis (24h TTL), frontend polls every 5 seconds. Works through any proxy without WebSocket upgrade.

4. **Group-based architecture** — Everything is group-centric: posts, stories, meetings, feed. Users select an active group context.

5. **No passwords** — Passwordless auth via phone number OTP. JWT tokens with 24h expiry, auto-logout on expiry.

## Security

- Content-Security-Policy header
- HSTS with preload
- X-Frame-Options: DENY
- Permissions-Policy (camera/mic for meetings only)
- XSS protection via input sanitization
- JWT token expiry detection with auto-logout
- Non-root Docker container

## Docker

```bash
docker build -t hivemind-frontend .
docker run -p 3000:3000 -e API_GATEWAY_INTERNAL_URL=http://gateway:8080 hivemind-frontend
```

Multi-stage build: deps → build → standalone (minimal production image).

## CI/CD

On push to `main`:
1. TypeScript type check
2. ESLint (non-blocking)
3. Next.js build
4. Docker build & push
5. Trivy vulnerability scan
