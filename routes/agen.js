import express from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { getAllAgen, createAgen, updateAgen, deleteAgen } from "../controllers/agenController.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("admin", "kasir"), getAllAgen);
router.post("/", requireAuth, requireRole("admin", "kasir"), createAgen);
router.put("/:id", requireAuth, requireRole("admin", "kasir"), updateAgen);
router.delete("/:id", requireAuth, requireRole("admin", "kasir"), deleteAgen);

export default router;