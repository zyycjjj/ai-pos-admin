# AI-POS Admin

Desktop web admin shell for AI-POS Owner and Manager workflows.

## Start

```bash
pnpm install
pnpm dev
```

Default URL:

```text
http://localhost:5173
```

## Environment

Create `.env.local` when a custom backend is needed:

```env
VITE_API_BASE_URL=http://127.0.0.1:4100/api
```

## Demo Accounts

```text
owner@aipos.test / password123
manager@aipos.test / password123
cashier@aipos.test / password123
```

Only OWNER and MANAGER can enter Admin.

## Routes

- `/login`
- `/dashboard`
- `/staff`
- `/products`
- `/campaigns`
- `/ai-center`

## Current Scope

- Login and persisted session.
- Dashboard metrics.
- Staff list/create/role/disable.
- Product list.
- Campaign draft list.
- AI draft list.

Product editing, campaign launch, and AI generation inside Admin are reserved for later tasks.
