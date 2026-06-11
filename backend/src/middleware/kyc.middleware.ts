import { Request, Response, NextFunction } from "express";

export function requireKYC(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Kimlik doğrulama gerekli" });
  }

  if (req.user.kycStatus !== "APPROVED") {
    return res.status(403).json({
      error: "Bu işlem için KYC doğrulaması gereklidir",
      kycStatus: req.user.kycStatus,
    });
  }

  next();
}
