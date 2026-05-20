import express from "express";
import multer from "multer";
import {
  analyzeProjectData,
  getProjectSession,
  listProjectSessions,
  semanticSearch,
} from "../controllers/engineeringAssistant.controller.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 12,
  },
});

router.post("/analyze", upload.array("attachments", 12), analyzeProjectData);
router.get("/sessions", listProjectSessions);
router.get("/semantic-search", semanticSearch);
router.get("/sessions/:id", getProjectSession);

export default router;