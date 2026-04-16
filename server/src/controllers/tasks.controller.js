import { pool } from "../config/db.js";

export async function listTasks(req, res, next) {
  try {
    const { skill, difficulty, minBudget, maxBudget, status = "OPEN" } = req.query;

    const conditions = [];
    const params = [];

    if (status) {
      params.push(status.toUpperCase());
      conditions.push(`t.status = $${params.length}`);
    }

    if (difficulty) {
      params.push(difficulty.toUpperCase());
      conditions.push(`t.difficulty = $${params.length}`);
    }

    if (skill) {
      params.push(skill);
      conditions.push(`$${params.length} = ANY(t.tech_stack)`);
    }

    if (minBudget) {
      params.push(Number(minBudget));
      conditions.push(`t.budget >= $${params.length}`);
    }

    if (maxBudget) {
      params.push(Number(maxBudget));
      conditions.push(`t.budget <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT t.*, u.name AS creator_name
      FROM tasks t
      JOIN users u ON u.id = t.creator_id
      ${whereClause}
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query, params);
    return res.json({ tasks: result.rows });
  } catch (error) {
    return next(error);
  }
}

export async function getTask(req, res, next) {
  try {
    const { id } = req.params;

    const taskResult = await pool.query(
      `SELECT t.*, u.name AS creator_name
       FROM tasks t
       JOIN users u ON u.id = t.creator_id
       WHERE t.id = $1`,
      [id]
    );

    if (taskResult.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const proposalsResult = await pool.query(
      `SELECT p.*, u.name AS solver_name
       FROM proposals p
       JOIN users u ON u.id = p.solver_id
       WHERE p.task_id = $1
       ORDER BY p.created_at DESC`,
      [id]
    );

    return res.json({ task: taskResult.rows[0], proposals: proposalsResult.rows });
  } catch (error) {
    return next(error);
  }
}

export async function createTask(req, res, next) {
  try {
    const { title, description, techStack = [], difficulty, budget, deadline } = req.body;

    if (!title || !description || !difficulty || !budget || !deadline) {
      return res.status(400).json({ message: "Missing required task fields" });
    }

    const result = await pool.query(
      `INSERT INTO tasks (creator_id, title, description, tech_stack, difficulty, budget, deadline, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN')
       RETURNING *`,
      [req.user.id, title, description, techStack, difficulty.toUpperCase(), Number(budget), deadline]
    );

    return res.status(201).json({ task: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, techStack, difficulty, budget, deadline, status } = req.body;

    const existing = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = existing.rows[0];

    if (task.creator_id !== req.user.id) {
      return res.status(403).json({ message: "Only creator can update task" });
    }

    if (task.status !== "OPEN" && (title || description || techStack || difficulty || budget || deadline)) {
      return res.status(400).json({ message: "Core fields can only be edited while task is OPEN" });
    }

    const result = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           tech_stack = COALESCE($3, tech_stack),
           difficulty = COALESCE($4, difficulty),
           budget = COALESCE($5, budget),
           deadline = COALESCE($6, deadline),
           status = COALESCE($7, status),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        title,
        description,
        techStack,
        difficulty ? difficulty.toUpperCase() : null,
        budget ? Number(budget) : null,
        deadline,
        status ? status.toUpperCase() : null,
        id,
      ]
    );

    return res.json({ task: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);

    if (existing.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = existing.rows[0];
    if (task.creator_id !== req.user.id) {
      return res.status(403).json({ message: "Only creator can delete task" });
    }

    if (task.status !== "OPEN") {
      return res.status(400).json({ message: "Only OPEN tasks can be deleted" });
    }

    await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function createProposal(req, res, next) {
  try {
    const { id } = req.params;
    const { message, bidAmount } = req.body;

    if (!message || !bidAmount) {
      return res.status(400).json({ message: "Message and bidAmount are required" });
    }

    const taskResult = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    if (taskResult.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = taskResult.rows[0];
    if (task.status !== "OPEN") {
      return res.status(400).json({ message: "Proposals only allowed for OPEN tasks" });
    }

    if (task.creator_id === req.user.id) {
      return res.status(400).json({ message: "Creator cannot apply to own task" });
    }

    const result = await pool.query(
      `INSERT INTO proposals (task_id, solver_id, message, bid_amount, status)
       VALUES ($1, $2, $3, $4, 'SUBMITTED')
       RETURNING *`,
      [id, req.user.id, message, Number(bidAmount)]
    );

    return res.status(201).json({ proposal: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function myCreatedTasks(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT t.*, COUNT(p.id) AS proposal_count
       FROM tasks t
       LEFT JOIN proposals p ON p.task_id = t.id
       WHERE t.creator_id = $1
       GROUP BY t.id
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    return res.json({ tasks: result.rows });
  } catch (error) {
    return next(error);
  }
}

export async function myProposals(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT p.*, t.title, t.status AS task_status
       FROM proposals p
       JOIN tasks t ON t.id = p.task_id
       WHERE p.solver_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    return res.json({ proposals: result.rows });
  } catch (error) {
    return next(error);
  }
}

export async function receivedProposals(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT p.*, t.title AS task_title, t.status AS task_status, t.creator_id, u.name AS solver_name
       FROM proposals p
       JOIN tasks t ON t.id = p.task_id
       JOIN users u ON u.id = p.solver_id
       WHERE t.creator_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    return res.json({ proposals: result.rows });
  } catch (error) {
    return next(error);
  }
}

export async function updateProposalStatus(req, res, next) {
  try {
    const { proposalId } = req.params;
    const normalizedStatus = (req.body.status || "").toUpperCase();

    if (!["ACCEPTED", "REJECTED"].includes(normalizedStatus)) {
      return res.status(400).json({ message: "Status must be ACCEPTED or REJECTED" });
    }

    const proposalResult = await pool.query(
      `SELECT p.*, t.creator_id, t.id AS task_id
       FROM proposals p
       JOIN tasks t ON t.id = p.task_id
       WHERE p.id = $1`,
      [proposalId]
    );

    if (proposalResult.rowCount === 0) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    const proposal = proposalResult.rows[0];
    if (proposal.creator_id !== req.user.id) {
      return res.status(403).json({ message: "Only the task creator can update proposal status" });
    }

    const updatedProposal = await pool.query(
      `UPDATE proposals
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [normalizedStatus, proposalId]
    );

    if (normalizedStatus === "ACCEPTED") {
      await pool.query(
        `UPDATE tasks
         SET status = 'IN_NEGOTIATION', updated_at = NOW()
         WHERE id = $1`,
        [proposal.task_id]
      );

      await pool.query(
        `UPDATE proposals
         SET status = 'REJECTED'
         WHERE task_id = $1 AND id <> $2 AND status = 'SUBMITTED'`,
        [proposal.task_id, proposalId]
      );
    }

    return res.json({ proposal: updatedProposal.rows[0] });
  } catch (error) {
    return next(error);
  }
}
