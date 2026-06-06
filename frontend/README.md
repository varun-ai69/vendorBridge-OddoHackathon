# VendorBridge Frontend

Next.js procurement ERP UI for the Oddo Hackathon.

## Docs for agents & developers

| File | Purpose |
|------|---------|
| **[AGENTS.md](./AGENTS.md)** | Full project structure, conventions, and how to add features |
| **[TEST_USERS.md](./TEST_USERS.md)** | Demo login credentials (all roles) |
| **[../api_contract.md](../api_contract.md)** | Backend API specification |

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — demo mode works without backend.

## Structure (summary)

```
src/
├── app/           # Pages (App Router)
├── components/    # UI + layout
├── contexts/      # Auth
├── lib/           # Constants, mocks, formatters
└── utils/api.js   # All API calls
```

See **[AGENTS.md](./AGENTS.md)** for the complete tree and architecture.
