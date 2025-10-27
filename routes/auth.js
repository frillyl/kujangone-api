import express from "express";
import { body } from "express-validator";
import { registerAnggota, login, changePassword } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", [body("nama").notEmpty(), body("nrp").notEmpty()], registerAnggota);
router.post("/login", login);
router.post("/change-password", requireAuth, changePassword);

export default router;