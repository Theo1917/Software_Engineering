import app from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { readFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { pool } from "./config/db.js";

const port = Number(process.env.PORT || 5000);
const __dirname = dirname(fileURLToPath(import.meta.url));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map(o => o.trim()),
    credentials: true,
  },
});

// Store active connections per task
const taskConnections = {};

async function archiveClosedTasks() {
  try {
    await pool.query(
      `UPDATE tasks
       SET archived_at = NOW(), updated_at = NOW()
       WHERE status = 'COMPLETED'
         AND archived_at IS NULL
         AND updated_at < NOW() - INTERVAL '7 days'`
    );
  } catch (error) {
    console.error("Error archiving closed tasks:", error);
  }
}

async function ensureSchema() {
  const schemaPath = resolve(__dirname, "../db/schema.sql");
  const rawSql = await readFile(schemaPath, "utf8");

  // Run statements one-by-one so we can ignore duplicate enum type creation in existing DBs.
  const statements = rawSql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (error) {
      const isCreateType = /^CREATE\s+TYPE\b/i.test(statement);
      const isCreateIndex = /^CREATE\s+(UNIQUE\s+)?INDEX\b/i.test(statement);
      const isDuplicateObject = error?.code === "42710" || /already exists/i.test(error?.message || "");
      const isMissingDependency = error?.code === "42P01" || error?.code === "42703";

      if (isCreateType && isDuplicateObject) {
        continue;
      }

      // Legacy DBs can miss some columns/tables referenced by optional indexes.
      if (isCreateIndex && isMissingDependency) {
        continue;
      }

      throw error;
    }
  }

  // Backfill key columns for older task/user schemas used by newer routes.
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE");
  await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_solver_id INTEGER REFERENCES users(id) ON DELETE SET NULL");
  await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()");
  await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE");

  console.log("DB migration: schema ensured from schema.sql");
}

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join task chat room
  socket.on("join-task-chat", (taskId) => {
    const roomName = `task-${taskId}`;
    socket.join(roomName);
    
    if (!taskConnections[taskId]) {
      taskConnections[taskId] = new Set();
    }
    taskConnections[taskId].add(socket.id);

    io.to(roomName).emit("user-joined", {
      message: `User joined the chat`,
      activeUsers: taskConnections[taskId].size,
    });
  });

  // Send message
  socket.on("send-message", (data) => {
    const { taskId, message, userId, userName, fileUrl = null, parentMessageId = null } = data;
    const roomName = `task-${taskId}`;
    
    io.to(roomName).emit("receive-message", {
      userId,
      userName,
      message,
      fileUrl,
      parentMessageId,
      timestamp: new Date(),
    });
  });

  // Typing indicator
  socket.on("typing", (data) => {
    const { taskId, userName } = data;
    const roomName = `task-${taskId}`;
    socket.to(roomName).emit("user-typing", { userName });
  });

  // Stop typing
  socket.on("stop-typing", (data) => {
    const { taskId, userName } = data;
    const roomName = `task-${taskId}`;
    socket.to(roomName).emit("user-stop-typing", { userName });
  });

  // Mark message as read
  socket.on("message-read", (data) => {
    const { taskId, messageId } = data;
    const roomName = `task-${taskId}`;
    socket.to(roomName).emit("read-receipt", { messageId });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    Object.keys(taskConnections).forEach((taskId) => {
      taskConnections[taskId].delete(socket.id);
      if (taskConnections[taskId].size === 0) {
        delete taskConnections[taskId];
      }
    });
  });
});

ensureSchema().then(() => {
  httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    // archiveClosedTasks(); // Disabled pending DB migration
    // setInterval(archiveClosedTasks, 24 * 60 * 60 * 1000); // Disabled pending DB migration
  });
}).catch((err) => {
  console.error('Failed to ensure DB schema on startup:', err);
  httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
