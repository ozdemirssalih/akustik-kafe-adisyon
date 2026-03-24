# 🎯 AKUSTİK KAFE ADİSYON UYGULAMASI - PROJE PLANI

## 📋 PROJE GENEL BAKIŞ

**Hedef:** Modern, hızlı ve kullanıcı dostu bir kafe/restoran adisyon sistemi

**Tech Stack:**
- Frontend: Next.js 16.2 (App Router)
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Styling: Tailwind CSS 4
- Form Management: React Hook Form + Zod
- Icons: Lucide React
- Deployment: Vercel

**Kullanıcı Profili:**
- Garsonlar (ana kullanıcı)
- Kasa görevlileri
- Yönetici/İşletme sahibi

---

## 🎯 MVP ÖZELLİKLERİ

### 1. Kullanıcı Yönetimi
- ✅ Basit login sistemi (email/password)
- ✅ Rol bazlı erişim (garson, kasa, admin)
- ✅ Kullanıcı profili

### 2. Masa Yönetimi
- ✅ Masa oluşturma/düzenleme/silme
- ✅ Masa durumu (boş, dolu, rezerve)
- ✅ Masa kapasitesi bilgisi
- ✅ Grid layout görünümü

### 3. Ürün/Menü Yönetimi
- ✅ Kategori bazlı ürünler
- ✅ Ürün adı, fiyat, açıklama
- ✅ Stok durumu (varsa)
- ✅ Hızlı ürün arama

### 4. Adisyon İşlemleri
- ✅ Adisyon açma (masaya bağlı)
- ✅ Ürün ekleme (miktar seçimi)
- ✅ Ürün silme/düzenleme
- ✅ Not ekleme (özel istekler)
- ✅ Adisyon özeti görüntüleme

### 5. Hesap/Ödeme
- ✅ Toplam tutar hesaplama
- ✅ Nakit ödeme
- ✅ Kart ödeme
- ✅ Bölünmüş ödeme (opsiyonel)
- ✅ Adisyon kapatma

### 6. Raporlama
- ✅ Günlük satış özeti
- ✅ Kategori bazlı analiz
- ✅ Ödeme yöntemi dağılımı
- ✅ En çok satan ürünler
- ✅ Tarih aralığı filtreleme

### 7. UI/UX
- ✅ Mobil öncelikli tasarım
- ✅ Tablet desteği
- ✅ Touch-friendly büyük butonlar
- ✅ Hızlı erişim için klavye kısayolları
- ✅ Dark mode desteği (opsiyonel)

---

## 🗄️ SUPABASE VERİ MODELİ

### Tables

#### 1. `users` (Supabase Auth + Extended)
```sql
- id (uuid, PK)
- email (text)
- full_name (text)
- role (enum: 'admin', 'cashier', 'waiter')
- is_active (boolean)
- created_at (timestamp)
```

#### 2. `tables` (Masalar)
```sql
- id (uuid, PK)
- table_number (text, unique)
- capacity (integer)
- status (enum: 'available', 'occupied', 'reserved')
- position_x (integer, optional - layout için)
- position_y (integer, optional - layout için)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 3. `categories` (Ürün Kategorileri)
```sql
- id (uuid, PK)
- name (text)
- display_order (integer)
- is_active (boolean)
- created_at (timestamp)
```

#### 4. `products` (Ürünler/Menü)
```sql
- id (uuid, PK)
- category_id (uuid, FK → categories)
- name (text)
- description (text, nullable)
- price (numeric(10,2))
- is_available (boolean)
- image_url (text, nullable)
- display_order (integer)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 5. `orders` (Adisyonlar)
```sql
- id (uuid, PK)
- table_id (uuid, FK → tables)
- waiter_id (uuid, FK → users)
- status (enum: 'open', 'closed', 'cancelled')
- subtotal (numeric(10,2))
- tax_amount (numeric(10,2))
- total_amount (numeric(10,2))
- payment_method (enum: 'cash', 'card', 'split', nullable)
- opened_at (timestamp)
- closed_at (timestamp, nullable)
- created_at (timestamp)
```

#### 6. `order_items` (Adisyon Kalemleri)
```sql
- id (uuid, PK)
- order_id (uuid, FK → orders)
- product_id (uuid, FK → products)
- quantity (integer)
- unit_price (numeric(10,2))
- total_price (numeric(10,2))
- notes (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

### Indexes
```sql
- orders.table_id (for quick table lookup)
- orders.status (for active orders)
- order_items.order_id (for order details)
- products.category_id (for category filtering)
- products.is_available (for menu display)
```

### Row Level Security (RLS) Policies
```sql
- Users: Sadece admin tüm kullanıcıları görebilir
- Tables: Tüm kullanıcılar okuyabilir, admin düzenler
- Products/Categories: Tüm kullanıcılar okur, admin düzenler
- Orders: Kullanıcı kendi açtığı siparişleri görebilir
- Order Items: İlgili sipariş sahibi erişebilir
```

---

## 🏗️ UYGULAMA MİMARİSİ

### Klasör Yapısı
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx (sidebar, header)
│   │   ├── page.tsx (masa grid)
│   │   ├── orders/
│   │   │   ├── [orderId]/
│   │   │   │   └── page.tsx (adisyon detay)
│   │   │   └── new/
│   │   │       └── page.tsx (yeni adisyon)
│   │   ├── menu/
│   │   │   └── page.tsx (ürün yönetimi)
│   │   ├── tables/
│   │   │   └── page.tsx (masa yönetimi)
│   │   ├── reports/
│   │   │   └── page.tsx (raporlar)
│   │   └── settings/
│   │       └── page.tsx (ayarlar)
│   └── api/ (API routes - optional)
├── components/
│   ├── ui/ (shadcn-style reusable components)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── tables/
│   │   ├── table-grid.tsx
│   │   ├── table-card.tsx
│   │   └── table-status-badge.tsx
│   ├── orders/
│   │   ├── order-form.tsx
│   │   ├── order-item-list.tsx
│   │   ├── product-selector.tsx
│   │   └── payment-modal.tsx
│   └── layout/
│       ├── sidebar.tsx
│       ├── header.tsx
│       └── mobile-nav.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── hooks/
│   │   ├── use-tables.ts
│   │   ├── use-orders.ts
│   │   ├── use-products.ts
│   │   └── use-user.ts
│   ├── utils/
│   │   ├── cn.ts (classnames helper)
│   │   ├── currency.ts
│   │   └── date.ts
│   └── types/
│       └── database.types.ts (Supabase generated)
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql
        ├── 002_seed_data.sql
        └── ...
```

### Sayfa Akışı

**1. Login Flow**
```
/login → Auth check → /dashboard (masa grid)
```

**2. Masa Seçimi ve Adisyon Açma**
```
/dashboard → Masa seç → Yeni adisyon → /orders/new?table=X
```

**3. Sipariş Verme**
```
/orders/new → Kategori seç → Ürün seç → Miktar/not → Ekle
→ Sipariş özeti → Onayla → /orders/[orderId]
```

**4. Hesap Kapatma**
```
/orders/[orderId] → Hesap İste → Ödeme yöntemi seç → Onayla
→ Adisyon kapat → Masa durumu güncelle → /dashboard
```

**5. Raporlama**
```
/dashboard → Raporlar → Tarih filtrele → Özet göster
```

---

## 🎨 UI/UX DETAYLARı

### Renk Paleti
```css
- Primary: Blue 600 (adisyon, aksiyon butonları)
- Success: Green 600 (ödeme tamamlandı, boş masa)
- Warning: Orange 500 (rezerve masa)
- Danger: Red 600 (iptal, dolu masa)
- Neutral: Gray scale (arka plan, metin)
```

### Component Stilleri
- **Masa Kartları:**
  - Büyük, touch-friendly (min 80x80px)
  - Durum badge'i (üst köşe)
  - Masa numarası ortada, bold
  - Hover/active states

- **Ürün Seçici:**
  - Grid layout (mobil: 2 kolon, tablet: 3-4 kolon)
  - Görsel + İsim + Fiyat
  - Hızlı ekle butonu

- **Adisyon Detay:**
  - Sticky header (masa no, toplam)
  - Scrollable item list
  - Sticky footer (aksiyon butonları)

### Responsive Breakpoints
```css
- Mobile: < 768px (tek kolon, sidebar collapse)
- Tablet: 768px - 1024px (2 kolon)
- Desktop: > 1024px (3+ kolon, sidebar always visible)
```

---

## 🚀 İMPLEMENTASYON ADIMLARI

### Phase 1: Temel Kurulum (1-2 saat)
1. ✅ Supabase migration'larını yaz ve çalıştır
2. ✅ Supabase client/server utils kur
3. ✅ Auth middleware ve route guard
4. ✅ Temel UI component'leri (button, card, input)
5. ✅ Layout sistemi (sidebar, header)

### Phase 2: Masa Yönetimi (2-3 saat)
1. ✅ Masa grid component
2. ✅ Masa CRUD operations
3. ✅ Masa durumu güncelleme
4. ✅ Masa seçimi ve adisyon bağlantısı

### Phase 3: Ürün/Menü (1-2 saat)
1. ✅ Kategori ve ürün listesi
2. ✅ Ürün yönetimi (CRUD)
3. ✅ Ürün arama/filtreleme

### Phase 4: Adisyon Sistemi (3-4 saat)
1. ✅ Yeni adisyon açma
2. ✅ Ürün ekleme/çıkarma
3. ✅ Not ekleme
4. ✅ Adisyon özeti ve düzenleme
5. ✅ Gerçek zamanlı toplam hesaplama

### Phase 5: Ödeme ve Kapatma (2 saat)
1. ✅ Ödeme modal/form
2. ✅ Ödeme yöntemi seçimi
3. ✅ Adisyon kapatma logic
4. ✅ Masa durumu sync

### Phase 6: Raporlama (2 saat)
1. ✅ Günlük özet hesaplama
2. ✅ Tarih filtreleme
3. ✅ Kategori/ürün bazlı breakdown
4. ✅ Export (opsiyonel)

### Phase 7: Polish & Deploy (1-2 saat)
1. ✅ Responsive optimizasyon
2. ✅ Loading states
3. ✅ Error handling
4. ✅ Toast notifications
5. ✅ Vercel deployment

---

## 📝 SEED DATA

### Kategoriler
- İçecekler
- Kahveler
- Yiyecekler
- Tatlılar

### Örnek Ürünler
- Americano - 45 TL
- Latte - 50 TL
- Filtre Kahve - 40 TL
- Croissant - 35 TL
- Cheesecake - 65 TL

### Örnek Masalar
- Masa 1-10 (Kapasite: 2-4 kişi)

---

## 🎯 BAŞARI KRİTERLERİ

1. ✅ Garson 30 saniye içinde yeni adisyon açabilmeli
2. ✅ Ürün ekleme 3 tıklama ile tamamlanmalı
3. ✅ Hesap kapatma 1 dakika içinde olmalı
4. ✅ Mobil cihazda tam responsive
5. ✅ Offline cache (opsiyonel - future)

---

## 🔒 GÜVENLİK

- ✅ RLS policies aktif
- ✅ Server-side validation
- ✅ Input sanitization
- ✅ HTTPS zorunlu (Vercel default)
- ✅ JWT token management (Supabase)

---

## 📦 DEPLOYMENT

**Vercel:**
1. GitHub repo push
2. Vercel import
3. Environment variables (Supabase keys)
4. Auto deploy on push

**Supabase:**
1. Project oluştur
2. Database setup
3. Migrations çalıştır
4. API keys al

---

## 🔮 FUTURE ENHANCEMENTS

- 📱 PWA support (offline mode)
- 🖨️ Mutfak yazıcı entegrasyonu
- 📊 Gelişmiş analytics
- 👥 Müşteri CRM
- 💳 Online ödeme entegrasyonu
- 🎟️ QR kod menü
- 📱 Müşteri uygulaması (self-order)

---

## ⏱️ TAHMINI SÜRE

**MVP Geliştirme:** 12-15 saat
**Test & Polish:** 3-4 saat
**Deployment:** 1 saat

**TOPLAM:** ~18-20 saat

---

**Sonraki Adım:** Supabase migration'larını oluştur ve implementasyona başla! 🚀
