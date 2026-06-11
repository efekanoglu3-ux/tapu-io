import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";

// POST /api/admin/rent/distribute
// Body: { propertyId, amount, period } — period like "2026-05"
export async function distributeRent(req: Request, res: Response) {
  const { propertyId, amount, period } = req.body;
  const adminId = req.user!.id;

  if (!propertyId || !amount || !period) {
    return res.status(422).json({ error: "propertyId, amount ve period zorunlu" });
  }
  if (amount <= 0) {
    return res.status(422).json({ error: "Miktar pozitif olmalı" });
  }

  try {
    // 1. Verify property exists & is ACTIVE
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) return res.status(404).json({ error: "Mülk bulunamadı" });
    if (property.status !== "ACTIVE") {
      return res.status(422).json({ error: "Sadece aktif mülkler için kira dağıtılabilir" });
    }

    // 2. Check if already distributed for this period
    const existing = await prisma.rentPayment.findFirst({
      where: { propertyId, period, distributed: true },
    });
    if (existing) {
      return res.status(409).json({ error: `${period} dönemi için kira zaten dağıtılmış` });
    }

    // 3. Get all token holders
    const holders = await prisma.tokenHolding.findMany({
      where: { propertyId },
      include: { user: { select: { id: true, name: true } } },
    });

    if (holders.length === 0) {
      return res.status(422).json({ error: "Bu mülk için token sahibi bulunamadı" });
    }

    const totalTokens = property.totalTokens;
    const amountNum = parseFloat(amount);

    // 4. Distribute in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const distributions: { userId: string; share: number; tokens: number }[] = [];

      for (const holding of holders) {
        const share = (holding.tokens / totalTokens) * amountNum;
        if (share <= 0) continue;

        // Credit user wallet
        await tx.user.update({
          where: { id: holding.userId },
          data: { walletBalance: { increment: share } },
        });

        // Create RENT_INCOME transaction
        await tx.transaction.create({
          data: {
            userId: holding.userId,
            type: "RENT_INCOME",
            amount: share,
            propertyId,
            tokens: holding.tokens,
            fee: 0,
            status: "CONFIRMED",
            description: `${property.nameTr || property.name} - ${period} kira geliri`,
          },
        });

        distributions.push({ userId: holding.userId, share, tokens: holding.tokens });
      }

      // Create RentPayment record
      const rentPayment = await tx.rentPayment.create({
        data: {
          propertyId,
          amount: amountNum,
          period,
          distributed: true,
          distributedAt: new Date(),
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: adminId,
          propertyId,
          action: "RENT_DISTRIBUTE",
          details: { period, amount: amountNum, holdersCount: distributions.length },
          ipAddress: req.ip,
        },
      });

      return { rentPayment, distributions, holdersCount: distributions.length };
    });

    logger.info("Rent distributed", { propertyId, period, amount: amountNum, holders: result.holdersCount });
    return res.json({
      message: `${result.holdersCount} yatırımcıya toplam ₺${amountNum.toLocaleString("tr-TR")} kira dağıtıldı`,
      data: result,
    });
  } catch (err) {
    logger.error("distributeRent error", { err });
    return res.status(500).json({ error: "Kira dağıtımı başarısız" });
  }
}

// GET /api/admin/rent/payments  — list rent payment history
export async function listRentPayments(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
  const skip = (page - 1) * limit;

  try {
    const [payments, total] = await Promise.all([
      prisma.rentPayment.findMany({
        skip, take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          property: { select: { id: true, name: true, nameTr: true, location: true } },
        },
      }),
      prisma.rentPayment.count(),
    ]);

    return res.json({ data: payments, pagination: { page, limit, total } });
  } catch (err) {
    logger.error("listRentPayments error", { err });
    return res.status(500).json({ error: "Kira ödemeleri yüklenemedi" });
  }
}

// GET /api/admin/rent/active-properties — properties eligible for rent distribution
export async function activePropertiesForRent(req: Request, res: Response) {
  try {
    const properties = await prisma.property.findMany({
      where: { status: "ACTIVE", soldTokens: { gt: 0 } },
      select: {
        id: true, name: true, nameTr: true, location: true,
        monthlyRent: true, totalTokens: true, soldTokens: true,
        _count: { select: { holdings: true } },
      },
      orderBy: { name: "asc" },
    });
    return res.json({ data: properties });
  } catch (err) {
    logger.error("activePropertiesForRent error", { err });
    return res.status(500).json({ error: "Mülkler yüklenemedi" });
  }
}

// GET /api/rent/my-income — investor's rent income history
export async function myRentIncome(req: Request, res: Response) {
  const userId = req.user!.id;
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId, type: "RENT_INCOME", status: "CONFIRMED" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const totalIncome = transactions.reduce((sum, t) => sum + t.amount, 0);

    return res.json({ data: transactions, totalIncome });
  } catch (err) {
    logger.error("myRentIncome error", { err });
    return res.status(500).json({ error: "Kira geliri yüklenemedi" });
  }
}
