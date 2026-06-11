import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";

const PLATFORM_FEE_RATE = 0.025; // %2.5

// POST /api/tokens/buy
export async function buyTokens(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const userId = req.user!.id;
  const { propertyId, tokenCount } = req.body;

  if (!propertyId || !tokenCount || tokenCount < 1) {
    return res.status(422).json({ error: "propertyId ve tokenCount gerekli" });
  }

  try {
    // Prisma transaction — atomik işlem
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mülkü kilitle ve kontrol et
      const property = await tx.property.findUnique({ where: { id: propertyId } });
      if (!property) throw new Error("PROPERTY_NOT_FOUND");
      if (property.status !== "ACTIVE") throw new Error("PROPERTY_NOT_ACTIVE");

      const available = property.totalTokens - property.soldTokens;
      if (tokenCount > available) throw new Error(`INSUFFICIENT_TOKENS:${available}`);

      // 2. Toplam maliyet
      const subtotal = tokenCount * property.tokenPrice;
      const fee = Math.round(subtotal * PLATFORM_FEE_RATE * 100) / 100;
      const total = subtotal + fee;

      // 3. Kullanıcı bakiyesini kontrol et
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("USER_NOT_FOUND");
      if (user.walletBalance < total) throw new Error(`INSUFFICIENT_BALANCE:${total}`);

      // 4. Bakiyeyi düş
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: total } },
      });

      // 5. Mülk satılan token sayısını artır
      await tx.property.update({
        where: { id: propertyId },
        data: { soldTokens: { increment: tokenCount } },
      });

      // 6. Token holding güncelle (varsa artır, yoksa oluştur)
      const holding = await tx.tokenHolding.upsert({
        where: { userId_propertyId: { userId, propertyId } },
        create: {
          userId, propertyId,
          tokens: tokenCount,
          purchasePrice: property.tokenPrice,
          currentValue: property.tokenPrice,
        },
        update: {
          tokens: { increment: tokenCount },
          currentValue: property.tokenPrice,
        },
      });

      // 7. Transaction kaydı
      const transaction = await tx.transaction.create({
        data: {
          userId, type: "TOKEN_PURCHASE",
          amount: subtotal, fee,
          propertyId, tokens: tokenCount,
          status: "CONFIRMED",
        },
      });

      // 8. Platform komisyon kaydı
      await tx.transaction.create({
        data: {
          userId, type: "PLATFORM_FEE",
          amount: fee, fee: 0,
          propertyId, status: "CONFIRMED",
          description: `Token satın alma komisyonu — ${property.name}`,
        },
      });

      // 9. Audit log
      await tx.auditLog.create({
        data: {
          userId, propertyId,
          action: "TOKEN_PURCHASED",
          details: { tokenCount, subtotal, fee, total },
        },
      });

      return { transaction, holding, subtotal, fee, total, property };
    });

    logger.info("Token purchased", { userId, propertyId, tokenCount });

    return res.status(201).json({
      message: "Token satın alma başarılı",
      data: {
        transactionId: result.transaction.id,
        propertyName: result.property.name,
        tokenCount,
        subtotal: result.subtotal,
        fee: result.fee,
        total: result.total,
        totalTokensOwned: result.holding.tokens,
      },
    });
  } catch (err: any) {
    if (err.message === "PROPERTY_NOT_FOUND") return res.status(404).json({ error: "Mülk bulunamadı" });
    if (err.message === "PROPERTY_NOT_ACTIVE") return res.status(400).json({ error: "Bu mülk aktif değil" });
    if (err.message?.startsWith("INSUFFICIENT_TOKENS")) {
      const avail = err.message.split(":")[1];
      return res.status(400).json({ error: `Yeterli token yok. Mevcut: ${avail}` });
    }
    if (err.message?.startsWith("INSUFFICIENT_BALANCE")) {
      const needed = err.message.split(":")[1];
      return res.status(400).json({ error: `Yetersiz bakiye. Gereken: ₺${needed}` });
    }
    logger.error("buyTokens error", { err });
    return res.status(500).json({ error: "Token satın alma sırasında hata oluştu" });
  }
}

// GET /api/tokens/portfolio
export async function portfolio(req: Request, res: Response) {
  const userId = req.user!.id;

  try {
    const holdings = await prisma.tokenHolding.findMany({
      where: { userId },
      include: {
        property: {
          select: {
            id: true, name: true, nameTr: true, location: true,
            type: true, tokenPrice: true, monthlyRent: true,
            annualYield: true, status: true, totalTokens: true, soldTokens: true,
          },
        },
      },
      orderBy: { purchaseDate: "desc" },
    });

    const totalValue = holdings.reduce((sum, h) => sum + h.tokens * h.property.tokenPrice, 0);
    const monthlyIncome = holdings.reduce((sum, h) => {
      const share = h.tokens / h.property.totalTokens;
      return sum + h.property.monthlyRent * share;
    }, 0);

    return res.json({
      data: {
        holdings,
        summary: {
          totalValue: Math.round(totalValue * 100) / 100,
          monthlyIncome: Math.round(monthlyIncome * 100) / 100,
          propertyCount: holdings.length,
          totalTokens: holdings.reduce((s, h) => s + h.tokens, 0),
        },
      },
    });
  } catch (err) {
    logger.error("portfolio error", { err });
    return res.status(500).json({ error: "Portföy yüklenemedi" });
  }
}

// GET /api/tokens/history
export async function tokenHistory(req: Request, res: Response) {
  const userId = req.user!.id;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 20;
  const skip = (page - 1) * limit;
  const type = req.query.type as string | undefined;

  const where: any = { userId };
  if (type) where.type = type;

  try {
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip, take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return res.json({ data: transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    logger.error("tokenHistory error", { err });
    return res.status(500).json({ error: "İşlem geçmişi yüklenemedi" });
  }
}
