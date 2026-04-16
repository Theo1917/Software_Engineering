import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

export async function register(req, res, next) {
  try {
    const { name, email, password, skills = [] } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, skills, reputation)
       VALUES ($1, $2, $3, $4, 10)
       RETURNING id, name, email, skills, reputation, created_at`,
      [name, email, passwordHash, skills]
    );

    const user = result.rows[0];
    const token = signToken(user);

    return res.status(201).json({ token, user });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await pool.query(
      "SELECT id, name, email, password_hash, skills, reputation, created_at FROM users WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const matches = await bcrypt.compare(password, user.password_hash);

    if (!matches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    const { password_hash, ...safeUser } = user;

    return res.json({ token, user: safeUser });
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT id, name, email, skills, reputation, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}
