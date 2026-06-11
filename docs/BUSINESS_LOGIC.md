# TAPU.IO — İş Mantığı Dokümantasyonu

## Platform Komisyon Yapısı

| Kalem                  | Oran       | Tetikleyici              |
|------------------------|------------|--------------------------|
| Listeleme ücreti       | ₺7.500     | Mülk listelenince        |
| Token satış komisyonu  | %2.5       | İlk token ihracında      |
| Yönetim ücreti         | %1/yıl     | Aylık otomatik           |
| İkincil piyasa         | %1         | Token el değiştirince    |
| Mülk satış komisyonu   | %1         | Mülk satılırsa           |

---

## Token Satın Alma Akışı

```
1. Kullanıcı token sayısı girer
2. KYC kontrolü → APPROVED olmalı
3. MASAK kontrolü → CLEAR olmalı
4. Bakiye kontrolü → yeterli olmalı
5. Token müsaitlik kontrolü → soldTokens < totalTokens
6. Platform komisyonu hesaplanır (%2.5)
7. Kullanıcı bakiyesinden düşülür
8. soldTokens güncellenir
9. TokenHolding oluşturulur veya güncellenir
10. Transaction kaydı oluşturulur
11. Blockchain'e yazılır (async)
12. AuditLog kaydedilir
13. Kullanıcıya bildirim gönderilir
```

## Kira Dağıtım Akışı (Aylık)

```
1. Mülk sahibi kira ödemesini sisteme girer
2. Admin onaylar
3. Platform yönetim ücreti (%1 yıllık / 12) kesilir
4. Rezerv fon payı ayrılır (varsa)
5. Kalan miktar token sahiplerine dağıtılır
   → Her sahip: (kendi_token / total_token) * net_kira
6. Her kullanıcının bakiyesi güncellenir
7. Transaction kayıtları oluşturulur
8. RentPayment.distributed = true
9. Blockchain kaydı (async)
10. Tüm token sahiplerine bildirim
```

## Mülk Satışı Akışı

```
1. Mülk sahibi satış talebi oluşturur
2. Token sahiplerine oylama bildirimi gider
3. %75 onay gerekli (token ağırlıklı oy)
4. Bağımsız değerleme raporu yüklenir
5. Satış gerçekleşir
6. Platform komisyonu (%1) kesilir
7. Kalan gelir oransal dağıtılır
8. TokenHolding'ler silinir
9. Property.status = SOLD
10. Tokenlar blockchain'de sonlandırılır
```

## KYC Seviyeleri

```
LEVEL 0 — Kayıtsız: Sadece mülklere bakabilir
LEVEL 1 — Email doğrulama: Platform üye olabilir
LEVEL 2 — TC Kimlik + Selfie: ₺50.000'e kadar token alabilir
LEVEL 3 — Gelir belgesi + Banka: Sınırsız token alabilir
LEVEL 4 — Nitelikli Yatırımcı: Özel mülklere erişim
```

## Rezerv Fon Mantığı

```
hasReserveFund = true olan mülkler:
- Token fiyatı %10-15 daha yüksek
- Token satışının %10'u rezerv hesaba alınır
- Kira boşluğunda rezervden ödeme yapılır
- Rezerv 3 ayı karşılar
- 3 ayı geçerse token sahipleri bilgilendirilir
- Rezerv dolduğunda normal gelir dağıtımı devam eder
```

## İkincil Piyasa Kuralları

```
- Minimum satış fiyatı: Token başına ₺80 (orijinal fiyatın %80'i)
- Maksimum satış fiyatı: Mevcut piyasa değerinin %150'si
- Platform %1 komisyon alır (alıcıdan)
- İşlem anında gerçekleşir
- Blockchain transferi async olarak yazılır
- Lock-up süresi: Satın alımdan 90 gün sonra satılabilir
```

## MASAK Uyum Kuralları

```
Şüpheli işlem kriterleri:
- 24 saatte ₺50.000+ işlem
- Farklı IP'lerden hızlı işlemler
- KYC bilgisiyle uyumsuz işlem hacmi
- Yüksek riskli ülkeden erişim

REVIEW durumunda:
- İşlemler dondurulur
- Admin incelemesi gerekir
- 48 saat içinde karar verilir

BLOCKED durumunda:
- Hesap dondurulur
- MASAK'a bildirim yapılır
```

## Platform Güvence Yapısı

```
Her mülk için:
1. Tapu şerhi (Türk Medeni Kanunu m.1009)
2. Noter onaylı sözleşme
3. Bağımsız değerleme raporu
4. Kira güvence sigortası (opsiyonel)
5. Rezerv fon (opsiyonel)
6. Blockchain kaydı (değiştirilemez)
7. Aylık bağımsız denetim raporu
```
