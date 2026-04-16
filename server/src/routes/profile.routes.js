import { Router } from "express";
import { getMyProfile, updateMySkills } from "../controllers/profile.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, getMyProfile);
router.put("/me/skills", requireAuth, updateMySkills);

export default router;
