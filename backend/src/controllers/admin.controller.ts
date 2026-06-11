import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";

// GET /api/admin/dashboard
export async function dashboard(req: Request, res: Response) {
  try {
    const [
      totalUsers, kycPending, totalProperties, activeProperties,
      pendingProperties, totalTransactions, recentTx,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { kycStatus: "IN_REVIEW" } }),
      prisma.property.count(),
      prisma.property.count({ where: { status: "ACTIVE" } }),
      prisma.property.count({ where: { status: "PENDING" } }),
      prisma.transaction.count({ where: { status: "CONFIRMED" } }),
      prisma.transaction.findMany({
        take: 10, orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    const volumeResult = await prisma.transaction.aggregate({
      where: { status: "CONFIRMED", type: "TOKEN_PURCHASE" },
      _sum: { amount: true },
    });

    return res.json({
      data: {
        users: { total: totalUsers, kycPending },
        properties: { total: totalProperties, active: activeProperties, pending: pendingProperties },
        transactions: { total: totalTransactions, volume: volumeResult._sum.amount ?? 0 },
        recentTransactions: recentTx,
      },
    });
  } catch (err) {
    logger.error("admin dashboard error", { err });
    return res.status(500).json({ error: "Dashboard yüklenemedi" });
  }
}

// GET /api/admin/users
export async function listUsers(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
  const skip = (page - 1) * limit;
  const kycStatus = req.query.kycStatus as string | undefined;

  const where = kycStatus ? { kycStatus: kycStatus as any } : {};

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, email: true, name: true, phone: true,
          role: true, kycStatus: true, masak: true,
          walletBalance: true, createdAt: true,
          _count: { select: { portfolio: true, transactions: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    return res.json({ data: users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    logger.error("listUsers error", { err });
    return res.status(500).json({ error: "Kullanıcılar yüklenemedi" });
  }
}

// PUT /api/admin/users/:id/kyc
export async function approveKYC(req: Request, res: Response) {
  const { id } = req.params;
  const { action, kycScore } = req.body; // action: "approve" | "reject"
  const adminId = req.user!.id;

  if (!["approve", "reject"].includes(action)) {
    return res.status(422).json({ error: "Geçersiz işlem. 'approve' veya 'reject' olmalı" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    const updated = await prisma.user.update({
      where: { id },
      data: {
        kycStatus: action === "approve" ? "APPROVED" : "REJECTED",
        ...(kycScore !== undefined && { kycScore }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: `KYC_${action.toUpperCase()}`,
        details: { targetUserId: id, kycScore },
        ipAddress: req.ip,
      },
    });

    logger.info(`KYC ${action}d`, { adminId, userId: id });
    return res.json({ message: `KYC ${action === "approve" ? "onaylandı" : "reddedildi"}`, kycStatus: updated.kycStatus });
  } catch (err) {
    logger.error("approveKYC error", { err });
    return res.status(500).json({ error: "KYC güncellenemedi" });
  }
}

// PUT /api/admin/properties/:id/approve
export async function approveProperty(req: Request, res: Response) {
  const { id } = req.params;
  const { action } = req.body; // action: "approve" | "reject"
  const adminId = req.user!.id;

  if (!["approve", "reject"].includes(action)) {
    return res.status(422).json({ error: "Geçersiz işlem. 'approve' veya 'reject' olmalı" });
  }

  try {
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return res.status(404).json({ error: "Mülk bulunamadı" });

    const updated = await prisma.property.update({
      where: { id },
      data: { status: action === "approve" ? "ACTIVE" : "REJECTED" },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        propertyId: id,
        action: `PROPERTY_${action.toUpperCase()}`,
        ipAddress: req.ip,
      },
    });

    logger.info(`Property ${action}d`, { adminId, propertyId: id });
    return res.json({ message: `Mülk ${action === "approve" ? "onaylandı ve aktife alındı" : "reddedildi"}`, status: updated.status });
  } catch (err) {
    logger.error("approveProperty error", { err });
    return res.status(500).json({ error: "Mülk güncellenemedi" });
  }
}

// GET /api/admin/revenue
export async function revenue(req: Request, res: Response) {
  try {
    const [tokenFees, managementFees, byMonth] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: "PLATFORM_FEE", status: "CONFIRMED" },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: "PLATFORM_FEE", status: "CONFIRMED" },
        _sum: { fee: true },
      }),
      prisma.transaction.groupBy({
        by: ["createdAt"],
        where: { status: "CONFIRMED", type: "TOKEN_PURCHASE" },
        _sum: { amount: true, fee: true },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);

    return res.json({
      data: {
        totalFees: tokenFees._sum.amount ?? 0,
        managementFees: managementFees._sum.fee ?? 0,
        byMonth,
      },
    });
  } catch (err) {
    logger.error("revenue error", { err });
    return res.status(500).json({ error: "Gelir raporu yüklenemedi" });
  }
}
