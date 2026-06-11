import { Router } from "express";
import { register, login, me, submitKYC, refreshToken } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authLimiter, kycLimiter } from "../middleware/rateLimit.middleware";
import { registerValidators, loginValidators, kycValidators } from "../utils/validators";

const router = Router();

router.post("/register", authLimiter, registerValidators, register);
router.post("/login", authLimiter, loginValidators, login);
router.post("/refresh", authLimiter, refreshToken);
router.get("/me", authenticate, me);
router.post("/kyc", authenticate, kycLimiter, kycValidators, submitKYC);

export default router;
