import { Router } from "express";
import { dashboard, listUsers, approveKYC, approveProperty, revenue } from "../controllers/admin.controller";
import { distributeRent, listRentPayments, activePropertiesForRent } from "../controllers/rent.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/dashboard", dashboard);
router.get("/users", listUsers);
router.put("/users/:id/kyc", approveKYC);
router.put("/properties/:id/approve", approveProperty);
router.get("/revenue", revenue);

// Rent distribution
router.post("/rent/distribute", distributeRent);
router.get("/rent/payments", listRentPayments);
router.get("/rent/active-properties", activePropertiesForRent);

export default router;
