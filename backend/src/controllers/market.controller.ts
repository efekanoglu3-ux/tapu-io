import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";

const SECONDARY_MARKET_FEE = 0.01; // 1%

// GET /api/market — list all active listings
export async function listListings(req: Request, res: Response) {
  const propertyId = req.query.propertyId as string | undefined;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
  const skip = (page - 1) * limit;

  const where: any = { status: "ACTIVE" };
  if (propertyId) where.propertyId = propertyId;

  try {
    const [listings, total] = await Promise.all([
      prisma.marketListing.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          seller: { select: { id: true, name: true } },
          property: {
            select: {
              id: true, name: true, nameTr: true, location: true,
              type: true, tokenPrice: true, annualYield: true,
            },
          },
        },
      }),
      prisma.marketListing.count({ where }),
    ]);

    return res.json({ data: listings, pagination: { page, limit, total } });
  } catch (err) {
    logger.error("listListings error", { err });
    return res.status(500).json({ error: "İlanlar yüklenemedi" });
  }
}

// POST /api/market/list — seller creates a listing
// Body: { propertyId, tokens, pricePerToken }
export async function createListing(req: Request, res: Response) {
  const { propertyId, tokens, pricePerToken } = req.body;
  const sellerId = req.user!.id;

  if (!propertyId || !tokens || !pricePerToken) {
    return res.status(422).json({ error: "propertyId, tokens ve pricePerToken zorunlu" });
  }
  if (tokens <= 0 || pricePerToken <= 0) {
    return res.status(422).json({ error: "Token ve fiyat pozitif olmalı" });
  }

  try {
    // Check seller actually owns enough tokens
    const holding = await prisma.tokenHolding.findUnique({
      where: { userId_propertyId: { userId: sellerId, propertyId } },
    });

    if (!holding) return res.status(404).json({ error: "Bu mülk için token sahibi değilsiniz" });

    // Count tokens already listed by this seller for this property
    const alreadyListed = await prisma.marketListing.aggregate({
      where: { sellerId, propertyId, status: "ACTIVE" },
      _sum: { tokens: true },
    });
    const listedCount = alreadyListed._sum.tokens ?? 0;

    if (listedCount + tokens > holding.tokens) {
      return res.status(422).json({
        error: `Yetersiz token. Elinizde ${holding.tokens} adet var, ${listedCount} adedi zaten ilanda.`,
      });
    }

    const listing = await prisma.marketListing.create({
      data: { sellerId, propertyId, tokens, pricePerToken },
      include: {
        property: { select: { name: true, nameTr: true, location: true } },
      },
    });

    logger.info("Listing created", { sellerId, propertyId, tokens, pricePerToken });
    return res.status(201).json({ message: "İlan oluşturuldu", data: listing });
  } catch (err) {
    logger.error("createListing error", { err });
    return res.status(500).json({ error: "İlan oluşturulamadı" });
  }
}

// DELETE /api/market/:id — seller cancels their listing
export async function cancelListing(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    const listing = await prisma.marketListing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ error: "İlan bulunamadı" });
    if (listing.sellerId !== userId) return res.status(403).json({ error: "Bu ilanı iptal etme yetkiniz yok" });
    if (listing.status !== "ACTIVE") return res.status(409).json({ error: "İlan zaten aktif değil" });

    await prisma.marketListing.update({ where: { id }, data: { status: "CANCELLED" } });
    return res.json({ message: "İlan iptal edildi" });
  } catch (err) {
    logger.error("cancelListing error", { err });
    return res.status(500).json({ error: "İlan iptal edilemedi" });
  }
}

// POST /api/market/:id/buy — buyer purchases a listing
export async function buyListing(req: Request, res: Response) {
  const { id } = req.params;
  const buyerId = req.user!.id;

  try {
    const listing = await prisma.marketListing.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, walletBalance: true } },
        property: { select: { id: true, name: true, nameTr: true, tokenPrice: true, totalTokens: true } },
      },
    });

    if (!listing) return res.status(404).json({ error: "İlan bulunamadı" });
    if (listing.status !== "ACTIVE") return res.status(409).json({ error: "İlan artık aktif değil" });
    if (listing.sellerId === buyerId) return res.status(409).json({ error: "Kendi ilanınızı satın alamazsınız" });

    const totalCost = listing.tokens * listing.pricePerToken;
    const fee = totalCost * SECONDARY_MARKET_FEE;
    const sellerReceives = totalCost - fee;

    // Check buyer has enough balance
    const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
    if (!buyer) return res.status(404).json({ error: "Alıcı bulunamadı" });
    if (buyer.walletBalance < totalCost) {
      return res.status(422).json({ error: `Yetersiz bakiye. Gerekli: ₺${totalCost.toFixed(2)}, Mevcut: ₺${buyer.walletBalance.toFixed(2)}` });
    }

    // Check seller still has the tokens
    const sellerHolding = await prisma.tokenHolding.findUnique({
      where: { userId_propertyId: { userId: listing.sellerId, propertyId: listing.propertyId } },
    });
    if (!sellerHolding || sellerHolding.tokens < listing.tokens) {
      return res.status(422).json({ error: "Satıcının token bakiyesi yetersiz" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct buyer balance
      await tx.user.update({
        where: { id: buyerId },
        data: { walletBalance: { decrement: totalCost } },
      });

      // 2. Credit seller (minus fee)
      await tx.user.update({
        where: { id: listing.sellerId },
        data: { walletBalance: { increment: sellerReceives } },
      });

      // 3. Decrement seller token holding
      const updatedSellerHolding = await tx.tokenHolding.update({
        where: { userId_propertyId: { userId: listing.sellerId, propertyId: listing.propertyId } },
        data: { tokens: { decrement: listing.tokens } },
      });
      // Remove holding if zero
      if (updatedSellerHolding.tokens <= 0) {
        await tx.tokenHolding.delete({
          where: { userId_propertyId: { userId: listing.sellerId, propertyId: listing.propertyId } },
        });
      }

      // 4. Upsert buyer token holding
      await tx.tokenHolding.upsert({
        where: { userId_propertyId: { userId: buyerId, propertyId: listing.propertyId } },
        update: {
          tokens: { increment: listing.tokens },
          currentValue: { increment: listing.tokens * listing.pricePerToken },
          updatedAt: new Date(),
        },
        create: {
          userId: buyerId,
          propertyId: listing.propertyId,
          tokens: listing.tokens,
          purchasePrice: listing.pricePerToken,
          currentValue: listing.tokens * listing.pricePerToken,
        },
      });

      // 5. Create buyer transaction (TOKEN_PURCHASE on secondary)
      await tx.transaction.create({
        data: {
          userId: buyerId,
          type: "TOKEN_PURCHASE",
          amount: totalCost,
          propertyId: listing.propertyId,
          tokens: listing.tokens,
          fee,
          status: "CONFIRMED",
          description: `İkincil piyasa: ${listing.property.nameTr || listing.property.name} - ${listing.tokens} token`,
        },
      });

      // 6. Create seller transaction (TOKEN_SALE)
      await tx.transaction.create({
        data: {
          userId: listing.sellerId,
          type: "TOKEN_SALE",
          amount: sellerReceives,
          propertyId: listing.propertyId,
          tokens: listing.tokens,
          fee,
          status: "CONFIRMED",
          description: `İkincil piyasa satış: ${listing.property.nameTr || listing.property.name} - ${listing.tokens} token`,
        },
      });

      // 7. Platform fee transaction
      await tx.transaction.create({
        data: {
          userId: buyerId,
          type: "PLATFORM_FEE",
          amount: fee,
          propertyId: listing.propertyId,
          fee,
          status: "CONFIRMED",
          description: `İkincil piyasa komisyon (%${SECONDARY_MARKET_FEE * 100})`,
        },
      });

      // 8. Mark listing as SOLD
      await tx.marketListing.update({ where: { id }, data: { status: "SOLD" } });

      // 9. Audit log
      await tx.auditLog.create({
        data: {
          userId: buyerId,
          propertyId: listing.propertyId,
          action: "SECONDARY_MARKET_PURCHASE",
          details: { listingId: id, tokens: listing.tokens, pricePerToken: listing.pricePerToken, fee },
        },
      });

      return { totalCost, fee, sellerReceives };
    });

    logger.info("Secondary market purchase", { buyerId, listingId: id, tokens: listing.tokens });
    return res.json({
      message: `${listing.tokens} token başarıyla satın alındı`,
      data: { tokens: listing.tokens, totalCost: result.totalCost, fee: result.fee },
    });
  } catch (err) {
    logger.error("buyListing error", { err });
    return res.status(500).json({ error: "Satın alma başarısız" });
  }
}

// GET /api/market/my-listings — seller's own listings
export async function myListings(req: Request, res: Response) {
  const userId = req.user!.id;
  try {
    const listings = await prisma.marketListing.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { id: true, name: true, nameTr: true, location: true } },
      },
    });
    return res.json({ data: listings });
  } catch (err) {
    logger.error("myListings error", { err });
    return res.status(500).json({ error: "İlanlarınız yüklenemedi" });
  }
}
