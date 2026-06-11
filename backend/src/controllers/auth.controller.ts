import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";

function signToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]) || "7d",
  });
}

function safeUser(user: { passwordHash?: string; [key: string]: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}

// POST /api/auth/register
export async function register(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { email, password, name, phone, role = "INVESTOR", language = "tr" } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Bu e-posta adresi zaten kayıtlı" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name, phone, role, language },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_REGISTER",
        details: { email, role },
        ipAddress: req.ip,
      },
    });

    const token = signToken(user.id, user.role);
    logger.info("User registered", { userId: user.id, email, role });

    return res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    logger.error("Register error", { err });
    return res.status(500).json({ error: "Kayıt sırasında bir hata oluştu" });
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "E-posta veya şifre hatalı" });
    }

    if (user.masak === "BLOCKED") {
      return res.status(403).json({ error: "Hesabınız askıya alınmıştır. Destek ile iletişime geçin." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "E-posta veya şifre hatalı" });
    }

    await prisma.auditLog.create({
      data: { userId: user.id, action: "USER_LOGIN", ipAddress: req.ip },
    });

    const token = signToken(user.id, user.role);
    logger.info("User logged in", { userId: user.id });

    return res.json({ token, user: safeUser(user) });
  } catch (err) {
    logger.error("Login error", { err });
    return res.status(500).json({ error: "Giriş sırasında bir hata oluştu" });
  }
}

// GET /api/auth/me
export async function me(req: Request, res: Response) {
  return res.json({ user: req.user });
}

// POST /api/auth/kyc
export async function submitKYC(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const userId = req.user!.id;

  if (req.user!.kycStatus === "APPROVED") {
    return res.status(400).json({ error: "KYC doğrulamanız zaten tamamlanmış" });
  }

  const { idType, idNumber, birthDate, nationality, address } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: "IN_REVIEW",
        kycDocuments: { idType, idNumber, birthDate, nationality, address },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: "KYC_SUBMITTED",
        details: { idType, nationality },
        ipAddress: req.ip,
      },
    });

    logger.info("KYC submitted", { userId });

    return res.json({
      message: "KYC başvurunuz alındı. İnceleme 1-3 iş günü sürebilir.",
      kycStatus: user.kycStatus,
    });
  } catch (err) {
    logger.error("KYC submit error", { err });
    return res.status(500).json({ error: "KYC başvurusu sırasında bir hata oluştu" });
  }
}

// POST /api/auth/refresh
export async function refreshToken(req: Request, res: Response) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token gerekli" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.masak === "BLOCKED") {
      return res.status(401).json({ error: "Geçersiz token" });
    }

    const newToken = signToken(user.id, user.role);
    return res.json({ token: newToken });
  } catch {
    return res.status(401).json({ error: "Geçersiz veya süresi dolmuş token" });
  }
}
