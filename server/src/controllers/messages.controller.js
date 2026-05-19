import { pool } from "../config/db.js";

export async function sendMessage(req, res, next) {
  try {
    const { taskId } = req.params;
    const { content, fileUrl, parentMessageId = null } = req.body;

    if (!content && !fileUrl) {
      return res.status(400).json({ message: "Message content or file is required" });
    }

    // Verify user is part of this task chat
    const taskResult = await pool.query(
      `SELECT * FROM tasks WHERE id = $1 AND (creator_id = $2 OR assigned_solver_id = $2)`,
      [taskId, req.user.id]
    );

    if (taskResult.rowCount === 0) {
      return res.status(403).json({ message: "Not authorized to message this task" });
    }

    if (parentMessageId) {
      const parentResult = await pool.query(
        `SELECT id FROM messages WHERE id = $1 AND task_id = $2`,
        [parentMessageId, taskId]
      );

      if (parentResult.rowCount === 0) {
        return res.status(404).json({ message: "Parent message not found" });
      }
    }

    const result = await pool.query(
      `INSERT INTO messages (task_id, sender_id, parent_message_id, content, file_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, task_id, sender_id, content, file_url, created_at`,
      [taskId, req.user.id, parentMessageId, content || null, fileUrl || null]
    );

    return res.status(201).json({ message: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function getMessages(req, res, next) {
  try {
    const { taskId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verify user is part of this task chat
    const taskResult = await pool.query(
      `SELECT * FROM tasks WHERE id = $1 AND (creator_id = $2 OR assigned_solver_id = $2)`,
      [taskId, req.user.id]
    );

    if (taskResult.rowCount === 0) {
      return res.status(403).json({ message: "Not authorized to view this task chat" });
    }

    const result = await pool.query(
      `SELECT m.*, u.name AS sender_name,
              COALESCE((SELECT COUNT(*) FROM message_reads mr WHERE mr.message_id = m.id), 0) AS read_count,
              CASE WHEN EXISTS (
                SELECT 1 FROM message_reads mr WHERE mr.message_id = m.id AND mr.user_id = $4
              ) THEN true ELSE false END AS is_read_by_me
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.task_id = $1
       ORDER BY m.created_at ASC
       LIMIT $2 OFFSET $3`,
      [taskId, Number(limit), Number(offset), req.user.id]
    );

    const byId = new Map();
    const roots = [];

    for (const row of result.rows) {
      byId.set(row.id, { ...row, replies: [] });
    }

    for (const row of result.rows) {
      const current = byId.get(row.id);
      if (row.parent_message_id && byId.has(row.parent_message_id)) {
        byId.get(row.parent_message_id).replies.push(current);
      } else {
        roots.push(current);
      }
    }

    const messages = roots;

    return res.json({ messages });
  } catch (error) {
    return next(error);
  }
}

export async function markMessageRead(req, res, next) {
  try {
    const { messageId } = req.params;

    const messageResult = await pool.query(
      `SELECT m.id, m.task_id, t.creator_id, t.assigned_solver_id
       FROM messages m
       JOIN tasks t ON t.id = m.task_id
       WHERE m.id = $1`,
      [messageId]
    );

    if (messageResult.rowCount === 0) {
      return res.status(404).json({ message: "Message not found" });
    }

    const message = messageResult.rows[0];
    if (message.creator_id !== req.user.id && message.assigned_solver_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await pool.query(
      `INSERT INTO message_reads (message_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (message_id, user_id) DO NOTHING`,
      [messageId, req.user.id]
    );

    return res.json({ message: "Marked as read" });
  } catch (error) {
    return next(error);
  }
}

export async function deleteMessage(req, res, next) {
  try {
    const { messageId } = req.params;

    const messageResult = await pool.query(
      `SELECT * FROM messages WHERE id = $1`,
      [messageId]
    );

    if (messageResult.rowCount === 0) {
      return res.status(404).json({ message: "Message not found" });
    }

    const message = messageResult.rows[0];
    if (message.sender_id !== req.user.id) {
      return res.status(403).json({ message: "Only sender can delete message" });
    }

    await pool.query(`DELETE FROM messages WHERE id = $1`, [messageId]);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
