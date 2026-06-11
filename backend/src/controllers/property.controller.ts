import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";

// GET /api/properties
export async function listProperties(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { status: "ACTIVE" };
  if (req.query.type) where.type = req.query.type;
  if (req.query.minYield) where.annualYield = { gte: parseFloat(req.query.minYield as string) };
  if (req.query.maxPrice) where.tokenPrice = { lte: parseFloat(req.query.maxPrice as string) };

  try {
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          nameTr: true,
          location: true,
          type: true,
          value: true,
          totalTokens: true,
          tokenPrice: true,
          soldTokens: true,
          monthlyRent: true,
          annualYield: true,
          status: true,
          images: true,
          sqm: true,
          yearBuilt: true,
          occupancyRate: true,
          createdAt: true,
        },
      }),
      prisma.property.count({ where }),
    ]);

    return res.json({
      data: properties,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error("listProperties error", { err });
    return res.status(500).json({ error: "Mülkler yüklenirken hata oluştu" });
  }
}

// GET /api/properties/:id
export async function getProperty(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, createdAt: true },
        },
        _count: { select: { holdings: true } },
      },
    });

    if (!property || property.status === "REJECTED") {
      return res.status(404).json({ error: "Mülk bulunamadı" });
    }

    // Non-admin kullanıcılar sadece aktif mülkleri görebilir
    if (property.status !== "ACTIVE" && req.user?.role !== "ADMIN") {
      if (req.user?.id !== property.ownerId) {
        return res.status(404).json({ error: "Mülk bulunamadı" });
      }
    }

    return res.json({ data: property });
  } catch (err) {
    logger.error("getProperty error", { err, id });
    return res.status(500).json({ error: "Mülk yüklenirken hata oluştu" });
  }
}

// POST /api/properties  (sadece OWNER veya ADMIN)
export async function createProperty(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const ownerId = req.user!.id;
  const {
    name, nameTr, location, type, value, totalTokens, tokenPrice,
    monthlyRent, annualYield, description, descriptionTr,
    sqm, yearBuilt, images = [],
  } = req.body;

  // tokenPrice * totalTokens değerle tutarlı olmalı (±%5 tolerans)
  const impliedValue = tokenPrice * totalTokens;
  if (Math.abs(impliedValue - value) / value > 0.05) {
    return res.status(422).json({
      error: "tokenPrice × totalTokens, value ile uyuşmuyor (max %5 fark kabul edilir)",
    });
  }

  try {
    const property = await prisma.property.create({
      data: {
        name, nameTr, location, type, value, totalTokens, tokenPrice,
        monthlyRent, annualYield, description, descriptionTr,
        sqm, yearBuilt, images,
        hasReserveFund: true,
        reserveFundPct: 0.10,
        ownerId,
        status: "PENDING",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: ownerId,
        propertyId: property.id,
        action: "PROPERTY_CREATED",
        details: { name, type, value },
        ipAddress: req.ip,
      },
    });

    logger.info("Property created", { propertyId: property.id, ownerId });
    return res.status(201).json({ data: property });
  } catch (err) {
    logger.error("createProperty error", { err });
    return res.status(500).json({ error: "Mülk oluşturulurken hata oluştu" });
  }
}

// PUT /api/properties/:id
export async function updateProperty(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  try {
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return res.status(404).json({ error: "Mülk bulunamadı" });

    // Sadece sahibi veya admin güncelleyebilir
    if (property.ownerId !== userId && userRole !== "ADMIN") {
      return res.status(403).json({ error: "Bu mülkü güncelleme yetkiniz yok" });
    }

    // Aktif mülklerde kritik alanlar değiştirilemez
    const isActive = property.status === "ACTIVE";
    const {
      name, nameTr, location, monthlyRent, annualYield,
      description, descriptionTr, contractUrl, tapuSherhUrl, valuationReportUrl,
      images,
    } = req.body;

    const updateData: Prisma.PropertyUpdateInput = {
      ...(name && !isActive && { name }),
      ...(nameTr && !isActive && { nameTr }),
      ...(location && !isActive && { location }),
      ...(monthlyRent !== undefined && { monthlyRent }),
      ...(annualYield !== undefined && { annualYield }),
      ...(description !== undefined && { description }),
      ...(descriptionTr !== undefined && { descriptionTr }),
      ...(contractUrl !== undefined && { contractUrl }),
      ...(tapuSherhUrl !== undefined && { tapuSherhUrl }),
      ...(valuationReportUrl !== undefined && { valuationReportUrl }),
      ...(images !== undefined && { images }),
    };

    const updated = await prisma.property.update({ where: { id }, data: updateData });

    await prisma.auditLog.create({
      data: {
        userId,
        propertyId: id,
        action: "PROPERTY_UPDATED",
        details: JSON.parse(JSON.stringify(updateData)) as Prisma.InputJsonValue,
        ipAddress: req.ip,
      },
    });

    return res.json({ data: updated });
  } catch (err) {
    logger.error("updateProperty error", { err, id });
    return res.status(500).json({ error: "Mülk güncellenirken hata oluştu" });
  }
}

// GET /api/properties/:id/tokens  — token dağılım bilgisi
export async function getPropertyTokens(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const property = await prisma.property.findUnique({
      where: { id },
      select: { id: true, totalTokens: true, soldTokens: true, tokenPrice: true, status: true },
    });

    if (!property || property.status === "REJECTED") {
      return res.status(404).json({ error: "Mülk bulunamadı" });
    }

    const availableTokens = property.totalTokens - property.soldTokens;
    const fundingPct = (property.soldTokens / property.totalTokens) * 100;

    const topHolders = await prisma.tokenHolding.findMany({
      where: { propertyId: id },
      orderBy: { tokens: "desc" },
      take: 10,
      select: {
        tokens: true,
        purchasePrice: true,
        purchaseDate: true,
        user: { select: { id: true, name: true } },
      },
    });

    return res.json({
      data: {
        totalTokens: property.totalTokens,
        soldTokens: property.soldTokens,
        availableTokens,
        tokenPrice: property.tokenPrice,
        fundingPct: Math.round(fundingPct * 100) / 100,
        topHolders,
      },
    });
  } catch (err) {
    logger.error("getPropertyTokens error", { err, id });
    return res.status(500).json({ error: "Token bilgisi yüklenirken hata oluştu" });
  }
}

// GET /api/properties/my  — owner'ın kendi mülkleri
export async function myProperties(req: Request, res: Response) {
  const ownerId = req.user!.id;

  try {
    const properties = await prisma.property.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { holdings: true } } },
    });

    return res.json({ data: properties });
  } catch (err) {
    logger.error("myProperties error", { err });
    return res.status(500).json({ error: "Mülkler yüklenirken hata oluştu" });
  }
}

// GET /api/properties/my/earnings  — owner kazanç özeti
export async function myEarnings(req: Request, res: Response) {
  const ownerId = req.user!.id;

  try {
    const properties = await prisma.property.findMany({
      where: { ownerId },
      select: {
        id: true, name: true, nameTr: true, location: true,
        monthlyRent: true, value: true, soldTokens: true, totalTokens: true,
        status: true, rentPayments: {
          where: { distributed: true },
          orderBy: { createdAt: "desc" },
          take: 6,
        },
        _count: { select: { holdings: true } },
      },
    });

    const totalMonthlyRent = properties
      .filter((p) => p.status === "ACTIVE")
      .reduce((sum, p) => sum + p.monthlyRent, 0);

    const totalValue = properties.reduce((sum, p) => sum + p.value, 0);
    const activeProperties = properties.filter((p) => p.status === "ACTIVE").length;
    const pendingProperties = properties.filter((p) => p.status === "PENDING").length;

    // Son 6 ay kira ödemeleri
    const allRentPayments = await prisma.rentPayment.findMany({
      where: { property: { ownerId }, distributed: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { property: { select: { name: true, nameTr: true } } },
    });

    return res.json({
      data: {
        summary: { totalMonthlyRent, totalValue, activeProperties, pendingProperties, propertyCount: properties.length },
        properties,
        recentRentPayments: allRentPayments,
      },
    });
  } catch (err) {
    logger.error("myEarnings error", { err });
    return res.status(500).json({ error: "Kazanç raporu yüklenirken hata oluştu" });
  }
}
