import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";

// POST /api/payments/deposit  (şimdilik mock — iyzico Sprint 3'te)
export async function deposit(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const userId = req.user!.id;
  const { amount } = req.body;

  if (!amount || amount < 100) {
    return res.status(422).json({ error: "Minimum yatırım tutarı ₺100" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: amount } },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId, type: "DEPOSIT",
          amount, status: "CONFIRMED",
          description: "Bakiye yükleme",
        },
      });

      await tx.auditLog.create({
        data: { userId, action: "DEPOSIT", details: { amount }, ipAddress: req.ip },
      });

      return transaction;
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    logger.info("Deposit", { userId, amount });
    return res.status(201).json({
      message: `₺${amount} başarıyla yüklendi`,
      transactionId: result.id,
      newBalance: user?.walletBalance,
    });
  } catch (err) {
    logger.error("deposit error", { err });
    return res.status(500).json({ error: "Para yükleme sırasında hata oluştu" });
  }
}

// POST /api/payments/withdraw
export async function withdraw(req: Request, res: Response) {
  const userId = req.user!.id;
  const { amount, iban } = req.body;

  if (!amount || amount < 50) return res.status(422).json({ error: "Minimum çekim tutarı ₺50" });
  if (!iban) return res.status(422).json({ error: "IBAN gerekli" });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.walletBalance < amount) {
      return res.status(400).json({ error: "Yetersiz bakiye" });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: amount } },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId, type: "WITHDRAWAL",
          amount, status: "PENDING",
          description: `IBAN çekim: ${iban.slice(-4).padStart(iban.length, "*")}`,
        },
      });

      await tx.auditLog.create({
        data: { userId, action: "WITHDRAWAL_REQUESTED", details: { amount }, ipAddress: req.ip },
      });

      return transaction;
    });

    logger.info("Withdrawal requested", { userId, amount });
    return res.status(201).json({
      message: "Çekim talebiniz alındı. 1-3 iş günü içinde hesabınıza yatırılır.",
      transactionId: result.id,
    });
  } catch (err) {
    logger.error("withdraw error", { err });
    return res.status(500).json({ error: "Para çekme sırasında hata oluştu" });
  }
}

// GET /api/payments/history
export async function paymentHistory(req: Request, res: Response) {
  const userId = req.user!.id;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 20;

  try {
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId, type: { in: ["DEPOSIT", "WITHDRAWAL"] } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where: { userId, type: { in: ["DEPOSIT", "WITHDRAWAL"] } } }),
    ]);

    return res.json({ data: transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    logger.error("paymentHistory error", { err });
    return res.status(500).json({ error: "Ödeme geçmişi yüklenemedi" });
  }
}
