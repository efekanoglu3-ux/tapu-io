import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: "Çok fazla deneme. 15 dakika sonra tekrar deneyin." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const kycLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: "KYC başvurusu limiti aşıldı. 1 saat sonra tekrar deneyin." },
  standardHeaders: true,
  legacyHeaders: false,
});
