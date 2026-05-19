# Sprint 3 API Reference Guide

## Base URL
```
http://localhost:3001/api
```

---

## 📊 Analytics Endpoints

### Get User Analytics

**GET** `/analytics/user/:userId`

Get comprehensive analytics for a user.

**Parameters:**
- `userId` (path) - User ID

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "reputation": 45,
    "email": "john@example.com"
  },
  "analytics": {
    "user_id": 1,
    "tasks_created": 10,
    "tasks_completed": 8,
    "tasks_disputed": 1,
    "proposals_submitted": 5,
    "proposals_accepted": 3,
    "average_rating": 4.5,
    "completion_rate": 80.0,
    "dispute_rate": 10.0,
    "posts_created": 5,
    "comments_contributed": 12,
    "upvotes_received": 25,
    "total_earnings": 5000,
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### Get Skill Performance

**GET** `/analytics/user/:userId/skills`

Get skill-wise performance breakdown.

**Parameters:**
- `userId` (path) - User ID

**Response:**
```json
{
  "skills": [
    {
      "id": 1,
      "user_id": 1,
      "skill": "React",
      "tasks_completed": 5,
      "average_rating": 4.8,
      "total_earnings": 2500,
      "created_at": "2024-01-10T08:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "user_id": 1,
      "skill": "Node.js",
      "tasks_completed": 3,
      "average_rating": 4.2,
      "total_earnings": 1500,
      "created_at": "2024-01-10T08:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Get Reputation History

**GET** `/analytics/user/:userId/reputation-history`

Get audit trail of reputation changes.

**Parameters:**
- `userId` (path) - User ID
- `limit` (query, optional) - Number of records (default: 10)

**Response:**
```json
{
  "history": [
    {
      "id": 1,
      "user_id": 1,
      "task_id": 5,
      "old_reputation": 42,
      "new_reputation": 45,
      "reason": "Task completion bonus",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "user_id": 1,
      "task_id": 4,
      "old_reputation": 40,
      "new_reputation": 42,
      "reason": "Positive review received",
      "created_at": "2024-01-14T15:20:00Z"
    }
  ]
}
```

---

### Recalculate User Reputation

**POST** `/analytics/user/:userId/recalculate-reputation`

Force immediate reputation recalculation.

**Parameters:**
- `userId` (path) - User ID

**Response:**
```json
{
  "message": "Reputation recalculated",
  "old_reputation": 42,
  "new_reputation": 45,
  "change": 3
}
```

---

### Update User Analytics

**POST** `/analytics/user/:userId/update-analytics`

Trigger analytics recalculation.

**Parameters:**
- `userId` (path) - User ID

**Response:**
```json
{
  "message": "Analytics updated",
  "analytics": {
    "tasks_completed": 8,
    "average_rating": 4.5,
    "completion_rate": 80.0,
    "reputation": 45
  }
}
```

---

## 👤 Admin Endpoints

### Get All Users

**GET** `/admin/users`

List all users with moderation status.

**Query Parameters:**
- `limit` (optional, default: 50) - Records per page
- `offset` (optional, default: 0) - Pagination offset

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "reputation": 45,
      "is_admin": false,
      "tasks_completed": 8,
      "average_rating": 4.5,
      "moderation": {
        "status": "ACTIVE",
        "reason": null,
        "suspended_at": null,
        "expires_at": null
      }
    }
  ],
  "total": 50,
  "limit": 50,
  "offset": 0
}
```

---

### Suspend User

**POST** `/admin/users/:userId/suspend`

Suspend user temporarily or permanently.

**Parameters:**
- `userId` (path) - User ID

**Request Body:**
```json
{
  "reason": "Inappropriate behavior",
  "expiresAt": "2024-02-15T00:00:00Z"
}
```

**Response:**
```json
{
  "message": "User suspended",
  "userId": 1,
  "reason": "Inappropriate behavior",
  "expires_at": "2024-02-15T00:00:00Z"
}
```

---

### Unsuspend User

**POST** `/admin/users/:userId/unsuspend`

Restore suspended user.

**Parameters:**
- `userId` (path) - User ID

**Response:**
```json
{
  "message": "User unsuspended",
  "userId": 1,
  "status": "ACTIVE"
}
```

---

### Get Flagged Content

**GET** `/admin/flagged-content`

List reported posts and comments.

**Query Parameters:**
- `status` (optional) - Filter by status: REPORTED, REVIEWED, RESOLVED
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "flags": [
    {
      "id": 1,
      "reported_by": {
        "id": 2,
        "name": "Jane Doe"
      },
      "post": {
        "id": 10,
        "title": "Post Title",
        "content": "Post content..."
      },
      "comment": null,
      "reason": "Inappropriate content",
      "status": "REPORTED",
      "admin_notes": null,
      "reviewed_by": null,
      "created_at": "2024-01-15T10:30:00Z",
      "reviewed_at": null
    }
  ],
  "total": 5
}
```

---

### Delete Post (Admin)

**DELETE** `/admin/posts/:postId`

Delete a post and all associated content.

**Parameters:**
- `postId` (path) - Post ID

**Request Body:**
```json
{
  "reason": "Spam content"
}
```

**Response:**
```json
{
  "message": "Post deleted",
  "postId": 10,
  "reason": "Spam content"
}
```

---

### Delete Comment (Admin)

**DELETE** `/admin/comments/:commentId`

Delete a comment and replies.

**Parameters:**
- `commentId` (path) - Comment ID

**Request Body:**
```json
{
  "reason": "Offensive language"
}
```

**Response:**
```json
{
  "message": "Comment deleted",
  "commentId": 5,
  "reason": "Offensive language"
}
```

---

### Get All Disputes

**GET** `/admin/disputes`

List all disputes for resolution.

**Query Parameters:**
- `status` (optional) - Filter: OPEN, UNDER_REVIEW, RESOLVED, REJECTED
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "disputes": [
    {
      "id": 1,
      "task": {
        "id": 5,
        "title": "Build React App",
        "amount": 500
      },
      "creator": {
        "id": 1,
        "name": "John Doe"
      },
      "solver": {
        "id": 2,
        "name": "Jane Smith"
      },
      "reason": "Work not completed",
      "status": "OPEN",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 3
}
```

---

### Resolve Dispute

**PATCH** `/admin/disputes/:disputeId/resolve`

Resolve a dispute with decision.

**Parameters:**
- `disputeId` (path) - Dispute ID

**Request Body:**
```json
{
  "resolution": "RESOLVED",
  "resolutionNotes": "Task completed satisfactorily, payment released to solver"
}
```

**Valid Resolutions:**
- `RESOLVED` - Approve completion, task moves to COMPLETED
- `REJECTED` - Reject dispute, task reverts to IN_PROGRESS

**Response:**
```json
{
  "message": "Dispute resolved",
  "disputeId": 1,
  "resolution": "RESOLVED",
  "taskStatus": "COMPLETED"
}
```

---

### Get Dashboard Statistics

**GET** `/admin/dashboard/stats`

Get system-wide statistics.

**Response:**
```json
{
  "stats": {
    "total_users": 150,
    "total_tasks": 320,
    "completed_tasks": 280,
    "disputed_tasks": 12,
    "open_disputes": 3,
    "flagged_content": 5,
    "suspended_users": 2,
    "total_posts_comments": 1250
  }
}
```

---

### Get System Logs

**GET** `/admin/system-logs`

View system activity logs.

**Query Parameters:**
- `action` (optional) - Filter by action
- `entityType` (optional) - Filter by entity type
- `userId` (optional) - Filter by user
- `startDate` (optional) - ISO date string
- `endDate` (optional) - ISO date string
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "user": {
        "id": 2,
        "name": "Jane Smith"
      },
      "action": "COMMENT_CREATED",
      "entity_type": "COMMENT",
      "entity_id": 5,
      "details": {
        "post_id": 10,
        "content": "Great work!"
      },
      "ip_address": "192.168.1.1",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1250
}
```

---

### Get Admin Actions Log

**GET** `/admin/admin-actions`

View admin operations audit trail.

**Query Parameters:**
- `adminId` (optional) - Filter by admin
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "actions": [
    {
      "id": 1,
      "admin": {
        "id": 1,
        "name": "Admin User"
      },
      "action": "USER_SUSPENDED",
      "target_user": {
        "id": 5,
        "name": "Bad Actor"
      },
      "target_post_id": null,
      "target_comment_id": null,
      "reason": "Spam posts",
      "details": {
        "suspend_duration": "30 days",
        "expires_at": "2024-02-15"
      },
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 45
}
```

---

## 💬 Comments Endpoints

### Add Comment

**POST** `/comments/posts/:postId/comments`

Create a comment on a post or reply to another comment.

**Parameters:**
- `postId` (path) - Post ID

**Request Body:**
```json
{
  "content": "Great post, thanks for sharing!",
  "parentCommentId": null
}
```

**Response:**
```json
{
  "comment": {
    "id": 5,
    "post_id": 10,
    "author": {
      "id": 2,
      "name": "Jane Smith"
    },
    "content": "Great post, thanks for sharing!",
    "parent_comment_id": null,
    "upvotes": 0,
    "downvotes": 0,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### Get Post Comments

**GET** `/comments/posts/:postId/comments`

Retrieve all comments for a post with optional threading.

**Parameters:**
- `postId` (path) - Post ID

**Query Parameters:**
- `includeReplies` (optional, default: true) - Include nested replies

**Response:**
```json
{
  "comments": [
    {
      "id": 5,
      "post_id": 10,
      "author": {
        "id": 2,
        "name": "Jane Smith"
      },
      "content": "Great post!",
      "parent_comment_id": null,
      "upvotes": 5,
      "downvotes": 0,
      "replies": [
        {
          "id": 6,
          "post_id": 10,
          "author": {
            "id": 3,
            "name": "Bob Johnson"
          },
          "content": "I agree!",
          "parent_comment_id": 5,
          "upvotes": 2,
          "downvotes": 0
        }
      ],
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Vote on Comment

**POST** `/comments/comments/:commentId/vote`

Upvote or downvote a comment.

**Parameters:**
- `commentId` (path) - Comment ID

**Request Body:**
```json
{
  "voteType": "UP"
}
```

**Valid vote types:**
- `"UP"` - Upvote
- `"DOWN"` - Downvote

**Response:**
```json
{
  "message": "Vote recorded",
  "commentId": 5,
  "voteType": "UP",
  "userVote": "UP"
}
```

---

### Delete Comment

**DELETE** `/comments/comments/:commentId`

Delete a comment (author or admin only).

**Parameters:**
- `commentId` (path) - Comment ID

**Response:**
```json
{
  "message": "Comment deleted",
  "commentId": 5
}
```

---

### Get Comment Vote Summary

**GET** `/comments/comments/:commentId/votes`

Get vote counts for a comment.

**Parameters:**
- `commentId` (path) - Comment ID

**Response:**
```json
{
  "upvotes": 5,
  "downvotes": 1
}
```

---

### Get User Comment History

**GET** `/comments/users/:userId/comment-history`

Get all comments by a user.

**Parameters:**
- `userId` (path) - User ID

**Query Parameters:**
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "comments": [
    {
      "id": 5,
      "post": {
        "id": 10,
        "title": "Getting Started with React"
      },
      "content": "Great post!",
      "upvotes": 5,
      "downvotes": 0,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 15
}
```

---

## 🔐 Authentication

All endpoints (except GET endpoints for comments) require authentication via JWT token in header:

```
Authorization: Bearer <token>
```

Admin endpoints additionally require `is_admin = true` in user record.

---

## 📋 Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error",
  "error": "Error details (development only)"
}
```

---

## 📊 Reputation Formula

The reputation score is calculated using a weighted formula:

```
Reputation = 10 
           + (tasks_completed × 2)
           + (average_rating × 5)
           - (disputed_tasks × 5)
           + (posts_created × 0.5)
           + (comments_contributed × 0.2)

Final Score: 1-100 (capped at boundaries)
```

---

## 🧪 Example Usage

### Get User Profile with Analytics

```bash
curl -X GET http://localhost:3001/api/analytics/user/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Suspend a User

```bash
curl -X POST http://localhost:3001/api/admin/users/5/suspend \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Violated community guidelines",
    "expiresAt": "2024-02-15T00:00:00Z"
  }'
```

### Add Comment with Threading

```bash
curl -X POST http://localhost:3001/api/comments/posts/10/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a great point!",
    "parentCommentId": 5
  }'
```

### Upvote a Comment

```bash
curl -X POST http://localhost:3001/api/comments/comments/5/vote \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "voteType": "UP"
  }'
```

---

## ✨ Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## 🔄 Rate Limiting

No rate limiting is currently implemented, but recommended for production:
- 100 requests per minute for regular users
- 1000 requests per minute for admin endpoints

---

## 📞 Support

For API issues or questions:
1. Check error messages in response
2. Review this documentation
3. Check system logs at `/api/admin/system-logs`
4. Contact development team

