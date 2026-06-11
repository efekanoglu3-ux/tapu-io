// Express Request nesnesine `user` alanı ekler
// import/export YOK — ambient declaration olarak global geçerli olur

declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      phone: string | null;
      name: string;
      role: string;
      kycStatus: string;
      kycScore: number | null;
      walletAddress: string | null;
      walletBalance: number;
      masak: string;
      language: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }
}
