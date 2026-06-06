# VendorBridge Frontend — Agent Guide

> **Read this first** before editing the frontend. This doc explains structure, conventions, and where to make changes.

## Product

**VendorBridge** is a procurement ERP UI (RFQ → Quotation → Approval → PO → Invoice).  
Built with **Next.js 16 App Router**, **React 19**, **Tailwind CSS v4**, **Framer Motion**.

- **API contract (backend):** `../api_contract.md`
- **Demo credentials:** `TEST_USERS.md`
- **Backend base URL:** `http://localhost:5000/api/v1`

---

## Quick Start

```bash
cd frontend
cp .env.example .env.local   # MOCK_API=true by default
npm install
npm run dev                    # http://localhost:3000
```

| Env var | Default | Purpose |
|---------|---------|---------|
| `NEXT_PUBLIC_MOCK_API` | `true` | `true` = local mock data, no backend needed |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api/v1` | Real API when mock is `false` |

---

## Directory Structure

```
frontend/
├── public/                          # Static assets
├── src/
│   ├── app/                         # Next.js App Router (pages + layouts)
│   │   ├── layout.js                # Root layout → Providers, fonts, globals.css
│   │   ├── page.js                  # "/" → redirects to /dashboard or /login
│   │   ├── globals.css              # Design tokens, glass utilities, theme vars
│   │   │
│   │   ├── (auth)/                  # Public auth routes (no sidebar)
│   │   │   ├── layout.js            # Split hero + form layout
│   │   │   ├── login/page.js        # Role-based login + demo credentials
│   │   │   ├── register/
│   │   │   │   ├── page.js          # Suspense wrapper
│   │   │   │   └── RegisterForm.js  # Role-based registration forms
│   │   │   └── forgot-password/page.js
│   │   │
│   │   └── (dashboard)/             # Authenticated app (sidebar + header)
│   │       ├── layout.js            # Wraps DashboardShell
│   │       ├── dashboard/page.js    # Role-specific analytics dashboard
│   │       ├── users/page.js        # Admin only
│   │       ├── vendors/page.js      # Admin + Procurement
│   │       ├── rfq/
│   │       │   ├── page.js          # RFQ list
│   │       │   ├── create/page.js   # Procurement only
│   │       │   └── [id]/
│   │       │       ├── page.js      # RFQ detail
│   │       │       └── compare/page.js  # Quotation comparison
│   │       ├── approvals/page.js    # Manager approves/rejects
│   │       ├── po/page.js
│   │       ├── invoices/page.js
│   │       ├── reports/page.js
│   │       ├── activity-logs/page.js
│   │       ├── notifications/page.js
│   │       ├── settings/page.js
│   │       ├── profile/page.js      # Vendor only
│   │       ├── vendor-rfqs/         # Vendor portal
│   │       ├── vendor-quotations/
│   │       ├── vendor-po/
│   │       └── vendor-invoices/
│   │
│   ├── components/
│   │   ├── providers/Providers.js   # ThemeProvider + AuthProvider + CursorGlow
│   │   ├── layout/
│   │   │   ├── DashboardShell.js    # Auth guard, sidebar, main area
│   │   │   ├── Sidebar.js           # Role-based nav from NAV_ITEMS
│   │   │   └── Header.js            # Theme toggle, notifications, Demo badge
│   │   ├── dashboard/
│   │   │   └── DashboardCharts.js   # Recharts (Spend, Category, Approval)
│   │   └── ui/                      # Design system primitives
│   │       ├── Button.js            # Framer Motion + variants
│   │       ├── Input.js
│   │       ├── Card.js / StatCard
│   │       ├── Badge.js
│   │       ├── Modal.js
│   │       ├── DataTable.js         # Table + loading + empty state
│   │       ├── EmptyState.js
│   │       ├── PageTransition.js
│   │       ├── LoadingSpinner.js
│   │       ├── RoleSelector.js      # 4-role picker (login/register)
│   │       ├── NavIcon.js           # Sidebar icon map
│   │       ├── Logo.js
│   │       └── CursorGlow.js
│   │
│   ├── contexts/
│   │   └── AuthContext.js           # login, logout, clearSession, user state
│   │
│   ├── lib/
│   │   ├── constants.js             # ROLES, NAV_ITEMS, status enums
│   │   ├── format.js                # formatCurrency, formatDate, etc.
│   │   ├── testUsers.js             # Demo login credentials (all roles)
│   │   ├── mockStore.js             # In-memory demo data + sessionStorage
│   │   └── mockApi.js               # Mock handlers for every API route
│   │
│   └── utils/
│       └── api.js                   # ★ SINGLE API ENTRY POINT — all HTTP calls
│
├── .env.example
├── .env.local                       # gitignored; MOCK_API=true
├── next.config.mjs
├── jsconfig.json                    # "@/*" → "./src/*"
├── TEST_USERS.md
└── AGENTS.md                        # ← this file
```

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  page.js    │────▶│  utils/api.js    │────▶│  Backend :5000  │
│  (feature)  │     │  (all endpoints) │     │  (when mock off)│
└─────────────┘     └────────┬─────────┘     └─────────────────┘
                             │ MOCK_API=true
                             ▼
                    ┌─────────────────┐
                    │  lib/mockApi.js │
                    │  lib/mockStore  │
                    └─────────────────┘
```

### Auth flow

1. `AuthContext` hydrates from `localStorage` (`vb_token`, `vb_user`)
2. Login calls `api.login()` → stores JWT + user
3. `DashboardShell` redirects unauthenticated users to `/login`
4. Login page validates selected **role** matches returned `user.role`
5. Sidebar nav comes from `NAV_ITEMS[user.role]` in `constants.js`

### Route groups

| Group | Path prefix | Layout | Auth |
|-------|-------------|--------|------|
| `(auth)` | `/login`, `/register`, `/forgot-password` | Marketing split | Public |
| `(dashboard)` | everything else listed above | Sidebar + Header | Required |

Route groups `(auth)` and `(dashboard)` **do not appear in the URL**.

---

## User Roles

| Role key | Label | Key routes |
|----------|-------|------------|
| `admin` | Administrator | `/users`, `/vendors`, `/activity-logs`, full access |
| `procurement_officer` | Procurement Officer | `/rfq/create`, `/rfq/*/compare`, `/po` |
| `manager` | Manager | `/approvals` (approve/reject) |
| `vendor` | Vendor | `/vendor-rfqs`, `/vendor-quotations`, `/profile` |

**Demo logins:** see `src/lib/testUsers.js` — password `Test@123` for all.

---

## API Layer Rules

**Always** add new backend calls in `src/utils/api.js`:

```js
// Example — mirror api_contract.md paths
export const myEndpoint = (id) => api.get(`/my-resource/${id}`);
```

**Never** call `fetch()` directly from pages/components.

If adding a mock for demo mode, also add a handler in `src/lib/mockApi.js` and optional seed data in `src/lib/mockStore.js`.

### Token storage keys

| Key | Purpose |
|-----|---------|
| `vb_token` | JWT access token |
| `vb_refresh_token` | Refresh token |
| `vb_user` | Cached user object |
| `vb_mock_store` | sessionStorage mock DB (demo mode) |

---

## UI Conventions

### Client components

- All interactive pages use `"use client"` at top
- Wrap `useSearchParams()` pages in `<Suspense>` (see `login/page.js`, `register/page.js`)

### Styling

- **Tailwind v4** via `@import "tailwindcss"` in `globals.css`
- CSS variables: `--background`, `--accent`, `--glass-bg`, etc.
- Utility classes: `.glass`, `.glass-card`, `.depth-hover`, `.page-gradient`
- Icons: **Ionicons only** via `react-icons/io5`
- Dark mode: `next-themes` with `attribute="class"`

### Page template

```jsx
"use client";
import PageTransition from "@/components/ui/PageTransition";
import { someApi } from "@/utils/api";

export default function MyPage() {
  // useEffect → load data via api.js
  return (
    <PageTransition>
      <h1 className="text-2xl font-bold">Title</h1>
      {/* content */}
    </PageTransition>
  );
}
```

### Role guards

Redirect unauthorized roles at top of `useEffect`:

```js
if (user?.role !== "admin") { router.replace("/dashboard"); return; }
```

---

## Adding a New Feature (Checklist)

1. **Route** — create `src/app/(dashboard)/my-feature/page.js`
2. **API** — add functions to `src/utils/api.js` (match `api_contract.md`)
3. **Mock** — add handler in `src/lib/mockApi.js` + data in `mockStore.js`
4. **Nav** — add item to `NAV_ITEMS` in `constants.js` for relevant roles
5. **Icons** — register in `NavIcon.js` if new sidebar icon
6. **UI** — reuse `DataTable`, `Card`, `Modal`, `Button`, `Input`

---

## Key Files — Do Not Duplicate

| Concern | Single source of truth |
|---------|------------------------|
| API calls | `src/utils/api.js` |
| Role definitions | `src/lib/constants.js` |
| Sidebar navigation | `NAV_ITEMS` in `constants.js` |
| Demo users | `src/lib/testUsers.js` |
| Auth state | `src/contexts/AuthContext.js` |
| App shell | `src/components/layout/DashboardShell.js` |

---

## Mock vs Real API

```js
// src/lib/mockApi.js
export const IS_MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_API !== "false";
```

- **Mock ON (default):** All mutations work in-memory; approvals, vendor status, etc. persist per browser session
- **Mock OFF:** Requires running backend at `NEXT_PUBLIC_API_URL`

Switch: set `NEXT_PUBLIC_MOCK_API=false` in `.env.local` and restart dev server.

---

## Build & Lint

```bash
npm run dev      # development
npm run build    # production build (must pass before PR)
npm run lint     # eslint
```

Path alias: `@/components/...` → `src/components/...`

---

## Common Pitfalls

1. **Don't mix icon libraries** — use `react-icons/io5` only
2. **Don't skip mock handlers** — pages break in demo mode without them
3. **Don't hardcode API URL** — use `api.js`
4. **`useSearchParams` needs Suspense** — or build fails
5. **Vendor routes** use `/vendor-*` prefix, not `/rfq` (different API endpoints)
6. **Role login mismatch** — login clears session if selected role ≠ account role

---

## Related Docs

- `../api_contract.md` — full backend API spec
- `TEST_USERS.md` — demo account table
- `../README.md` — monorepo overview
