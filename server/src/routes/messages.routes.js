import { Router } from "express";
import { sendMessage, getMessages, deleteMessage, markMessageRead } from "../controllers/messages.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/:taskId", requireAuth, sendMessage);
router.get("/:taskId", requireAuth, getMessages);
router.delete("/:messageId", requireAuth, deleteMessage);
router.post("/:messageId/read", requireAuth, markMessageRead);

export default router;
