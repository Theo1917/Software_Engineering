# Sprint 3 Integration Guide: Analytics in Submissions Controller

## Overview
This guide shows how to integrate the Sprint 3 analytics system into the existing submissions controller to automatically update user reputation and metrics when tasks are completed.

---

## Integration Points

### 1. Import Analytics Functions

Add at the top of `server/src/controllers/submissions.controller.js`:

```javascript
import { 
  updateUserAnalytics, 
  updateSkillPerformance, 
  calculateReputation, 
  logSystemActivity 
} from "./analytics.controller.js";
```

---

## 2. Update approveSubmission Function

In the `approveSubmission` function, after task status is updated to COMPLETED:

```javascript
export async function approveSubmission(req, res, next) {
  try {
    const { taskId } = req.params;

    // Verify user is task creator
    const taskResult = await pool.query(
      `SELECT * FROM tasks WHERE id = $1 AND creator_id = $2`,
      [taskId, req.user.id]
    );

    if (taskResult.rowCount === 0) {
      return res.status(403).json({ message: "Only task creator can approve submission" });
    }

    const task = taskResult.rows[0];
    if (task.status !== "UNDER_REVIEW") {
      return res.status(400).json({ message: "Task must be UNDER_REVIEW to approve" });
    }

    // Update task status to COMPLETED
    const result = await pool.query(
      `UPDATE tasks SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [taskId]
    );

    // Update submission status
    await pool.query(
      `UPDATE task_submissions SET status = 'APPROVED' WHERE task_id = $1`,
      [taskId]
    );

    // ==================== NEW CODE START ====================
    // Fetch solver info for analytics update
    const submissionResult = await pool.query(
      `SELECT solver_id FROM task_submissions WHERE task_id = $1`,
      [taskId]
    );
    
    const solverId = submissionResult.rows[0]?.solver_id;

    if (solverId) {
      try {
        // Update analytics for both creator and solver
        await updateUserAnalytics(req.user.id);
        await updateUserAnalytics(solverId);
        
        // Update skill performance for solver
        if (task.tech_stack && task.tech_stack.length > 0) {
          for (const skill of task.tech_stack) {
            await updateSkillPerformance(solverId, skill);
          }
        }
        
        // Recalculate reputation for both users
        await calculateReputation(req.user.id);
        await calculateReputation(solverId);
        
        // Log the activity
        await logSystemActivity(
          req.user.id,
          'TASK_COMPLETED',
          'TASK',
          taskId,
          { solver_id: solverId, creator_id: req.user.id },
          req.ip || 'unknown'
        );
      } catch (analyticsError) {
        // Log error but don't fail the task completion
        console.error('Analytics update error:', analyticsError);
      }
    }
    // ==================== NEW CODE END ====================

    return res.json({ task: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}
```

---

## 3. Integration Flow Diagram

```
User approves submission
    ↓
Task status → COMPLETED
    ↓
Fetch solver ID
    ↓
updateUserAnalytics(creator_id)
    ↓
updateUserAnalytics(solver_id)
    ↓
For each tech skill:
  updateSkillPerformance(solver_id, skill)
    ↓
calculateReputation(creator_id)
    ↓
calculateReputation(solver_id)
    ↓
logSystemActivity('TASK_COMPLETED')
    ↓
Return response
```

---

## 4. What Gets Updated

### When task is COMPLETED:

#### Creator Updates:
- `user_analytics.tasks_created` already counted
- Reputation recalculated

#### Solver Updates:
- `user_analytics.tasks_completed` ← incremented
- `user_analytics.total_earnings` ← updated with task amount
- `user_analytics.completion_rate` ← recalculated
- Reputation ← recalculated with formula
- `skill_performance[skill]` ← updated for each tech stack skill
  - `tasks_completed` ← incremented per skill
  - `total_earnings` ← updated per skill
  - `average_rating` ← recalculated
- `reputation_history` ← new entry logged

---

## 5. Data Flow Example

**Scenario: Task completion when solver has completed 5 previous tasks**

Initial state:
```
tasks_completed: 5
average_rating: 4.2
total_earnings: 5000
reputation: 30
```

After task completion:
```
tasks_completed: 6
average_rating: 4.3 (updated if new rating submitted)
total_earnings: 5500 (+ task reward)
reputation: 32 (recalculated)

reputation_history:
  - old_reputation: 30
  - new_reputation: 32
  - reason: "Task completion bonus"
  - task_id: 123
  - created_at: 2024-01-15 10:30:00
```

---

## 6. Error Handling

The integration includes try-catch to prevent analytics failures from blocking task completion:

```javascript
try {
  // All analytics updates here
  await updateUserAnalytics(solverId);
  await calculateReputation(solverId);
  // ... etc
} catch (analyticsError) {
  // Log the error but don't fail the main request
  console.error('Analytics update error:', analyticsError);
  // Task completion still succeeds
}
```

This ensures:
- ✅ Task always gets marked as COMPLETED
- ✅ Submission always gets marked as APPROVED
- ⚠️ Analytics updates are attempted but non-blocking
- 📝 Errors are logged for monitoring

---

## 7. Testing the Integration

### Test Scenario:

1. Create a user (creator) and assign a task
2. Have another user (solver) submit deliverables
3. Creator approves submission
4. Check database:

```sql
-- Check task status
SELECT id, status FROM tasks WHERE id = 1;
-- Expected: status = 'COMPLETED'

-- Check analytics were updated
SELECT tasks_completed, total_earnings, reputation 
FROM user_analytics 
WHERE user_id = 2; -- solver
-- Expected: tasks_completed incremented, total_earnings updated, reputation changed

-- Check reputation history logged
SELECT * FROM reputation_history 
WHERE user_id = 2 
ORDER BY created_at DESC LIMIT 1;
-- Expected: Entry with task_id and new_reputation

-- Check skill performance updated
SELECT skill, tasks_completed, average_rating 
FROM skill_performance 
WHERE user_id = 2 AND skill = 'React';
-- Expected: tasks_completed incremented
```

---

## 8. Integration Checklist

- [ ] Import analytics functions in submissions.controller.js
- [ ] Add analytics update code to approveSubmission function
- [ ] Test task completion flow
- [ ] Verify user_analytics table is updated
- [ ] Verify reputation_history table is logged
- [ ] Verify skill_performance is updated
- [ ] Check error logs for any failures
- [ ] Test with multiple tasks
- [ ] Verify reputation calculations are correct

---

## 9. Production Deployment

**Before deploying:**

1. Ensure all analytics tables exist in database
2. Ensure is_admin column exists in users table
3. Run database migrations if needed
4. Test with staging environment first
5. Monitor logs for any analytics errors
6. Have rollback plan ready

**After deploying:**

1. Monitor system logs for errors
2. Verify analytics calculations are correct
3. Check reputation scores are reasonable
4. Confirm task completion workflow still works
5. Performance monitor database queries

---

## 10. Future Enhancements

- [ ] Async analytics updates (queue-based)
- [ ] Batch analytics recalculation
- [ ] Analytics caching (TTL: 1 hour)
- [ ] Performance optimizations for large datasets
- [ ] Analytics export functionality
- [ ] Real-time analytics dashboard

---

## Files to Update

1. **server/src/controllers/submissions.controller.js**
   - Add import for analytics functions
   - Update approveSubmission function
   
2. **server/db/schema.sql** (if not already done)
   - Verify all analytics tables exist
   - Check user_analytics has all required columns

---

## Support & Troubleshooting

### Issue: "updateUserAnalytics is not defined"
**Solution:** Make sure import statement is correct:
```javascript
import { updateUserAnalytics, updateSkillPerformance, calculateReputation, logSystemActivity } from "./analytics.controller.js";
```

### Issue: Analytics not updating
**Solution:** Check that:
1. Database tables exist (user_analytics, skill_performance, reputation_history)
2. No SQL errors in logs
3. Task completion endpoint is being called
4. Response returns 200 OK

### Issue: Reputation not calculated correctly
**Solution:** Verify reputation formula in analytics.controller.js and check user_analytics data

---

## Related Files

- `server/src/controllers/analytics.controller.js` - All analytics functions
- `server/src/controllers/submissions.controller.js` - Where to integrate
- `server/db/schema.sql` - Database schema
- `server/src/routes/analytics.routes.js` - API endpoints

