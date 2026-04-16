import { pool } from "../config/db.js";

export async function listPosts(req, res, next) {
  try {
    const { category } = req.query;

    const params = [];
    let whereClause = "";

    if (category) {
      params.push(category);
      whereClause = `WHERE p.category = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT p.*, u.name AS author_name,
              COALESCE(SUM(CASE WHEN v.vote_type = 'UP' THEN 1 WHEN v.vote_type = 'DOWN' THEN -1 ELSE 0 END), 0) AS score
       FROM posts p
       JOIN users u ON u.id = p.author_id
       LEFT JOIN post_votes v ON v.post_id = p.id
       ${whereClause}
       GROUP BY p.id, u.name
       ORDER BY p.created_at DESC`,
      params
    );

    return res.json({ posts: result.rows });
  } catch (error) {
    return next(error);
  }
}

export async function trendingPosts(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name AS author_name,
              COALESCE(SUM(CASE WHEN v.vote_type = 'UP' THEN 1 WHEN v.vote_type = 'DOWN' THEN -1 ELSE 0 END), 0) AS score,
              COUNT(c.id) AS comment_count
       FROM posts p
       JOIN users u ON u.id = p.author_id
       LEFT JOIN post_votes v ON v.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       GROUP BY p.id, u.name
       ORDER BY score DESC, comment_count DESC, p.created_at DESC
       LIMIT 8`
    );

    return res.json({ posts: result.rows });
  } catch (error) {
    return next(error);
  }
}

export async function createPost(req, res, next) {
  try {
    const { title, content, category, tags = [] } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ message: "Title, content and category are required" });
    }

    const result = await pool.query(
      `INSERT INTO posts (author_id, title, content, category, tags)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, title, content, category, tags]
    );

    return res.status(201).json({ post: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function getPost(req, res, next) {
  try {
    const { id } = req.params;

    const postResult = await pool.query(
      `SELECT p.*, u.name AS author_name,
              COALESCE(SUM(CASE WHEN v.vote_type = 'UP' THEN 1 WHEN v.vote_type = 'DOWN' THEN -1 ELSE 0 END), 0) AS score
       FROM posts p
       JOIN users u ON u.id = p.author_id
       LEFT JOIN post_votes v ON v.post_id = p.id
       WHERE p.id = $1
       GROUP BY p.id, u.name`,
      [id]
    );

    if (postResult.rowCount === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    const commentsResult = await pool.query(
      `SELECT c.*, u.name AS author_name
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    return res.json({ post: postResult.rows[0], comments: commentsResult.rows });
  } catch (error) {
    return next(error);
  }
}

export async function addComment(req, res, next) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const postExists = await pool.query("SELECT id FROM posts WHERE id = $1", [id]);
    if (postExists.rowCount === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    const result = await pool.query(
      `INSERT INTO comments (post_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, req.user.id, content]
    );

    return res.status(201).json({ comment: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function votePost(req, res, next) {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!["UP", "DOWN"].includes((type || "").toUpperCase())) {
      return res.status(400).json({ message: "Vote type must be UP or DOWN" });
    }

    const postExists = await pool.query("SELECT id FROM posts WHERE id = $1", [id]);
    if (postExists.rowCount === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    const result = await pool.query(
      `INSERT INTO post_votes (post_id, user_id, vote_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (post_id, user_id)
       DO UPDATE SET vote_type = EXCLUDED.vote_type
       RETURNING *`,
      [id, req.user.id, type.toUpperCase()]
    );

    return res.json({ vote: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}
