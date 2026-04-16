import { Router } from "express";
import {
  createProposal,
  createTask,
  deleteTask,
  getTask,
  listTasks,
  myCreatedTasks,
  myProposals,
  receivedProposals,
  updateProposalStatus,
  updateTask,
} from "../controllers/tasks.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", listTasks);
router.get("/mine/created", requireAuth, myCreatedTasks);
router.get("/mine/proposals", requireAuth, myProposals);
router.get("/mine/received-proposals", requireAuth, receivedProposals);
router.get("/:id", getTask);
router.post("/", requireAuth, createTask);
router.patch("/:id", requireAuth, updateTask);
router.delete("/:id", requireAuth, deleteTask);
router.post("/:id/proposals", requireAuth, createProposal);
router.patch("/proposals/:proposalId", requireAuth, updateProposalStatus);

export default router;
