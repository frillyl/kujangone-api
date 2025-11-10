import express from "express";
import { getAllKaryawan, unassignKaryawan } from "../controllers/karyawanController.js";

const router = express.Router();

router.get("/", getAllKaryawan);
router.patch("/unassign/:id", unassignKaryawan);

export default router;