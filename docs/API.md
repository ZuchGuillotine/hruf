
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
