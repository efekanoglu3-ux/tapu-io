import { Router } from "express";
import { myRentIncome } from "../controllers/rent.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);
router.get("/my-income", myRentIncome);

export default router;
