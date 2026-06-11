import { Router } from "express";
import {
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  getPropertyTokens,
  myProperties,
  myEarnings,
} from "../controllers/property.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/auth.middleware";
import {
  createPropertyValidators,
  updatePropertyValidators,
  listPropertyQueryValidators,
} from "../utils/validators";

const router = Router();

// Public (ama auth varsa user bilgisi eklenir)
router.get("/", listPropertyQueryValidators, listProperties);
router.get("/my", authenticate, requireRole("OWNER", "ADMIN"), myProperties);
router.get("/my/earnings", authenticate, requireRole("OWNER", "ADMIN"), myEarnings);
router.get("/:id", getProperty);
router.get("/:id/tokens", getPropertyTokens);

// Korumalı
router.post(
  "/",
  authenticate,
  requireRole("OWNER", "ADMIN"),
  createPropertyValidators,
  createProperty
);
router.put(
  "/:id",
  authenticate,
  requireRole("OWNER", "ADMIN"),
  updatePropertyValidators,
  updateProperty
);

export default router;
