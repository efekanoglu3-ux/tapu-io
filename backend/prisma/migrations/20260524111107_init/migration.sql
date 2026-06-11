-- CreateEnum
CREATE TYPE "Role" AS ENUM ('INVESTOR', 'OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MASAKStatus" AS ENUM ('CLEAR', 'REVIEW', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'LAND', 'HOTEL');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'SOLD', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TxType" AS ENUM ('TOKEN_PURCHASE', 'TOKEN_SALE', 'RENT_INCOME', 'WITHDRAWAL', 'DEPOSIT', 'PLATFORM_FEE', 'RESERVE_FUND', 'PROPERTY_SALE');

-- CreateEnum
CREATE TYPE "TxStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'INVESTOR',
    "kycStatus" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "kycScore" INTEGER,
    "kycDocuments" JSONB,
    "walletAddress" TEXT,
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "masak" "MASAKStatus" NOT NULL DEFAULT 'CLEAR',
    "language" TEXT NOT NULL DEFAULT 'tr',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameTr" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL,
    "description" TEXT,
    "descriptionTr" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "tokenPrice" DOUBLE PRECISION NOT NULL,
    "soldTokens" INTEGER NOT NULL DEFAULT 0,
    "monthlyRent" DOUBLE PRECISION NOT NULL,
    "annualYield" DOUBLE PRECISION NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'PENDING',
    "hasReserveFund" BOOLEAN NOT NULL DEFAULT false,
    "reserveFundPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reserveFundBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "occupancyRate" DOUBLE PRECISION NOT NULL DEFAULT 0.92,
    "contractUrl" TEXT,
    "tapuSherhUrl" TEXT,
    "valuationReportUrl" TEXT,
    "blockchainAddress" TEXT,
    "tokenId" INTEGER,
    "images" TEXT[],
    "sqm" DOUBLE PRECISION,
    "yearBuilt" INTEGER,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenHolding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenHolding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TxType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "propertyId" TEXT,
    "tokens" INTEGER,
    "fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "TxStatus" NOT NULL DEFAULT 'PENDING',
    "txHash" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentPayment" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "period" TEXT NOT NULL,
    "distributed" BOOLEAN NOT NULL DEFAULT false,
    "distributedAt" TIMESTAMP(3),
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "propertyId" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL,
    "listingFee" DOUBLE PRECISION NOT NULL DEFAULT 7500,
    "tokenSaleCommission" DOUBLE PRECISION NOT NULL DEFAULT 0.025,
    "managementFeeAnnual" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "secondaryMarketFee" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "propertySaleFee" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "minInvestment" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "maxInvestmentNoKYC" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TokenHolding_userId_propertyId_key" ON "TokenHolding"("userId", "propertyId");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenHolding" ADD CONSTRAINT "TokenHolding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenHolding" ADD CONSTRAINT "TokenHolding_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentPayment" ADD CONSTRAINT "RentPayment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
