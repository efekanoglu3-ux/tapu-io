# TAPU.IO — Başlatma Kılavuzu

## Gereksinimler
- Node.js (nodejs.org) ✅
- Docker Desktop (docker.com) ✅

---

## Her Oturum Başında (3 terminal aç)

### Terminal 1 — Veritabanı
```cmd
cd C:\Users\efeka\OneDrive\Desktop\Dosyalar\CODE\tapu-io
docker compose up -d postgres redis
```
> Postgres + Redis container'larını başlatır. Bir kez açık kaldıktan sonra bilgisayar kapanana kadar çalışmaya devam eder.

---

### Terminal 2 — Backend API
```cmd
cd C:\Users\efeka\OneDrive\Desktop\Dosyalar\CODE\tapu-io\backend
npm run dev
```
> `TAPU.IO Backend running on port 3000` yazısını görünce hazır.

---

### Terminal 3 — Frontend Web
```cmd
cd C:\Users\efeka\OneDrive\Desktop\Dosyalar\CODE\tapu-io\frontend
npm run web
```
> Tarayıcıda `localhost:8081` otomatik açılır.

---

## İlk Kurulum (sadece bir kez)

```cmd
cd C:\Users\efeka\OneDrive\Desktop\Dosyalar\CODE\tapu-io

:: Veritabanını başlat
docker compose up -d postgres redis

:: Backend bağımlılıkları
cd backend
npm install

:: Veritabanı tablolarını oluştur ve client oluştur
npx prisma generate
npx prisma migrate dev --name init

:: Frontend bağımlılıkları
cd ..\frontend
npm install --legacy-peer-deps
npx expo install react-native-web react-dom
```

> ⚠️ Eğer yeni migration yapıldıysa (ikincil piyasa için) çalıştır:
> ```cmd
> cd backend
> npx prisma migrate dev --name add-market-listings
> ```

---

## Kapanırken

Docker'ı durdurmak istersen:
```cmd
cd C:\Users\efeka\OneDrive\Desktop\Dosyalar\CODE\tapu-io
docker compose down
```
> Verileri silmez, sadece container'ları durdurur.

---

## Test Hesapları (Prisma Studio'dan oluşturuldu)

| E-posta | Şifre | Rol |
|---|---|---|
| test@tapu.io | Test1234 | INVESTOR |
| admin@tapu.io | Admin1234 | ADMIN |

---

## Prisma Studio (Veritabanı Görsel Arayüzü)

```cmd
cd C:\Users\efeka\OneDrive\Desktop\Dosyalar\CODE\tapu-io\backend
npx prisma studio
```
> `localhost:5555` adresinde açılır. Tabloları görsel olarak düzenleyebilirsin.

---

## API Test Komutları (PowerShell)

### Login ve token al:
```powershell
$r = Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/auth/login" -ContentType "application/json" -Body '{"email":"test@tapu.io","password":"Test1234"}'
$token = $r.token
```

### Bakiye yükle:
```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/payments/deposit" -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body '{"amount":5000}'
```

### Portföyü gör:
```powershell
Invoke-RestMethod -Method GET -Uri "http://localhost:3000/api/tokens/portfolio" -Headers @{Authorization="Bearer $token"}
```

### Mülkleri listele:
```powershell
Invoke-RestMethod -Method GET -Uri "http://localhost:3000/api/properties"
```

---

## Proje Klasör Yapısı

```
tapu-io/
├── backend/          → Node.js API (port 3000)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts     → register, login, me, kyc
│   │   │   ├── property.controller.ts → CRUD + listeleme
│   │   │   ├── token.controller.ts    → buy, portfolio, history
│   │   │   ├── payment.controller.ts  → deposit, withdraw
│   │   │   ├── admin.controller.ts    → dashboard, users, approve
│   │   │   ├── rent.controller.ts     → distribute, history, investor income
│   │   │   └── market.controller.ts   → listings, buy, sell (ikincil piyasa)
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── property.routes.ts
│   │   │   ├── token.routes.ts
│   │   │   ├── payment.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   ├── rent.routes.ts
│   │   │   └── market.routes.ts
│   │   ├── middleware/     → authenticate, requireRole, requireKYC, rateLimit
│   │   ├── lib/prisma.ts
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma   → User, Property, TokenHolding, Transaction,
│   │                          RentPayment, MarketListing, AuditLog, PlatformSettings
│   └── .env
│
├── frontend/         → Expo Web (port 8081)
│   └── app/
│       ├── index.tsx                     → Landing sayfası
│       ├── (auth)/                       → Login, Register
│       ├── (investor)/
│       │   ├── (tabs)/                   → Market, Portföy, Profil
│       │   ├── property-detail.tsx       → Mülk detay + token satın alma
│       │   └── secondary-market.tsx      → İkincil piyasa (token al/sat)
│       └── (admin)/
│           ├── dashboard.tsx             → İstatistikler + son işlemler
│           ├── users.tsx                 → KYC onay/ret
│           ├── properties.tsx            → Mülk onay/ret
│           └── rent.tsx                  → Kira dağıtımı
│
├── docker-compose.yml  → Postgres + Redis
└── STARTUP.md          → Bu dosya
```

---

## Aktif API Endpoint'leri

```
AUTH
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/kyc

PROPERTIES
GET    /api/properties
GET    /api/properties/:id
POST   /api/properties        (OWNER/ADMIN)
PUT    /api/properties/:id    (OWNER/ADMIN)
GET    /api/properties/:id/tokens

TOKENS
POST   /api/tokens/buy        (KYC gerekli)
GET    /api/tokens/portfolio
GET    /api/tokens/history

PAYMENTS
POST   /api/payments/deposit
POST   /api/payments/withdraw
GET    /api/payments/history

RENT (investor)
GET    /api/rent/my-income

SECONDARY MARKET
GET    /api/market             → aktif ilanları listele
POST   /api/market/list        (KYC) → ilan oluştur
POST   /api/market/:id/buy     (KYC) → token satın al
DELETE /api/market/:id         → ilanı iptal et
GET    /api/market/my-listings → kendi ilanlarım

ADMIN
GET    /api/admin/dashboard
GET    /api/admin/users
PUT    /api/admin/users/:id/kyc
PUT    /api/admin/properties/:id/approve
GET    /api/admin/revenue
POST   /api/admin/rent/distribute
GET    /api/admin/rent/payments
GET    /api/admin/rent/active-properties
```

---

## Admin Girişi

Admin kullanıcısıyla login yaptığında otomatik olarak Admin Paneli'ne yönlendirilirsin.
Normal kullanıcı profilinde `⚙️ Admin Paneli` butonu görünür.

```
Admin Panel Sekmeleri:
📊 Dashboard  — istatistikler, son işlemler
👥 Kullanıcılar — KYC onayla/reddet
🏠 Mülkler    — mülk onayla/reddet
💸 Kira       — mülk bazında aylık kira dağıt
```

---

## Sorun Giderme

**Backend başlamıyor:**
```cmd
docker compose up -d postgres redis
```
Postgres çalışmıyorsa backend .env'deki DATABASE_URL'e bağlanamaz.

**npm/npx tanınmıyor (PowerShell):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Frontend bağımlılık hatası:**
```cmd
npm install --legacy-peer-deps
```

**Veritabanı sıfırla (dikkat: tüm veri silinir):**
```cmd
npx prisma migrate reset
```
