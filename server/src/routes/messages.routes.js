import { Router } from "express";
import { sendMessage, getMessages, deleteMessage, markMessageRead, sendPrivateMessage, getPrivateMessages, getPrivateUnreadCounts } from "../controllers/messages.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/:taskId", requireAuth, sendMessage);
router.get("/:taskId", requireAuth, getMessages);
router.get("/:taskId/private/:recipientId", requireAuth, getPrivateMessages);
router.post("/:taskId/private", requireAuth, sendPrivateMessage);
router.get("/private/unread", requireAuth, getPrivateUnreadCounts);
router.delete("/:messageId", requireAuth, deleteMessage);
router.post("/:messageId/read", requireAuth, markMessageRead);

export default router;
