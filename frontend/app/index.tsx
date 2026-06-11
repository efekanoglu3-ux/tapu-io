import { useEffect } from "react";
import { useRouter } from "expo-router";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions,
} from "react-native";
import { useAuthStore } from "../src/store/authStore";

const { width } = Dimensions.get("window");
const isWeb = width > 768;

const PROPERTIES = [
  { id: "1", name: "Bağcılar Rezidans", location: "İstanbul", yield: "12.4", price: "500", sold: 72, type: "KONUT" },
  { id: "2", name: "Levent Plaza", location: "İstanbul", yield: "9.8", price: "1200", sold: 45, type: "TİCARİ" },
  { id: "3", name: "Ankara Prime", location: "Ankara", yield: "11.2", price: "350", sold: 88, type: "KONUT" },
];

export default function LandingScreen() {
  const router = useRouter();
  const { token, user, hydrated } = useAuthStore();

  // Zaten giriş yapılmışsa uygun sayfaya yönlendir
  useEffect(() => {
    if (!hydrated) return;
    if (token && user) {
      if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        router.replace("/(admin)/dashboard" as any);
      } else if (user.role === "OWNER") {
        router.replace("/(owner)/my-properties" as any);
      } else {
        router.replace("/(investor)/(tabs)/market" as any);
      }
    }
  }, [hydrated, token, user]);

  // Hydrate olmadan veya giriş yapılmışsa boş ekran göster (flash önle)
  if (!hydrated || (token && user)) return null;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* ── NAV ── */}
      <View style={s.nav}>
        <Text style={s.logo}>TAPU<Text style={s.logoDot}>.IO</Text></Text>
        <View style={s.navLinks}>
          {token && user ? (
            <TouchableOpacity style={s.navBtn} onPress={() => {
              if (user.role === "ADMIN") router.replace("/(admin)/dashboard" as any);
              else if (user.role === "OWNER") router.replace("/(owner)/my-properties" as any);
              else router.replace("/(investor)/(tabs)/market" as any);
            }}>
              <Text style={s.navBtnText}>👤 Uygulamaya Dön</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text style={s.navLink}>Giriş Yap</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.navBtn} onPress={() => router.push("/(auth)/register")}>
                <Text style={s.navBtnText}>Ücretsiz Başla</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* ── HERO ── */}
      <View style={s.hero}>
        <View style={s.badge}>
          <Text style={s.badgeText}>🇹🇷 Türkiye'nin İlk Dijital Tapu Platformu</Text>
        </View>
        <Text style={s.heroTitle}>Gayrimenkule{"\n"}
          <Text style={s.heroGold}>₺100'den</Text> ortak ol
        </Text>
        <Text style={s.heroSub}>
          Tapuya şerh koymadan, güvenli dijital altyapı ile İstanbul'dan Ankara'ya
          en değerli mülklere küçük paylı yatırım yap.
        </Text>
        <View style={s.heroActions}>
          <TouchableOpacity style={s.heroBtnPrimary} onPress={() => router.push("/(auth)/register")}>
            <Text style={s.heroBtnPrimaryText}>Hemen Yatırım Yap →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.heroBtnSecondary} onPress={() => router.push("/(investor)/market")}>
            <Text style={s.heroBtnSecondaryText}>Mülklere Göz At</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.stats}>
          {[
            { val: "₺24M+", label: "Tokenize Değer" },
            { val: "%11.3", label: "Ort. Yıllık Getiri" },
            { val: "1,200+", label: "Yatırımcı" },
            { val: "48", label: "Aktif Mülk" },
          ].map((s2) => (
            <View key={s2.label} style={s.statItem}>
              <Text style={s.statVal}>{s2.val}</Text>
              <Text style={s.statLabel}>{s2.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── ÖZELLIKLER ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Neden TAPU.IO?</Text>
        <View style={s.features}>
          {[
            { icon: "🏛️", title: "Hukuki Güvence", desc: "Her mülk tapuya şerh kaydı ile güvence altında. Bağımsız değerleme zorunlu." },
            { icon: "💰", title: "₺100'den Başla", desc: "Büyük sermaye gerekmez. Küçük paylarla portföy çeşitlendirme." },
            { icon: "📊", title: "Aylık Kira Getirisi", desc: "Kira geliri her ay oransal olarak hesabına aktarılır, otomatik." },
            { icon: "🔒", title: "MASAK Uyumlu", desc: "KYC doğrulama ve düzenleyici uyum ile tam yasal çerçevede." },
          ].map((f) => (
            <View key={f.title} style={s.featureCard}>
              <Text style={s.featureIcon}>{f.icon}</Text>
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── ÖNE ÇIKAN MÜLKLER ── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Öne Çıkan Mülkler</Text>
          <TouchableOpacity onPress={() => router.push("/(investor)/market")}>
            <Text style={s.seeAll}>Tümünü Gör →</Text>
          </TouchableOpacity>
        </View>
        <View style={s.cards}>
          {PROPERTIES.map((p) => (
            <View key={p.id} style={s.card}>
              <View style={s.cardImg}>
                <Text style={s.cardImgText}>🏢</Text>
                <View style={s.cardBadge}>
                  <Text style={s.cardBadgeText}>{p.type}</Text>
                </View>
              </View>
              <View style={s.cardBody}>
                <Text style={s.cardName}>{p.name}</Text>
                <Text style={s.cardLoc}>📍 {p.location}</Text>
                <View style={s.progressBar}>
                  <View style={[s.progressFill, { width: `${p.sold}%` as any }]} />
                </View>
                <Text style={s.progressText}>%{p.sold} satıldı</Text>
                <View style={s.cardFooter}>
                  <View>
                    <Text style={s.cardPrice}>₺{p.price} / pay</Text>
                    <Text style={s.cardYield}>Yıllık %{p.yield} getiri</Text>
                  </View>
                  <TouchableOpacity style={s.cardBtn} onPress={() => router.push("/(auth)/register")}>
                    <Text style={s.cardBtnText}>Yatırım Yap</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── CTA ── */}
      <View style={s.cta}>
        <Text style={s.ctaTitle}>Yatırıma başlamak için{"\n"}sadece 3 dakika</Text>
        <Text style={s.ctaSub}>Kimlik doğrula · Bakiye yükle · Mülk seç</Text>
        <TouchableOpacity style={s.ctaBtn} onPress={() => router.push("/(auth)/register")}>
          <Text style={s.ctaBtnText}>Ücretsiz Hesap Aç →</Text>
        </TouchableOpacity>
      </View>

      {/* ── FOOTER ── */}
      <View style={s.footer}>
        <Text style={s.footerLogo}>TAPU<Text style={s.logoDot}>.IO</Text></Text>
        <Text style={s.footerText}>© 2026 TAPU.IO · VARA Lisanslı · Tüm hakları saklıdır</Text>
      </View>

    </ScrollView>
  );
}

const GREEN = "#1B4332";
const GOLD = "#D4AF37";
const BG = "#F8F9FA";
const CARD = "#FFFFFF";
const TEXT = "#212529";
const MUTED = "#6C757D";

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { paddingBottom: 0 },

  // Nav
  nav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16, backgroundColor: GREEN },
  logo: { fontSize: 22, fontWeight: "800", color: "#fff" },
  logoDot: { color: GOLD },
  navLinks: { flexDirection: "row", alignItems: "center", gap: 16 },
  navLink: { color: "#fff", fontSize: 14, opacity: 0.85 },
  navBtn: { backgroundColor: GOLD, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  navBtnText: { color: GREEN, fontWeight: "700", fontSize: 14 },

  // Hero
  hero: { backgroundColor: GREEN, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 56, alignItems: "center" },
  badge: { backgroundColor: "rgba(212,175,55,0.15)", borderColor: GOLD, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 24 },
  badgeText: { color: GOLD, fontSize: 13, fontWeight: "600" },
  heroTitle: { fontSize: isWeb ? 52 : 36, fontWeight: "800", color: "#fff", textAlign: "center", lineHeight: isWeb ? 64 : 44, marginBottom: 16 },
  heroGold: { color: GOLD },
  heroSub: { fontSize: 16, color: "rgba(255,255,255,0.75)", textAlign: "center", maxWidth: 560, lineHeight: 26, marginBottom: 32 },
  heroActions: { flexDirection: "row", gap: 12, marginBottom: 48, flexWrap: "wrap", justifyContent: "center" },
  heroBtnPrimary: { backgroundColor: GOLD, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
  heroBtnPrimaryText: { color: GREEN, fontWeight: "800", fontSize: 16 },
  heroBtnSecondary: { borderColor: "rgba(255,255,255,0.4)", borderWidth: 1.5, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
  heroBtnSecondaryText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  // Stats
  stats: { flexDirection: "row", gap: 32, flexWrap: "wrap", justifyContent: "center" },
  statItem: { alignItems: "center" },
  statVal: { fontSize: 28, fontWeight: "800", color: GOLD },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 },

  // Section
  section: { paddingHorizontal: 24, paddingVertical: 48 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  sectionTitle: { fontSize: 26, fontWeight: "800", color: TEXT, marginBottom: 24 },
  seeAll: { color: GREEN, fontWeight: "600", fontSize: 14 },

  // Features
  features: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  featureCard: { backgroundColor: CARD, borderRadius: 16, padding: 24, flex: 1, minWidth: isWeb ? 200 : "100%", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  featureIcon: { fontSize: 32, marginBottom: 12 },
  featureTitle: { fontSize: 16, fontWeight: "700", color: TEXT, marginBottom: 8 },
  featureDesc: { fontSize: 14, color: MUTED, lineHeight: 22 },

  // Cards
  cards: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  card: { backgroundColor: CARD, borderRadius: 16, overflow: "hidden", flex: 1, minWidth: isWeb ? 280 : "100%", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, elevation: 3 },
  cardImg: { height: 160, backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center" },
  cardImgText: { fontSize: 56 },
  cardBadge: { position: "absolute", top: 12, left: 12, backgroundColor: GREEN, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  cardBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cardBody: { padding: 16 },
  cardName: { fontSize: 16, fontWeight: "700", color: TEXT, marginBottom: 4 },
  cardLoc: { fontSize: 13, color: MUTED, marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: "#E9ECEF", borderRadius: 3, marginBottom: 4 },
  progressFill: { height: 6, backgroundColor: GREEN, borderRadius: 3 },
  progressText: { fontSize: 12, color: MUTED, marginBottom: 12 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardPrice: { fontSize: 16, fontWeight: "700", color: GREEN },
  cardYield: { fontSize: 12, color: MUTED },
  cardBtn: { backgroundColor: GREEN, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  cardBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // CTA
  cta: { backgroundColor: GOLD, paddingHorizontal: 24, paddingVertical: 56, alignItems: "center" },
  ctaTitle: { fontSize: 28, fontWeight: "800", color: GREEN, textAlign: "center", marginBottom: 12, lineHeight: 38 },
  ctaSub: { fontSize: 15, color: GREEN, opacity: 0.75, marginBottom: 28 },
  ctaBtn: { backgroundColor: GREEN, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  ctaBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  // Footer
  footer: { backgroundColor: "#0D1F17", paddingHorizontal: 24, paddingVertical: 32, alignItems: "center", gap: 8 },
  footerLogo: { fontSize: 20, fontWeight: "800", color: "#fff" },
  footerText: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
});
