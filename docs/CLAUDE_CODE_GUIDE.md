# TAPU.IO — Claude Code Başlangıç Kılavuzu

## Proje Özeti
Türkiye'nin ilk gayrimenkul tokenizasyon platformu.
Dubai (VARA lisanslı) üzerinden Türk pazarına giriş.
Mülk sahipleri tapularını devretmeden tokenize eder.
Yatırımcılar ₺100'den başlayan tokenlarla gayrimenkule ortak olur.

---

## Tech Stack Kararları

### Frontend
- React Native (iOS + Android tek codebase)
- Expo (kolay deploy)
- TypeScript
- Zustand (state management)
- React Query (API calls)
- i18n (TR/EN dil desteği)

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL (ana veritabanı)
- Redis (cache + session)
- Prisma (ORM)
- JWT authentication

### Blockchain
- Polygon (düşük gas fee, hızlı)
- Hardhat (smart contract development)
- ethers.js
- OpenZeppelin (güvenli kontrat şablonları)

### Ödeme
- İyzico (TR kullanıcılar)
- Stripe (uluslararası)

### Altyapı
- AWS (EC2 + RDS + S3)
- Docker + Docker Compose
- Nginx reverse proxy
- SSL (Let's Encrypt)

---

## Proje Klasör Yapısı

```
tapu-io/
├── frontend/                 # React Native app
│   ├── src/
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   │   ├── LandingScreen.tsx
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   └── RegisterScreen.tsx
│   │   │   ├── investor/
│   │   │   │   ├── MarketScreen.tsx
│   │   │   │   ├── PropertyDetailScreen.tsx
│   │   │   │   ├── BuyTokenScreen.tsx
│   │   │   │   ├── PortfolioScreen.tsx
│   │   │   │   └── ProfileScreen.tsx
│   │   │   ├── owner/
│   │   │   │   ├── MyPropertiesScreen.tsx
│   │   │   │   ├── AddPropertyScreen.tsx
│   │   │   │   └── EarningsScreen.tsx
│   │   │   └── admin/
│   │   │       ├── DashboardScreen.tsx
│   │   │       ├── PropertiesScreen.tsx
│   │   │       ├── UsersScreen.tsx
│   │   │       └── SettingsScreen.tsx
│   │   ├── components/
│   │   │   ├── PropertyCard.tsx
│   │   │   ├── TokenBuyModal.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── store/
│   │   │   ├── authStore.ts
│   │   │   ├── propertyStore.ts
│   │   │   └── portfolioStore.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── property.service.ts
│   │   │   └── payment.service.ts
│   │   ├── hooks/
│   │   │   ├── useProperties.ts
│   │   │   ├── usePortfolio.ts
│   │   │   └── useAuth.ts
│   │   ├── utils/
│   │   │   ├── formatCurrency.ts
│   │   │   └── calculateReturn.ts
│   │   ├── i18n/
│   │   │   ├── tr.json
│   │   │   └── en.json
│   │   └── types/
│   │       ├── property.types.ts
│   │       ├── user.types.ts
│   │       └── token.types.ts
│   ├── app.json
│   └── package.json
│
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── property.routes.ts
│   │   │   ├── token.routes.ts
│   │   │   ├── payment.routes.ts
│   │   │   └── admin.routes.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── property.controller.ts
│   │   │   ├── token.controller.ts
│   │   │   ├── payment.controller.ts
│   │   │   └── admin.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── kyc.middleware.ts
│   │   │   └── rateLimit.middleware.ts
│   │   ├── services/
│   │   │   ├── blockchain.service.ts
│   │   │   ├── iyzico.service.ts
│   │   │   ├── kyc.service.ts
│   │   │   ├── masak.service.ts
│   │   │   └── notification.service.ts
│   │   ├── models/
│   │   │   └── (Prisma schema'dan auto-generate)
│   │   └── utils/
│   │       ├── logger.ts
│   │       └── validators.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── smart-contracts/          # Blockchain
│   ├── contracts/
│   │   ├── TapuToken.sol         # Ana token kontratı
│   │   ├── PropertyRegistry.sol  # Mülk kaydı
│   │   ├── RentDistributor.sol   # Kira dağıtım
│   │   └── SecondaryMarket.sol   # İkincil piyasa
│   ├── scripts/
│   │   ├── deploy.ts
│   │   └── verify.ts
│   ├── test/
│   │   └── TapuToken.test.ts
│   └── hardhat.config.ts
│
└── docs/
    ├── CLAUDE_CODE_GUIDE.md  # Bu dosya
    ├── API.md
    ├── BUSINESS_LOGIC.md
    └── DEPLOYMENT.md
```

---

## Veritabanı Şeması (Prisma)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  phone         String?
  name          String
  role          Role     @default(INVESTOR)
  kycStatus     KYCStatus @default(PENDING)
  kycScore      Int?
  walletAddress String?
  balance       Float    @default(0)
  createdAt     DateTime @default(now())
  
  portfolio     TokenHolding[]
  transactions  Transaction[]
  properties    Property[]     @relation("PropertyOwner")
}

model Property {
  id              String   @id @default(cuid())
  name            String
  nameTr          String
  location        String
  type            PropertyType
  value           Float
  totalTokens     Int
  tokenPrice      Float
  soldTokens      Int      @default(0)
  monthlyRent     Float
  annualYield     Float
  status          PropertyStatus @default(PENDING)
  hasReserveFund  Boolean  @default(false)
  reserveFundPct  Float    @default(0)
  contractUrl     String?
  tapuSherhUrl    String?
  blockchainAddress String?
  
  ownerId         String
  owner           User     @relation("PropertyOwner", fields: [ownerId], references: [id])
  holdings        TokenHolding[]
  rentPayments    RentPayment[]
  createdAt       DateTime @default(now())
}

model TokenHolding {
  id           String   @id @default(cuid())
  userId       String
  propertyId   String
  tokens       Int
  purchasePrice Float
  purchaseDate DateTime @default(now())
  
  user         User     @relation(fields: [userId], references: [id])
  property     Property @relation(fields: [propertyId], references: [id])
}

model Transaction {
  id          String   @id @default(cuid())
  userId      String
  type        TxType
  amount      Float
  propertyId  String?
  tokens      Int?
  status      TxStatus @default(PENDING)
  txHash      String?
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
}

model RentPayment {
  id          String   @id @default(cuid())
  propertyId  String
  amount      Float
  period      String   // "2026-05"
  distributed Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  property    Property @relation(fields: [propertyId], references: [id])
}

enum Role {
  INVESTOR
  OWNER
  ADMIN
}

enum KYCStatus {
  PENDING
  APPROVED
  REJECTED
}

enum PropertyType {
  RESIDENTIAL
  COMMERCIAL
  LAND
  HOTEL
}

enum PropertyStatus {
  PENDING
  APPROVED
  ACTIVE
  SOLD
  REJECTED
}

enum TxType {
  TOKEN_PURCHASE
  TOKEN_SALE
  RENT_INCOME
  WITHDRAWAL
  DEPOSIT
}

enum TxStatus {
  PENDING
  CONFIRMED
  FAILED
}
```

---

## Smart Contract Özeti

```solidity
// TapuToken.sol — ERC-1155 (her mülk farklı token ID)
// PropertyRegistry.sol — Mülk kaydı ve şerh bilgisi
// RentDistributor.sol — Aylık kira otomatik dağıtım
// SecondaryMarket.sol — Token alım-satım
```

---

## API Endpoint Listesi

```
AUTH
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/kyc
GET    /api/auth/me

PROPERTIES
GET    /api/properties          # Tüm aktif mülkler
GET    /api/properties/:id      # Mülk detayı
POST   /api/properties          # Yeni mülk ekle (owner)
PUT    /api/properties/:id      # Mülk güncelle
GET    /api/properties/:id/tokens # Token bilgisi

TOKENS
POST   /api/tokens/buy          # Token satın al
POST   /api/tokens/sell         # Token sat (ikincil)
GET    /api/tokens/portfolio    # Kullanıcı portföyü
GET    /api/tokens/history      # İşlem geçmişi

PAYMENTS
POST   /api/payments/deposit    # Para yatır (İyzico)
POST   /api/payments/withdraw   # Para çek
GET    /api/payments/history    # Ödeme geçmişi

ADMIN
GET    /api/admin/dashboard     # Platform istatistikleri
GET    /api/admin/users         # Kullanıcı listesi
PUT    /api/admin/properties/:id/approve  # Mülk onayla
PUT    /api/admin/users/:id/kyc          # KYC onayla
GET    /api/admin/revenue       # Gelir raporu
```

---

## İş Mantığı Kuralları

```
TOKEN SATIN ALMA:
1. Kullanıcı KYC onaylı olmalı
2. Yeterli bakiye olmalı
3. Mülk aktif ve token mevcut olmalı
4. İşlem blockchain'e yazılır
5. Platform %2.5 komisyon keser
6. Bakiye güncellenir

KİRA DAĞITIMI (aylık otomatik):
1. Mülk sahibi kira bildirir
2. Admin onaylar
3. Her token sahibine oransal dağıtım
4. Platform %1 yönetim ücreti keser
5. Blockchain kaydı tutulur

MÜLK SATIŞI:
1. Token sahiplerinin %75 onayı şart
2. Bağımsız değerleme raporu
3. Satış geliri oransal dağıtım
4. Platform %1 satış komisyonu
5. Tokenlar sonlandırılır

REZERV FON:
1. Token satışının %10'u ayrılır
2. Kira boşluğunda kullanılır
3. 3 ayı geçen boşlukta token sahipleri bilgilendirilir
```

---

## Öncelikli Geliştirme Sırası

```
SPRINT 1 (1-2 hafta):
☐ Backend kurulum + DB
☐ Auth sistemi (register/login/JWT)
☐ KYC akışı (basit versiyon)
☐ Property CRUD

SPRINT 2 (2-3 hafta):
☐ Token satın alma akışı
☐ Portföy görüntüleme
☐ İyzico entegrasyonu
☐ Admin paneli temel

SPRINT 3 (3-4 hafta):
☐ React Native frontend
☐ TR/EN dil desteği
☐ Push notification
☐ Smart contract deploy (testnet)

SPRINT 4 (4-5 hafta):
☐ İkincil piyasa
☐ Kira dağıtım sistemi
☐ Raporlama + dashboard
☐ Güvenlik testleri

SPRINT 5 (5-6 hafta):
☐ Mainnet deploy
☐ Beta test (10 kullanıcı)
☐ Bug fix
☐ Lansman
```

---

## Claude Code'a Verilecek İlk Komutlar

Claude Code'u açtığında sırasıyla şunları söyle:

**1. Backend başlat:**
```
"Create a Node.js TypeScript Express backend for TAPU.IO 
real estate tokenization platform. Use Prisma with PostgreSQL. 
Include auth with JWT, KYC middleware, and these models: 
User, Property, TokenHolding, Transaction, RentPayment. 
Follow the schema in CLAUDE_CODE_GUIDE.md"
```

**2. Frontend başlat:**
```
"Create a React Native Expo TypeScript app for TAPU.IO. 
Three user roles: investor, owner, admin. 
TR/EN language support with i18n. 
Start with auth screens and investor market screen."
```

**3. Smart contracts:**
```
"Create Hardhat TypeScript project. 
Implement ERC-1155 TapuToken contract for real estate tokenization. 
Each property has unique token ID. 
Include RentDistributor for automatic monthly rent distribution."
```

---

## Önemli Notlar

1. **Blockchain kelimesini frontend'de kullanma** — "Dijital Tapu Sistemi" kullan
2. **Token yerine "Pay"** kullanabilirsin Türkçe'de — daha anlaşılır
3. **KYC zorunlu** — token almadan önce kimlik doğrulama şart
4. **Her mülk için bağımsız değerleme** — hukuki koruma için
5. **MASAK uyumu** — şüpheli işlem raporlama sistemi kur
6. **Rezerv fon** — her tokenizasyonda %10 ayrı hesapta tut
7. **Audit log** — her işlem değiştirilemez şekilde kaydedilmeli

---

## Başarı Kriterleri (MVP)

- [ ] Kullanıcı kayıt + KYC
- [ ] Mülk listeleme + onay
- [ ] Token satın alma
- [ ] Portföy görüntüleme
- [ ] Aylık kira dağıtımı
- [ ] Admin paneli
- [ ] TR/EN dil desteği
- [ ] İyzico ödeme entegrasyonu
- [ ] Mobil (iOS + Android)
