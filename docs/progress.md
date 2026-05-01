# HiveMind Frontend — Progress Tracker

**Last updated:** 2026-05-01  
**Status:** Phase 2+ Complete — Production-ready with deployment artifacts

---

## ✅ Completed

### Infrastructure
- [x] Next.js 14 (App Router) + TypeScript project scaffold
- [x] Tailwind CSS design system with brand palette, dark mode
- [x] TanStack Query v5 + Zustand state management
- [x] Axios API client with JWT interceptor + 401 auto-logout
- [x] React Hot Toast notifications
- [x] Framer Motion animations
- [x] next-themes dark/light mode
- [x] React Hook Form + Zod validation throughout
- [x] Standalone output mode for Docker deployment
- [x] Dockerfile (multi-stage: deps → build → production)
- [x] .dockerignore, .env.example

### Types Layer (100%)
- [x] `auth.ts` — SendOtpRequest, SigninRequest, JwtAuthResponse, JwtPayload
- [x] `user.ts` — UserProfileDto, UpdateProfileRequest
- [x] `group.ts` — GroupDto, CreateGroupRequest, GroupMember
- [x] `post.ts` — PostDto, CreatePostRequest, Comment, AddCommentRequest
- [x] `meeting.ts` — MeetingDto, CreateMeetingRequest
- [x] `notification.ts` — NotificationDto, NotificationType
- [x] `media.ts` — MediaFileDto, MediaReferenceType

### Service Layer (100%)
- [x] `api-client.ts` — Axios instance, JWT interceptor, error normalization
- [x] `auth.service.ts` — sendOtp, signin, createUser
- [x] `user.service.ts` — getProfile, updateProfile, follow/unfollow, followers/following
- [x] `group.service.ts` — CRUD, join/leave, members
- [x] `post.service.ts` — createPost, getPostsByGroup, likePost, comments
- [x] `meeting.service.ts` — full CRUD + start/join/leave/end
- [x] `notification.service.ts` — getAll, unread, count, markRead
- [x] `media.service.ts` — upload (multipart), presigned URL, delete

### Hooks Layer (100%)
- [x] `use-auth.ts` — useSendOtp, useSignin, useCreateUser, useLogout
- [x] `use-user.ts` — useProfile, useCurrentUser, useFollowers, useFollowing, useUpdateProfile, useFollowUser
- [x] `use-groups.ts` — useMyGroups, useGroup, useGroupMembers, useCreateGroup, useJoinGroup, useLeaveGroup
- [x] `use-posts.ts` — useGroupPosts, usePost, useComments, useCreatePost, useLikePost, useAddComment
- [x] `use-meetings.ts` — useGroupMeetings, useMeeting, useCreateMeeting, useStartMeeting, useJoinMeeting
- [x] `use-notifications.ts` — useNotifications, useUnreadCount (30s polling + refetchOnWindowFocus), useMarkAsRead, useMarkAllAsRead
- [x] `use-search.ts` — useSearchGroups, useSearchUsers (client-side filtering)
- [x] `use-page-title.ts` — dynamic document title per page
- [x] `use-debounce.ts` — generic debounce hook (used in search)
- [x] `use-online-status.ts` — reactive online/offline detection

### State Management
- [x] `auth-store.ts` — Zustand + localStorage persistence (token, userId, role)
- [x] `ui-store.ts` — Modal state, active group context, sidebar, search dialog

### UI Components (14 components)
- [x] Button (5 variants, loading state)
- [x] Input (label, error, hint)
- [x] Textarea (label, error)
- [x] Avatar (initials fallback, color hash, image)
- [x] Badge (6 variants)
- [x] Modal (animated, keyboard close, scroll lock)
- [x] Skeleton loaders (PostSkeleton, GroupCardSkeleton, ProfileSkeleton, NotificationSkeleton)
- [x] EmptyState (icon/emoji, title, description, CTA)
- [x] MediaImage (loading/error states, src change reset)
- [x] Lightbox (full-screen image viewer with zoom controls + download)
- [x] ConfirmDialog (reusable confirmation for destructive actions)
- [x] Tooltip (hover/focus tooltip with animation)
- [x] LoadingScreen (branded loading indicator)
- [x] ScrollToTop (floating button, appears on scroll)

### Layout
- [x] Desktop sidebar (nav, search ⌘K, settings link, quick actions, theme toggle, user footer)
- [x] Mobile bottom navigation with unread badge + ARIA labels
- [x] Mobile drawer sidebar
- [x] TopBar (mobile header with search button)
- [x] AuthGuard (redirect to /login if unauthenticated, hydration-safe)
- [x] SearchDialog (⌘K, debounced search, groups/people tabs, skeleton loading, keyboard navigation)
- [x] ErrorBoundary (catches React errors, retry button)
- [x] OfflineBanner (detects offline status)
- [x] ScrollToTop (floating button on long pages)

### Features
- [x] **Auth** — OTP login (2-step: phone → OTP), registration form
- [x] **Feed** — Group selector, post feed per group, create post CTA, infinite scroll (batches of 10)
- [x] **Groups** — List, detail page (posts/meetings/members tabs), create modal, join/leave
- [x] **Posts** — PostCard (optimistic like with rollback, comment toggle, share via Web Share API / clipboard, image lightbox), CommentsPanel, CreatePostModal (character counter with circular progress, file size display, max 50MB)
- [x] **Meetings** — MeetingCard (start/join/end), meetings page grouped by group, CreateMeetingModal in group detail
- [x] **Notifications** — List, unread badge (30s polling + window focus refetch), mark as read, mark all as read
- [x] **Profile** — View/edit (name, email, bio), profile picture upload with hover overlay, followers/following stats, follower links
- [x] **Public Profile** — `/profile/[userId]` with follow/unfollow
- [x] **Search** — Global search dialog (⌘K), debounced input, groups and people tabs, skeleton loading
- [x] **Settings** — Theme picker (light/dark/system), account info, sign out
- [x] **Onboarding** — Post-registration welcome screen

### Pages (all with dynamic page titles)
- [x] `/` → redirect to `/feed`
- [x] `/login` — split-panel design
- [x] `/register`
- [x] `/feed` — with infinite scroll
- [x] `/groups`
- [x] `/groups/[groupId]` — with CreateMeetingModal + EmptyState
- [x] `/meetings`
- [x] `/notifications`
- [x] `/profile` — with avatar upload
- [x] `/profile/[userId]` — public profile with follow/unfollow
- [x] `/settings` — theme, account, sign out
- [x] `/onboarding`
- [x] `/not-found` — custom 404 page
- [x] `/error` — global error page

### Accessibility
- [x] ARIA labels on all interactive elements
- [x] `role="article"` on post cards
- [x] `role="tablist"` / `role="tab"` / `aria-selected` on tab interfaces
- [x] `role="tabpanel"` on tab content
- [x] `role="dialog"` / `aria-modal` on search dialog
- [x] `role="navigation"` on mobile nav
- [x] `aria-expanded` on comment toggles
- [x] `aria-pressed` on like buttons
- [x] `aria-current="page"` on active nav items
- [x] `aria-label` on notification badges, media buttons, form inputs
- [x] Keyboard navigation: Escape to close modals/search, ⌘K for search
- [x] `<time>` elements with `dateTime` attribute
- [x] Focus management in modals and search dialog

### SEO & Meta
- [x] Dynamic page titles via `usePageTitle` hook
- [x] Root metadata (title template, description, manifest, icons)
- [x] Viewport configuration (theme-color, width, initial-scale)
- [x] Static metadata on auth pages (login, register)

### CSS Utilities
- [x] `.scrollbar-hide` — hide scrollbar but keep scroll
- [x] `.safe-area-pb` — safe area padding for mobile
- [x] `.focus-ring` — keyboard focus visible ring
- [x] Custom scrollbar styling

### Deployment
- [x] Dockerfile (multi-stage, standalone output)
- [x] .dockerignore
- [x] .env.example
- [x] Helm chart (deployment, service, HPA)

---

## 📋 Remaining (Phase 3 — Nice-to-have)

### Testing
- [ ] Unit tests (Vitest + Testing Library)
- [ ] E2E tests (Playwright)
- [ ] Storybook for UI components

### Features
- [ ] Post detail page (`/posts/[groupId]/[postId]`)
- [ ] Group discovery page (public groups)
- [ ] Meeting room UI (WebRTC — backend doesn't provide signaling)
- [ ] Real-time notifications (WebSocket)
- [ ] Unlike support (backend doesn't have endpoint)
- [ ] Token refresh (backend doesn't have refresh endpoint)
- [ ] Push notifications (service worker)

---

## ⚠️ Known Issues / Technical Debt

1. **Like is one-way** — backend has no unlike endpoint; UI prevents double-like with optimistic state + rollback
2. **No token refresh** — JWT is 24h; no refresh token endpoint exists. User must re-login after expiry.
3. **Group member names** — `GroupMember` only returns `userId`, not name. Profile lookup needed per member.
4. **Meeting room** — backend tracks participants via Redis but no WebRTC signaling. Meeting "join" is metadata only.
5. **No server-side pagination** — all list endpoints return full arrays. Client-side infinite scroll batches results.
6. **Search is client-side** — no backend search endpoint; filters user's groups and followers/following locally.

---

## 🏗️ Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 App Router | SSR for public pages, CSR for app shell, single codebase |
| Styling | Tailwind CSS | Utility-first, consistent design system, no runtime overhead |
| Server state | TanStack Query v5 | Caching, background refetch, optimistic updates |
| Client state | Zustand | Minimal boilerplate, works outside React tree (axios interceptor) |
| Forms | React Hook Form + Zod | Type-safe validation, minimal re-renders |
| Animations | Framer Motion | Production-quality transitions |
| Auth storage | localStorage via Zustand persist | Simple for MVP; upgrade to httpOnly cookies for prod |
| Mobile | Responsive web (PWA) | Phase 1; React Native (Expo) is Phase 2 |
| Deployment | Docker standalone | Minimal image size, no node_modules in production |
