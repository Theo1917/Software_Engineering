import { Router } from "express";
import {
  addComment,
  createPost,
  getPost,
  listPosts,
  trendingPosts,
  votePost,
} from "../controllers/posts.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", listPosts);
router.get("/trending", trendingPosts);
router.get("/:id", getPost);
router.post("/", requireAuth, createPost);
router.post("/:id/comments", requireAuth, addComment);
router.post("/:id/vote", requireAuth, votePost);

export default router;
