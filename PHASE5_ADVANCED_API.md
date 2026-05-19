# Advanced Features API Documentation

## Overview
This document describes all advanced endpoints added in Phase 5 of the platform enhancement, including ML-driven recommendations, trending algorithms, comment reactions, and search capabilities.

## 1. Task Advanced Endpoints

### GET /api/tasks-advanced/recommendations/smart
**Purpose:** Get ML-powered task recommendations personalized to the user.

**Authentication:** Required (JWT)

**Query Parameters:**
- `limit` (optional): Number of recommendations to return (default: 10)

**Response:**
```json
{
  "tasks": [
    {
      "id": 123,
      "title": "Build React Dashboard",
      "skill_match_score": 100,
      "complexity_match_score": 50,
      "budget_alignment_score": 15,
      "popularity_score": 12,
      "urgency_score": 10,
      "success_rate_score": 8,
      "recency_score": 5,
      "team_context_score": 25,
      ...
    }
  ]
}
```

**Scoring Algorithm:**
- Skill Match (0-100): Number of matching skills × 20
- Complexity Match (0-50): User reputation alignment with task difficulty
- Budget Alignment (0-15): Task budget proximity to user's average
- Popularity (0-15): Views / 100 (capped)
- Urgency (0-10): Deadline < 3 days
- Success Rate (0-10): Historical success rate × 10
- Recency (0-10): Updated < 1 day
- Team Context (0-25): Boost for user's teams

**Total Max Score:** 300

---

### GET /api/tasks-advanced/trending
**Purpose:** Get trending tasks based on multi-dimensional scoring.

**Query Parameters:**
- `limit` (optional): Number to return (default: 15)

**Response:**
```json
{
  "tasks": [
    {
      "id": 456,
      "title": "AI Model Training",
      "trend_status": "HOT",
      "trend_score": 156.2,
      "proposal_count": 8,
      "avg_bid": 5000,
      "save_count": 24,
      ...
    }
  ]
}
```

**Trend Calculation:**
- Views contribution: 30%
- Proposal count contribution: 30%
- Success rate contribution: 20%
- Recency bonus: 20%

**Trend Status Values:**
- `HOT`: Views > 100 AND created < 7 days
- `COMPETITIVE`: Proposal count > 5
- `NEW`: Created < 1 day
- `ACTIVE`: Default

---

### PATCH /api/tasks-advanced/bulk/status
**Purpose:** Bulk update status of multiple tasks.

**Authentication:** Required

**Request Body:**
```json
{
  "taskIds": [123, 456, 789],
  "status": "COMPLETED"
}
```

**Response:**
```json
{
  "updated": [
    { "id": 123, "status": "COMPLETED", "updated_at": "2024-01-15T10:30:00Z" },
    ...
  ]
}
```

---

### POST /api/tasks-advanced/{taskId}/auto-assign
**Purpose:** Auto-assign the top proposal to a task.

**Authentication:** Required (task creator only)

**Response:**
```json
{
  "assigned": {
    "id": 789,
    "solver_id": 42,
    "reputation": 850
  }
}
```

**Selection Logic:** Orders proposals by solver reputation DESC, then bid amount ASC

---

### GET /api/tasks-advanced/{taskId}/metrics
**Purpose:** Get comprehensive task performance metrics.

**Response:**
```json
{
  "metrics": {
    "id": 123,
    "title": "Build API",
    "total_proposals": 5,
    "pending_proposals": 2,
    "accepted_proposals": 1,
    "avg_bid_amount": 4500,
    "min_bid_amount": 3000,
    "max_bid_amount": 6000,
    "saves": 12,
    "days_remaining": 5,
    "visibility_level": "HIGH",
    "complexity_score": 7.2,
    "success_rate": 0.92
  }
}
```

---

### POST /api/tasks-advanced/{taskId}/view
**Purpose:** Track task view for popularity metrics.

**Response:**
```json
{ "success": true }
```

---

### GET /api/tasks-advanced/team/{teamId}/insights
**Purpose:** Get workspace-level task analytics.

**Authentication:** Required

**Response:**
```json
{
  "insights": {
    "total_tasks": 42,
    "open_tasks": 15,
    "in_progress_tasks": 8,
    "completed_tasks": 19,
    "avg_budget": 4200,
    "total_budget": 176400,
    "avg_complexity": 6.8,
    "team_success_rate": 0.88,
    "total_proposals": 156
  }
}
```

---

## 2. Comment Advanced Endpoints

### PUT /api/comments-advanced/comments/{commentId}/edit
**Purpose:** Edit a comment with rich formatting.

**Authentication:** Required (comment author only)

**Request Body:**
```json
{
  "content": "Updated comment text",
  "contentHtml": "<p>Updated comment text</p>"
}
```

**Response:**
```json
{
  "comment": {
    "id": 999,
    "content": "Updated comment text",
    "is_edited": true,
    "edited_at": "2024-01-15T11:00:00Z"
  }
}
```

---

### POST /api/comments-advanced/comments/{commentId}/reactions
**Purpose:** Add emoji reaction to comment.

**Authentication:** Required

**Request Body:**
```json
{
  "reactionType": "👍"
}
```

**Supported Reactions:**
- 👍 (thumbs up)
- 🎉 (celebration)
- ❤️ (heart)
- 😂 (laugh)
- 🔥 (fire)
- 💯 (100)

**Response:**
```json
{
  "reaction": {
    "comment_id": 999,
    "user_id": 42,
    "reaction_type": "👍"
  }
}
```

---

### DELETE /api/comments-advanced/comments/{commentId}/reactions/{reactionType}
**Purpose:** Remove reaction from comment.

**Authentication:** Required (reaction creator only)

**Response:** 204 No Content

---

### GET /api/comments-advanced/comments/{commentId}/reactions
**Purpose:** Get all reactions on a comment.

**Response:**
```json
{
  "reactions": [
    {
      "reaction_type": "👍",
      "count": 3,
      "user_ids": [10, 20, 30]
    },
    {
      "reaction_type": "❤️",
      "count": 1,
      "user_ids": [40]
    }
  ]
}
```

---

### GET /api/comments-advanced/comments/{commentId}/history
**Purpose:** Get edit history of a comment.

**Response:**
```json
{
  "history": [
    {
      "previous_content": "Original text",
      "edited_by_id": 42,
      "editor_name": "John Doe",
      "edited_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### GET /api/comments-advanced/posts/{postId}/comments/enriched
**Purpose:** Get enriched comments with reactions and metadata.

**Query Parameters:**
- `includeReplies` (optional): Include nested replies (default: true)

**Response:**
```json
{
  "comments": [
    {
      "id": 999,
      "content": "Great discussion",
      "author_name": "Jane Smith",
      "reactions": [
        { "reaction_type": "👍", "count": 5 }
      ],
      "edit_count": 1,
      "reply_count": 3,
      "mentions": [12, 45],
      "mentioned_users": [
        { "id": 12, "name": "User1" }
      ]
    }
  ]
}
```

---

## 3. Search Endpoints

### GET /api/search
**Purpose:** Global multi-modal search across all content.

**Query Parameters:**
- `q` (required): Search query
- `types` (optional): Comma-separated types (tasks,posts,people) - default: all
- `difficulty` (optional): Task difficulty filter
- `minBudget` (optional): Minimum budget
- `maxBudget` (optional): Maximum budget
- `skills` (optional): Comma-separated skill list
- `status` (optional): Task status filter
- `limit` (optional): Results per type (default: 20, max: 100)

**Response:**
```json
{
  "tasks": [...],
  "posts": [...],
  "people": [...],
  "total": 45
}
```

**Relevance Scoring:**
- Title match: 100 points
- Description match: 50 points
- Skills/Tags match: 30 points

---

### GET /api/search/facets
**Purpose:** Get aggregated search facets for filtering.

**Query Parameters:**
- `q` (optional): Search query for contextual facets

**Response:**
```json
{
  "difficulties": [
    { "difficulty": "BEGINNER", "count": 12 },
    { "difficulty": "INTERMEDIATE", "count": 8 }
  ],
  "budgetRanges": [
    { "range": "< 5K", "count": 15 },
    { "range": "5K - 10K", "count": 10 }
  ],
  "skills": [
    { "skill": "React", "count": 22 },
    { "skill": "Node.js", "count": 18 }
  ],
  "categories": [...],
  "statuses": [...],
  "teams": [...]
}
```

---

### GET /api/search/suggestions
**Purpose:** Get search suggestions as user types.

**Query Parameters:**
- `q` (required): Partial query
- `limit` (optional): Suggestions to return (default: 10)

**Response:**
```json
{
  "suggestions": [
    {
      "suggestion": "React Component Development",
      "type": "task",
      "frequency": 12
    },
    {
      "suggestion": "React",
      "type": "skill",
      "frequency": 45
    }
  ]
}
```

---

### POST /api/search/saved
**Purpose:** Save a search for quick access.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "React Jobs",
  "query": "react",
  "filters": {
    "difficulty": "INTERMEDIATE",
    "minBudget": 3000
  }
}
```

**Response:**
```json
{
  "saved": {
    "id": 1,
    "user_id": 42,
    "name": "React Jobs",
    "query": "react",
    "filters": {...},
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### GET /api/search/saved
**Purpose:** Retrieve user's saved searches.

**Authentication:** Required

**Response:**
```json
{
  "searches": [
    {
      "id": 1,
      "name": "React Jobs",
      "query": "react",
      "filters": {...},
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### DELETE /api/search/saved/{searchId}
**Purpose:** Delete a saved search.

**Authentication:** Required

**Response:** 204 No Content

---

## 4. Team Analytics Endpoints

### GET /api/teams/{teamId}/analytics
**Purpose:** Get comprehensive team analytics and metrics.

**Authentication:** Required

**Response:**
```json
{
  "analytics": {
    "historical_metrics": [
      {
        "year": 2024,
        "week_of_year": 3,
        "tasks_created": 8,
        "tasks_completed": 5,
        "efficiency_score": 82,
        "members_active": 12,
        "total_earnings": 24000
      }
    ],
    "current_week": {
      "tasks_created": 3,
      "tasks_completed": 2,
      "efficiency_score": 75,
      "members_active": 8
    }
  },
  "teamStats": {
    "total_tasks": 42,
    "open_tasks": 8,
    "in_progress_tasks": 5,
    "completed_tasks": 29,
    "avg_budget": 4200,
    "avg_complexity": 6.8,
    "team_success_rate": 0.88,
    "total_proposals": 156,
    "efficiency_score": 78
  }
}
```

---

## Rate Limiting

All endpoints follow these rate limits:
- Authenticated users: 100 requests per minute
- Unauthenticated: 30 requests per minute

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 204: No Content
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

---

## Performance Notes

### Caching Strategy
- Trending tasks: Cached for 1 hour
- Facets: Cached for 30 minutes
- User recommendations: Generated on-demand (5s avg)

### Database Indexes
All endpoints use optimized indexes on:
- `tasks.difficulty`, `tasks.budget`, `tasks.views`
- `users.reputation`, `users.skills`
- `comments.comment_id`, `comments.user_id`
- `posts.tags`, `posts.category`
- `team_members.team_id`, `team_members.role`

---

## Examples

### Example 1: Get Personalized Recommendations
```bash
GET /api/tasks-advanced/recommendations/smart?limit=5
Authorization: Bearer {JWT_TOKEN}
```

### Example 2: Search with Filters
```bash
GET /api/search?q=react&types=tasks,posts&difficulty=INTERMEDIATE&minBudget=3000&maxBudget=10000
```

### Example 3: Add Comment Reaction
```bash
POST /api/comments-advanced/comments/999/reactions
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "reactionType": "🔥"
}
```

### Example 4: Get Team Analytics
```bash
GET /api/teams/5/analytics
Authorization: Bearer {JWT_TOKEN}
```

---

**Last Updated:** 2024-01-15
**API Version:** 2.0
**Status:** Production
