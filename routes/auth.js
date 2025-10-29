import express from "express";
import { body } from "express-validator";
import { registerAnggota, login, changePassword, verifyAccount, resendVerification, getCurrentUser } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", [body("nama").notEmpty(), body("nrp").notEmpty()], registerAnggota);
router.post("/login", login);
router.post("/change-password", requireAuth, changePassword);
router.post("/verify", verifyAccount);
router.post("/resend-verification", resendVerification);
router.get("/me", requireAuth, getCurrentUser);

export default router;