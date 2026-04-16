import { pool } from "../config/db.js";

export async function getMyProfile(req, res, next) {
  try {
    const userResult = await pool.query(
      "SELECT id, name, email, skills, reputation, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const analyticsResult = await pool.query(
      `SELECT
          COUNT(*) FILTER (WHERE creator_id = $1) AS tasks_created,
          COUNT(*) FILTER (WHERE creator_id = $1 AND status = 'COMPLETED') AS tasks_completed,
          COUNT(*) FILTER (WHERE creator_id = $1 AND status = 'DISPUTED') AS tasks_disputed
       FROM tasks`,
      [req.user.id]
    );

    const proposalResult = await pool.query(
      `SELECT
          COUNT(*) AS proposals_submitted,
          COUNT(*) FILTER (WHERE status = 'ACCEPTED') AS proposals_accepted
       FROM proposals
       WHERE solver_id = $1`,
      [req.user.id]
    );

    return res.json({
      user: userResult.rows[0],
      analytics: {
        ...analyticsResult.rows[0],
        ...proposalResult.rows[0],
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateMySkills(req, res, next) {
  try {
    const rawSkills = Array.isArray(req.body.skills) ? req.body.skills : [];
    const skills = rawSkills.map((skill) => String(skill).trim()).filter(Boolean);

    const result = await pool.query(
      `UPDATE users
       SET skills = $1
       WHERE id = $2
       RETURNING id, name, email, skills, reputation, created_at`,
      [skills, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}
