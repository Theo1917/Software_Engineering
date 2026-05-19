import { pool } from "../config/db.js";

// ADVANCED SEARCH & DISCOVERY

// Multi-modal search across all content
export async function globalSearch(query, userId, filters = {}) {
  try {
    const {
      types = ["tasks", "posts", "people"],
      difficulty,
      minBudget,
      maxBudget,
      skills,
      teams,
      status,
      sort = "relevance",
      limit = 20,
    } = filters;

    const results = {
      tasks: [],
      posts: [],
      people: [],
      total: 0,
    };

    const searchTerm = `%${query}%`;
    let offset = 0;

    // Search tasks
    if (types.includes("tasks")) {
      let taskQuery = `
        SELECT t.*, u.name AS creator_name, team.name AS team_name,
               (CASE 
                  WHEN t.title ILIKE $1 THEN 100
                  WHEN t.description ILIKE $1 THEN 50
                  WHEN EXISTS (SELECT 1 FROM unnest(t.tech_stack) AS tech WHERE tech ILIKE $1) THEN 30
                  ELSE 0
               END) as relevance_score
        FROM tasks t
        JOIN users u ON u.id = t.creator_id
        LEFT JOIN teams team ON team.id = t.team_id
        WHERE t.status = 'OPEN'
          AND (t.title ILIKE $1 OR t.description ILIKE $1 OR EXISTS (
            SELECT 1 FROM unnest(t.tech_stack) AS tech WHERE tech ILIKE $1
          ))
      `;

      const taskParams = [searchTerm];

      if (difficulty) {
        taskParams.push(difficulty.toUpperCase());
        taskQuery += ` AND t.difficulty = $${taskParams.length}`;
      }

      if (minBudget) {
        taskParams.push(parseFloat(minBudget));
        taskQuery += ` AND t.budget >= $${taskParams.length}`;
      }

      if (maxBudget) {
        taskParams.push(parseFloat(maxBudget));
        taskQuery += ` AND t.budget <= $${taskParams.length}`;
      }

      if (skills && Array.isArray(skills) && skills.length > 0) {
        taskParams.push(skills);
        taskQuery += ` AND t.tech_stack && $${taskParams.length}::text[]`;
      }

      if (status) {
        taskParams.push(status.toUpperCase());
        taskQuery += ` AND t.status = $${taskParams.length}`;
      }

      // Sort by relevance score
      taskQuery += ` ORDER BY relevance_score DESC, t.views DESC`;
      taskParams.push(limit);
      taskQuery += ` LIMIT $${taskParams.length}`;

      const taskResults = await pool.query(taskQuery, taskParams);
      results.tasks = taskResults.rows;
    }

    // Search posts
    if (types.includes("posts")) {
      let postQuery = `
        SELECT p.*, u.name AS author_name,
               (CASE 
                  WHEN p.title ILIKE $1 THEN 100
                  WHEN p.content ILIKE $1 THEN 50
                  WHEN EXISTS (SELECT 1 FROM unnest(p.tags) AS tag WHERE tag ILIKE $1) THEN 30
                  ELSE 0
               END) as relevance_score
        FROM posts p
        JOIN users u ON u.id = p.author_id
        WHERE p.title ILIKE $1 OR p.content ILIKE $1 OR EXISTS (
          SELECT 1 FROM unnest(p.tags) AS tag WHERE tag ILIKE $1
        )
        ORDER BY relevance_score DESC, p.score DESC
        LIMIT $2
      `;

      const postResults = await pool.query(postQuery, [searchTerm, limit]);
      results.posts = postResults.rows;
    }

    // Search people
    if (types.includes("people")) {
      let peopleQuery = `
        SELECT u.id, u.name, u.email, u.reputation, u.skills,
               ua.tasks_completed, ua.posts_created, ua.average_rating,
               (CASE 
                  WHEN u.name ILIKE $1 THEN 100
                  WHEN u.email ILIKE $1 THEN 50
                  ELSE 0
               END) as relevance_score
        FROM users u
        LEFT JOIN user_analytics ua ON ua.user_id = u.id
        WHERE u.name ILIKE $1 OR u.email ILIKE $1
        ORDER BY relevance_score DESC, u.reputation DESC
        LIMIT $2
      `;

      const peopleResults = await pool.query(peopleQuery, [searchTerm, limit]);
      results.people = peopleResults.rows;
    }

    results.total = results.tasks.length + results.posts.length + results.people.length;

    return results;
  } catch (error) {
    console.error("Error in global search:", error);
    throw error;
  }
}

// Faceted search with aggregations
export async function getFacets(query = "") {
  try {
    const searchTerm = query ? `%${query}%` : "%%";

    const facets = {
      difficulties: [],
      budgetRanges: [],
      skills: [],
      categories: [],
      statuses: [],
      teams: [],
    };

    // Difficulty facet
    const difficultyResult = await pool.query(
      `SELECT difficulty, COUNT(*) as count
       FROM tasks
       WHERE (title ILIKE $1 OR description ILIKE $1)
       GROUP BY difficulty
       ORDER BY count DESC`,
      [searchTerm]
    );
    facets.difficulties = difficultyResult.rows;

    // Budget range facet
    const budgetResult = await pool.query(
      `SELECT 
        CASE 
          WHEN budget < 5000 THEN '< 5K'
          WHEN budget < 10000 THEN '5K - 10K'
          WHEN budget < 25000 THEN '10K - 25K'
          WHEN budget < 50000 THEN '25K - 50K'
          ELSE '> 50K'
        END as range,
        COUNT(*) as count
       FROM tasks
       WHERE (title ILIKE $1 OR description ILIKE $1)
       GROUP BY range
       ORDER BY count DESC`,
      [searchTerm]
    );
    facets.budgetRanges = budgetResult.rows;

    // Skills facet
    const skillsResult = await pool.query(
      `SELECT skill, COUNT(*) as count
       FROM (
         SELECT unnest(tech_stack) as skill FROM tasks
         WHERE (title ILIKE $1 OR description ILIKE $1)
       ) skills
       GROUP BY skill
       ORDER BY count DESC
       LIMIT 10`,
      [searchTerm]
    );
    facets.skills = skillsResult.rows;

    // Categories facet
    const categoryResult = await pool.query(
      `SELECT category, COUNT(*) as count
       FROM posts
       WHERE (title ILIKE $1 OR content ILIKE $1)
       GROUP BY category
       ORDER BY count DESC`,
      [searchTerm]
    );
    facets.categories = categoryResult.rows;

    // Status facet
    const statusResult = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM tasks
       WHERE (title ILIKE $1 OR description ILIKE $1)
       GROUP BY status
       ORDER BY count DESC`,
      [searchTerm]
    );
    facets.statuses = statusResult.rows;

    // Teams facet
    const teamsResult = await pool.query(
      `SELECT t.id, t.name, COUNT(*) as count
       FROM teams t
       JOIN tasks tk ON tk.team_id = t.id
       WHERE (tk.title ILIKE $1 OR tk.description ILIKE $1)
       GROUP BY t.id, t.name
       ORDER BY count DESC`,
      [searchTerm]
    );
    facets.teams = teamsResult.rows;

    return facets;
  } catch (error) {
    console.error("Error getting facets:", error);
    throw error;
  }
}

// Advanced filters with saved searches
export async function saveSearch(userId, name, query, filters) {
  try {
    const result = await pool.query(
      `INSERT INTO saved_searches (user_id, name, query, filters)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, name, query, JSON.stringify(filters)]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error saving search:", error);
    throw error;
  }
}

// Get user's saved searches
export async function getSavedSearches(userId) {
  try {
    const result = await pool.query(
      `SELECT * FROM saved_searches WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error("Error getting saved searches:", error);
    throw error;
  }
}

// Delete saved search
export async function deleteSavedSearch(searchId, userId) {
  try {
    const result = await pool.query(
      `DELETE FROM saved_searches WHERE id = $1 AND user_id = $2 RETURNING id`,
      [searchId, userId]
    );

    if (result.rowCount === 0) {
      throw new Error("Saved search not found or unauthorized");
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting saved search:", error);
    throw error;
  }
}

// Create search suggestions
export async function getSearchSuggestions(query, limit = 10) {
  try {
    const term = `%${query}%`;

    const result = await pool.query(
      `(
        SELECT DISTINCT title as suggestion, 'task' as type, COUNT(*) as frequency
        FROM tasks
        WHERE title ILIKE $1
        GROUP BY title
        LIMIT $2
      )
      UNION ALL
      (
        SELECT DISTINCT title as suggestion, 'post' as type, COUNT(*) as frequency
        FROM posts
        WHERE title ILIKE $1
        GROUP BY title
        LIMIT $2
      )
      UNION ALL
      (
        SELECT DISTINCT skill as suggestion, 'skill' as type, COUNT(*) as frequency
        FROM (
          SELECT unnest(tech_stack) as skill FROM tasks WHERE tech_stack::text ILIKE $1
        ) skills
        GROUP BY skill
        LIMIT $2
      )
      ORDER BY frequency DESC
      LIMIT $2`,
      [term, limit]
    );

    return result.rows;
  } catch (error) {
    console.error("Error getting search suggestions:", error);
    throw error;
  }
}
