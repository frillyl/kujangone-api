import express from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { getAllAnggota, createAnggota, updateAnggota, deleteAnggota, resetPasswordAnggota, assignToKaryawan } from "../controllers/anggotaController.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("admin", "sekretaris"), getAllAnggota);
router.post("/", requireAuth, requireRole("admin", "sekretaris"), createAnggota);
router.put("/:id", requireAuth, requireRole("admin", "sekretaris"), updateAnggota);
router.delete("/:id", requireAuth, requireRole("admin", "sekretaris"), deleteAnggota);
router.put("/reset-password/:id", requireAuth, requireRole("admin", "sekretaris"), resetPasswordAnggota);
router.post("/assign-karyawan/:id", requireAuth, requireRole("admin"), assignToKaryawan);

export default router;