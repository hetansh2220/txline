import { Router } from "express";
import {
    getMessages,
    getMembers,
    getEntry,
    getMyEntries,
    createEntry,
} from "../controllers/room.controller.js";

const router = Router();

router.get("/api/rooms/:fixtureId/messages", getMessages);
router.get("/api/rooms/:fixtureId/members", getMembers);

// Must come before /:fixtureId, or "entries" would swallow the bare list route.
router.get("/api/entries", getMyEntries);
router.get("/api/entries/:fixtureId", getEntry);
router.post("/api/entries", createEntry);

export default router;
