import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import propertyRoutes from "./routes/property.routes";
import tokenRoutes from "./routes/token.routes";
import paymentRoutes from "./routes/payment.routes";
import adminRoutes from "./routes/admin.routes";
import rentRoutes from "./routes/rent.routes";
import marketRoutes from "./routes/market.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options("*", cors());
app.use(express.json());
app.use(morgan("dev"));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/tokens", tokenRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/rent", rentRoutes);
app.use("/api/market", marketRoutes);

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", platform: "TAPU.IO", version: "1.0.0" });
});

// ── TEMP SETUP (remove after use) ────────────────────────────────────────────
app.get("/setup-admin/:email", async (req, res) => {
  const { prisma } = await import("./lib/prisma");
  try {
    const user = await prisma.user.update({
      where: { email: req.params.email },
      data: { role: "ADMIN", kycStatus: "APPROVED", kycScore: 95, walletBalance: 50000 },
    });
    res.json({ ok: true, role: user.role, kycStatus: user.kycStatus, walletBalance: user.walletBalance });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`TAPU.IO Backend running on port ${PORT}`);
});

export default app;
