import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

interface JwtPayload {
  userId: string;
  role: string;
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Kimlik doğrulama gerekli" });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        kycStatus: true,
        kycScore: true,
        walletAddress: true,
        walletBalance: true,
        masak: true,
        language: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Kullanıcı bulunamadı" });
    }

    if (user.masak === "BLOCKED") {
      return res.status(403).json({ error: "Hesabınız askıya alınmıştır" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Geçersiz veya süresi dolmuş token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Bu işlem için yetkiniz yok" });
    }
    next();
  };
}
