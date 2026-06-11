import { Router } from "express";
import { listListings, createListing, cancelListing, buyListing, myListings } from "../controllers/market.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireKYC } from "../middleware/kyc.middleware";

const router = Router();

// Public: browse listings
router.get("/", listListings);

// Authenticated routes
router.use(authenticate);
router.get("/my-listings", myListings);
router.post("/list", requireKYC, createListing);
router.delete("/:id", cancelListing);
router.post("/:id/buy", requireKYC, buyListing);

export default router;
