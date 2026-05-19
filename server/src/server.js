import app from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { pool } from "./config/db.js";

const port = Number(process.env.PORT || 5000);

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
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;");
    console.log('DB migration: ensured is_admin column exists');
  } catch (error) {
    console.error('DB migration error:', error);
  }
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
