// ── USER TYPES ───────────────────────────────────────────────────────────────
export type UserRole = "INVESTOR" | "OWNER" | "ADMIN";
export type KYCStatus = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";
export type MASAKStatus = "CLEAR" | "REVIEW" | "BLOCKED";

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: UserRole;
  kycStatus: KYCStatus;
  kycScore?: number;
  walletBalance: number;
  masak: MASAKStatus;
  language: "tr" | "en";
  createdAt: string;
}

// ── PROPERTY TYPES ───────────────────────────────────────────────────────────
export type PropertyType = "RESIDENTIAL" | "COMMERCIAL" | "LAND" | "HOTEL";
export type PropertyStatus = "PENDING" | "APPROVED" | "ACTIVE" | "SOLD" | "REJECTED";

export interface Property {
  id: string;
  name: string;
  nameTr: string;
  location: string;
  type: PropertyType;
  description?: string;
  descriptionTr?: string;
  value: number;
  totalTokens: number;
  tokenPrice: number;
  soldTokens: number;
  availableTokens: number; // computed: totalTokens - soldTokens
  monthlyRent: number;
  annualYield: number;
  status: PropertyStatus;
  hasReserveFund: boolean;
  reserveFundPct: number;
  occupancyRate: number;
  images: string[];
  sqm?: number;
  yearBuilt?: number;
  owner: User;
  createdAt: string;
}

// ── TOKEN TYPES ───────────────────────────────────────────────────────────────
export interface TokenHolding {
  id: string;
  propertyId: string;
  property: Property;
  tokens: number;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: string;
  ownershipPct: number; // computed: tokens / totalTokens
  monthlyIncome: number; // computed
}

// ── TRANSACTION TYPES ────────────────────────────────────────────────────────
export type TxType =
  | "TOKEN_PURCHASE"
  | "TOKEN_SALE"
  | "RENT_INCOME"
  | "WITHDRAWAL"
  | "DEPOSIT"
  | "PLATFORM_FEE"
  | "RESERVE_FUND"
  | "PROPERTY_SALE";

export type TxStatus = "PENDING" | "CONFIRMED" | "FAILED" | "CANCELLED";

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  propertyId?: string;
  property?: Property;
  tokens?: number;
  fee: number;
  status: TxStatus;
  txHash?: string;
  description?: string;
  createdAt: string;
}

// ── API TYPES ────────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface BuyTokenRequest {
  propertyId: string;
  tokenAmount: number;
}

export interface BuyTokenResponse {
  transaction: Transaction;
  holding: TokenHolding;
  newBalance: number;
}

// ── FINANCIAL CALCULATION TYPES ──────────────────────────────────────────────
export interface ReturnCalculation {
  investment: number;
  ownershipPct: number;
  year1Rent: number;
  year2Rent: number;
  year3Rent: number;
  totalRent: number;
  exitValue: number;
  capitalGain: number;
  totalReturn: number;
  roi: number;
  annualROI: number;
}
