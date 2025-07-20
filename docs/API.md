
# Stack Tracker API Reference

All endpoints are rooted at `/api` unless otherwise noted.  JSON is returned by default unless the _Content-Type_ is otherwise specified.  Dates and timestamps are ISO-8601 strings in UTC.

> **Authentication**  
> • Cookie-based session with Passport (see `GET /api/user`).  
> • Send credentials in the request body for `POST /api/login` and `/api/register`.  
> • Google OAuth uses the `/auth/google` flow (outside of `/api`).

---

## 1.  Authentication & Session

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/register` | Create a local account |
| `POST` | `/api/login` | Log in with email & password |
| `POST` | `/api/logout` | Destroy the current session |
| `GET`  | `/api/user` | Fetch the current session user (requires auth) |
| `GET`  | `/auth/google` | Redirect to Google OAuth (signup param supported) |
| `GET`  | `/auth/google/callback` | OAuth callback |

### Request / Response samples

```http
POST /api/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "hunter2"
}
```

```jsonc
// 200 OK
{
  "message": "Login successful",
  "user": {
    "id": 3,
    "username": "alice",
    "email": "alice@example.com",
    "subscriptionTier": "starter",
    "isAdmin": false
  }
}
```

---

## 2.  Supplements

### 2.1  CRUD
| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/supplements` | List current user's supplements |
| `POST` | `/api/supplements` | Create new supplement *(body → name, dosage, frequency, etc.)* |
| `PUT` | `/api/supplements/:id` | Update supplement fields |
| `DELETE` | `/api/supplements/:id` | Remove supplement |

### 2.2  Analytics & Helpers
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/supplements/streak` | Current consecutive-day streak (14-day window) |
| `GET` | `/api/supplements/count` | Total number of supplement logs |
| `GET` | `/api/supplements/search?q=mag` | Type-ahead search against the reference table |

### 2.3  Daily Logs
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/supplement-logs/:date` | All logs, qualitative notes & summaries for the given `YYYY-MM-DD` |
| `POST` | `/api/supplement-logs` | Upsert array of log objects for **today** |

Log object schema:
```ts
{
  supplementId: number;
  takenAt: string;      // ISO date
  notes?: string;
  effects?: Record<string, any>;
}
```

---

## 3.  Lab Results

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/labs` | List uploaded lab PDFs for the user |
| `POST` | `/api/labs` | Upload a new PDF (`multipart/form-data` field **file**) |
| `DELETE` | `/api/labs/:id` | Delete a lab result and its file |

### 3.1  Chart Data
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/labs/chart-data` | Biomarker history for charts |

Query params:
* `biomarkers` – comma separated names (optional)
* `page` – 1-based page (default 1)
* `pageSize` – max 100 (default 50)

### 3.2  Utilities
| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/api/labs/chart-data/reprocess/:labId` | Re-run biomarker extraction |
| `GET`  | `/api/labs/chart-data/debug` | Admin/debug information |

---

## 4.  Health Stats

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/health-stats` | Fetch health profile for current user |
| `POST` | `/api/health-stats` | Upsert stats (`weight`, `height`, `dateOfBirth`, `averageSleep`, etc.) |

---

## 5.  AI Chat & Query

These endpoints stream Server-Sent Events (SSE) when `Content-Type: text/event-stream` is set in the response.

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/chat` | Authenticated GPT-4o chat with usage tracking |
| `POST` | `/api/query` | Public question-answering with contextual retrieval |
| `GET`  | `/api/query/history` | Last 50 queries (auth only) |
| `POST` | `/api/chat/save` | Persist a conversation snippet |
| `GET`  | `/api/chat/history` | Saved chats for user |

Body shape for chat / query:
```ts
{
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
}
```

---

## 6.  Summaries

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/api/summaries` | List generated summaries |
| `POST` | `/api/summaries/daily` | Generate daily summary for `{ date: 'YYYY-MM-DD' }` |
| `POST` | `/api/summaries/weekly` | Generate weekly summary for `{ startDate, endDate }` |
| `POST` | `/api/summaries/realtime` | On-demand summary of recent activity |

All summary routes require authentication.

---

## 7.  Payments (Stripe)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/stripe/create-checkout-session` | Start a subscription checkout |
| `GET`  | `/api/stripe/checkout-session/:sessionId` | Fetch session status |
| `POST` | `/api/stripe/update-subscription` | Move existing user to subscription from checkout |
| `POST` | `/api/stripe/webhook` | Stripe webhook (server-to-server) |

---

## 8.  Admin

All admin endpoints require both authentication **and** `user.isAdmin = true`.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/admin/users` | List users with analytics |
| `GET` | `/api/admin/users/subscriptions` | All user subscription info |
| `GET` | `/api/admin/users/growth` | Time-series growth metrics |
| `PUT` | `/api/admin/users/:id` | Update user fields |
| `DELETE` | `/api/admin/users/:id` | Delete (non-admin) user |
| … | Other CRUD routes for research docs & supplements (see source) |

---

## 9.  Content

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/blog` | All blog posts (public) |
| `GET` | `/api/blog/:slug` | Single post |
| `GET` | `/api/research` | Research articles (public) |
| `GET` | `/api/research/:slug` | Single research document |

---

## 10.  Utility / Health

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/ping` | Basic liveness check |
| `GET` | `/api/health` | Readiness check (DB, services, etc.) |

---

### Error format
```jsonc
{
  "error": "Human-readable message",
  "details": "Optional details",
  "timestamp": "2025-06-15T12:34:56.789Z"
}
```

---

_Last updated: 2025-06-29_
