import { body, query } from "express-validator";

export const registerValidators = [
  body("email").isEmail().normalizeEmail().withMessage("Geçerli bir e-posta girin"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Şifre en az 8 karakter olmalı")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Şifre büyük harf, küçük harf ve rakam içermeli"),
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("İsim 2-100 karakter olmalı"),
  body("phone")
    .optional()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage("Geçerli bir telefon numarası girin"),
  body("role")
    .optional()
    .isIn(["INVESTOR", "OWNER"])
    .withMessage("Geçersiz rol — INVESTOR veya OWNER olmalı"),
];

export const loginValidators = [
  body("email").isEmail().normalizeEmail().withMessage("Geçerli bir e-posta girin"),
  body("password").notEmpty().withMessage("Şifre gerekli"),
];

export const kycValidators = [
  body("idType")
    .isIn(["TC_KIMLIK", "PASSPORT", "DRIVING_LICENSE"])
    .withMessage("Geçersiz kimlik türü"),
  body("idNumber").trim().notEmpty().withMessage("Kimlik numarası gerekli"),
  body("birthDate").isISO8601().withMessage("Geçerli bir doğum tarihi girin (YYYY-MM-DD)"),
  body("nationality").trim().notEmpty().withMessage("Uyruk gerekli"),
  body("address").trim().isLength({ min: 10 }).withMessage("Adres en az 10 karakter olmalı"),
];

export const createPropertyValidators = [
  body("name").trim().isLength({ min: 3, max: 200 }).withMessage("Mülk adı 3-200 karakter olmalı"),
  body("nameTr").trim().isLength({ min: 3, max: 200 }).withMessage("Türkçe mülk adı gerekli"),
  body("location").trim().isLength({ min: 5 }).withMessage("Konum gerekli"),
  body("type")
    .isIn(["RESIDENTIAL", "COMMERCIAL", "LAND", "HOTEL"])
    .withMessage("Geçersiz mülk türü"),
  body("value").isFloat({ min: 100000 }).withMessage("Mülk değeri en az ₺100.000 olmalı"),
  body("totalTokens").isInt({ min: 10, max: 1000000 }).withMessage("Token sayısı 10-1.000.000 arası olmalı"),
  body("tokenPrice").isFloat({ min: 100 }).withMessage("Token fiyatı en az ₺100 olmalı"),
  body("monthlyRent").isFloat({ min: 0 }).withMessage("Aylık kira geçerli bir sayı olmalı"),
  body("annualYield").isFloat({ min: 0, max: 100 }).withMessage("Yıllık getiri %0-100 arası olmalı"),
  body("sqm").optional().isFloat({ min: 1 }).withMessage("Alan (m²) geçerli bir sayı olmalı"),
  body("yearBuilt")
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage("Yapım yılı geçersiz"),
  body("description").optional().trim().isLength({ max: 2000 }),
  body("descriptionTr").optional().trim().isLength({ max: 2000 }),
];

export const updatePropertyValidators = [
  body("name").optional().trim().isLength({ min: 3, max: 200 }),
  body("nameTr").optional().trim().isLength({ min: 3, max: 200 }),
  body("location").optional().trim().isLength({ min: 5 }),
  body("monthlyRent").optional().isFloat({ min: 0 }),
  body("annualYield").optional().isFloat({ min: 0, max: 100 }),
  body("description").optional().trim().isLength({ max: 2000 }),
  body("descriptionTr").optional().trim().isLength({ max: 2000 }),
  body("contractUrl").optional().isURL(),
  body("tapuSherhUrl").optional().isURL(),
  body("valuationReportUrl").optional().isURL(),
];

export const listPropertyQueryValidators = [
  query("type").optional().isIn(["RESIDENTIAL", "COMMERCIAL", "LAND", "HOTEL"]),
  query("minYield").optional().isFloat({ min: 0 }),
  query("maxPrice").optional().isFloat({ min: 0 }),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
];
