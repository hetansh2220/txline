import { Router } from "express";
import { settle, leaderboard, globalLeaderboard } from "../controllers/contest.controller.js";

const router = Router();

router.post("/api/contests/:fixtureId/settle", settle);
router.get("/api/contests/:fixtureId/leaderboard", leaderboard);
router.get("/api/leaderboard", globalLeaderboard);

export default router;
