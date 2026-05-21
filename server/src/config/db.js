import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

export const pool = new Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// TEMPORARY TEST
pool
  .query("SELECT NOW()")
  .then(() => console.log("✅ Database Connected"))
  .catch((err) => console.error("❌ DB Error:", err.message));