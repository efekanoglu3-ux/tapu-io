import { Router } from "express";
import { buyTokens, portfolio, tokenHistory } from "../controllers/token.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireKYC } from "../middleware/kyc.middleware";
import { body } from "express-validator";

const router = Router();

router.post(
  "/buy",
  authenticate,
  requireKYC,
  [
    body("propertyId").notEmpty().withMessage("propertyId gerekli"),
    body("tokenCount").isInt({ min: 1 }).withMessage("En az 1 token satın alınabilir"),
  ],
  buyTokens
);

router.get("/portfolio", authenticate, portfolio);
router.get("/history", authenticate, tokenHistory);

export default router;
