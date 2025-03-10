
# API Documentation

## Authentication

### POST /api/register
Register new user.
```typescript
{
  email: string
  password: string
}
```

### POST /api/login
Authenticate user.
```typescript
{
  email: string
  password: string
}
```

## Supplements

### GET /api/supplements
Get user's supplements.

### POST /api/supplements
Add new supplement.
```typescript
{
  name: string
  dosage: string
  frequency: string
}
```

## Health Stats

## Supplement History

### GET /api/supplement-logs/:date
Get all supplement logs and related data for a specific date.

Response includes:
```typescript
{
  supplements: Array<{
    id: number
    supplementId: number
    name: string
    dosage: string
    frequency: string
    takenAt: string
    notes: string
    effects: object
  }>,
  qualitativeLogs: Array<{
    id: number
    content: string
    type: string
    loggedAt: string
    tags: string[]
    metadata: object
  }>,
  dailySummaries: Array<{
    id: number
    content: string
    summaryType: string
    startDate: string
    endDate: string
    metadata: object
  }>
}
```

The endpoint properly handles UTC day boundaries to ensure consistent results regardless of timezone.


### GET /api/health-stats
Get user's health statistics.

### POST /api/health-stats
Update health statistics.
```typescript
{
  weight?: number
  sleep?: number
  mood?: string
}
```

## Admin Routes

### GET /api/admin/supplements
Get all supplements (admin only).

### POST /api/admin/supplements
Add supplement to database (admin only).
