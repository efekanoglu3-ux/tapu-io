import { Router } from "express";
import { deposit, withdraw, paymentHistory } from "../controllers/payment.controller";
import { authenticate } from "../middleware/auth.middleware";
import { body } from "express-validator";

const router = Router();

router.post(
  "/deposit",
  authenticate,
  [body("amount").isFloat({ min: 100 }).withMessage("Minimum ₺100 yatırılabilir")],
  deposit
);

router.post(
  "/withdraw",
  authenticate,
  [
    body("amount").isFloat({ min: 50 }).withMessage("Minimum ₺50 çekilebilir"),
    body("iban").notEmpty().withMessage("IBAN gerekli"),
  ],
  withdraw
);

router.get("/history", authenticate, paymentHistory);

export default router;
