# API Documentation

This document describes the Edge Functions available in Querino.

## Base URL

All edge functions are available at:
```
https://<project-id>.supabase.co/functions/v1/<function-name>
```

## Authentication

Most endpoints require a valid Supabase JWT token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### POST `/prompt-wizard`

Generate a prompt from a brief description using AI.

**Request Body:**
```json
{
  "goal": "string - Brief description of what the prompt should do"
}
```

**Response:**
```json
{
  "prompt": "string - Generated prompt text",
  "title": "string - Suggested title",
  "description": "string - Suggested description",
  "category": "string - Suggested category",
  "tags": ["string"] 
}
```

---

### POST `/refine-prompt`

Improve an existing prompt with AI assistance.

**Request Body:**
```json
{
  "content": "string - Original prompt content",
  "feedback": "string - Optional feedback for refinement direction"
}
```

**Response:**
```json
{
  "refined": "string - Improved prompt text",
  "changes": ["string"] 
}
```

---

### POST `/suggest-metadata`

Generate metadata suggestions for a prompt.

**Request Body:**
```json
{
  "content": "string - Prompt content"
}
```

**Response:**
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "tags": ["string"]
}
```

---

### POST `/suggest-skill-metadata`

Generate metadata suggestions for a skill.

**Request Body:**
```json
{
  "content": "string - Skill content"
}
```

**Response:**
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "tags": ["string"]
}
```

---

### POST `/suggest-workflow-metadata`

Generate metadata suggestions for a workflow.

**Request Body:**
```json
{
  "content": "string - Workflow content"
}
```

**Response:**
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "tags": ["string"]
}
```

---

### POST `/github-sync`

Sync prompts, skills, and workflows to a GitHub repository.

**Request Body:**
```json
{
  "teamId": "uuid - Optional, for team sync"
}
```

**Response:**
```json
{
  "success": true,
  "message": "string - Success message",
  "stats": {
    "prompts": 10,
    "skills": 5,
    "workflows": 3
  }
}
```

**Notes:**
- Requires GitHub token stored in `user_credentials` table
- For personal sync: uses user's GitHub settings from `profiles`
- For team sync: uses team's GitHub settings from `teams`

---

### POST `/create-checkout`

Create a Stripe checkout session for subscription.

**Request Body:**
```json
{
  "priceId": "string - Stripe price ID"
}
```

**Response:**
```json
{
  "url": "string - Stripe checkout URL"
}
```

---

### POST `/customer-portal`

Get Stripe customer portal URL for subscription management.

**Response:**
```json
{
  "url": "string - Stripe portal URL"
}
```

---

### POST `/check-subscription`

Check user's current subscription status.

**Response:**
```json
{
  "subscribed": true,
  "planType": "premium",
  "planSource": "stripe"
}
```

---

### POST `/ensure-token-allowance`

Ensure user has an active AI token allowance period.

**Response:**
```json
{
  "success": true,
  "period": {
    "id": "uuid",
    "tokens_granted": 100000,
    "tokens_used": 5000,
    "period_start": "2024-01-01T00:00:00Z",
    "period_end": "2024-02-01T00:00:00Z"
  }
}
```

---

### DELETE `/delete-my-account`

Delete the authenticated user's account and all associated data.

**Response:**
```json
{
  "success": true
}
```

---

### POST `/delete-user` (Admin only)

Delete a user account (admin function).

**Request Body:**
```json
{
  "userId": "uuid - User ID to delete"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "error": "string - Error message"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limits

AI-powered endpoints (`prompt-wizard`, `refine-prompt`, `suggest-*`) consume AI credits from the user's allowance. Check `/ensure-token-allowance` to verify available credits.
