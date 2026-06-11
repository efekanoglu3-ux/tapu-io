import { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../src/store/authStore";
import { useLang } from "../../../src/store/langStore";

const KYC_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: "Bekliyor",   color: "#856404", bg: "#FFF3CD" },
  IN_REVIEW: { label: "İnceleniyor", color: "#0C5460", bg: "#D1ECF1" },
  APPROVED:  { label: "Onaylı ✓",   color: "#155724", bg: "#D4EDDA" },
  REJECTED:  { label: "Reddedildi", color: "#721C24", bg: "#F8D7DA" },
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token, logout, fetchMe, hydrated } = useAuthStore();
  const { lang, setLang } = useLang();

  useEffect(() => {
    if (!hydrated) return;
    if (!token) { router.replace("/(auth)/login"); return; }
    fetchMe();
  }, [token, hydrated]);

  if (!user) return null;

  const kyc = KYC_LABELS[user.kycStatus] ?? KYC_LABELS.PENDING;

  function handleLogout() {
    logout();
    router.replace("/");
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.logo}>TAPU<Text style={s.gold}>.IO</Text></Text>
        <Text style={s.headerTitle}>Profil</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {/* Avatar */}
        <View style={s.avatarBox}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={s.name}>{user.name}</Text>
          <Text style={s.email}>{user.email}</Text>
          <View style={[s.kycBadge, { backgroundColor: kyc.bg }]}>
            <Text style={[s.kycText, { color: kyc.color }]}>KYC: {kyc.label}</Text>
          </View>
        </View>

        {/* Bakiye */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLbl}>Cüzdan Bakiyesi</Text>
          <Text style={s.balanceVal}>₺{(user.walletBalance ?? 0).toLocaleString()}</Text>
          <View style={s.balanceActions}>
            <TouchableOpacity style={s.balanceBtn}>
              <Text style={s.balanceBtnText}>+ Para Yükle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.balanceBtn, s.balanceBtnOutline]}>
              <Text style={[s.balanceBtnText, { color: "#1B4332" }]}>Para Çek</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Owner Panel Link */}
        {user.role === "OWNER" && (
          <TouchableOpacity style={[s.adminBtn, { backgroundColor: "#2D6A4F" }]} onPress={() => router.push("/(owner)/my-properties" as any)}>
            <Text style={s.adminBtnIcon}>🏠</Text>
            <Text style={s.adminBtnText}>Mülk Paneli</Text>
            <Text style={s.menuArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Admin Panel Link */}
        {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
          <TouchableOpacity style={s.adminBtn} onPress={() => router.push("/(admin)/dashboard" as any)}>
            <Text style={s.adminBtnIcon}>⚙️</Text>
            <Text style={s.adminBtnText}>Admin Paneli</Text>
            <Text style={s.menuArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Menü */}
        {[
          { icon: "🪪", label: "KYC Doğrulama", sub: kyc.label, route: null },
          { icon: "📋", label: "İşlem Geçmişi", sub: "Tüm hareketlerin", route: "/(investor)/transaction-history" },
          { icon: "🔄", label: "İkincil Piyasa", sub: "Token al / sat", route: "/(investor)/secondary-market" },
          { icon: "🔔", label: "Bildirimler", sub: "Kira ve güncellemeler", route: null },
          { icon: "🔒", label: "Güvenlik", sub: "Şifre, 2FA", route: null },
          { icon: "❓", label: "Yardım", sub: "SSS ve destek", route: null },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={s.menuItem} onPress={() => item.route && router.push(item.route as any)}>
            <Text style={s.menuIcon}>{item.icon}</Text>
            <View style={s.menuText}>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Text style={s.menuSub}>{item.sub}</Text>
            </View>
            <Text style={s.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Dil Seçimi */}
        <View style={s.langRow}>
          <Text style={s.langLabel}>🌐 Dil / Language</Text>
          <View style={s.langBtns}>
            <TouchableOpacity style={[s.langBtn, lang === "tr" && s.langBtnActive]} onPress={() => setLang("tr")}>
              <Text style={[s.langBtnText, lang === "tr" && s.langBtnTextActive]}>🇹🇷 TR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.langBtn, lang === "en" && s.langBtnActive]} onPress={() => setLang("en")}>
              <Text style={[s.langBtnText, lang === "en" && s.langBtnTextActive]}>🇬🇧 EN</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        <Text style={s.version}>TAPU.IO v1.0.0 · VARA Lisanslı</Text>
      </ScrollView>
    </View>
  );
}

const GREEN = "#1B4332"; const GOLD = "#D4AF37";
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FA" },
  header: { backgroundColor: GREEN, paddingHorizontal: 24, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { fontSize: 20, fontWeight: "800", color: "#fff" },
  gold: { color: GOLD },
  headerTitle: { fontSize: 16, color: "rgba(255,255,255,0.7)", fontWeight: "600" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  avatarBox: { alignItems: "center", paddingVertical: 28 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: GREEN, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: "800", color: "#fff" },
  name: { fontSize: 20, fontWeight: "800", color: "#212529", marginBottom: 4 },
  email: { fontSize: 14, color: "#6C757D", marginBottom: 12 },
  kycBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  kycText: { fontSize: 13, fontWeight: "700" },
  balanceCard: { backgroundColor: GREEN, borderRadius: 16, padding: 24, marginBottom: 20 },
  balanceLbl: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  balanceVal: { fontSize: 36, fontWeight: "800", color: "#fff", marginBottom: 20 },
  balanceActions: { flexDirection: "row", gap: 12 },
  balanceBtn: { flex: 1, backgroundColor: GOLD, borderRadius: 10, padding: 12, alignItems: "center" },
  balanceBtnOutline: { backgroundColor: "rgba(255,255,255,0.15)" },
  balanceBtnText: { fontWeight: "700", color: GREEN },
  menuItem: { backgroundColor: "#fff", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 8, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  menuIcon: { fontSize: 22, marginRight: 14 },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: "600", color: "#212529" },
  menuSub: { fontSize: 12, color: "#ADB5BD", marginTop: 1 },
  menuArrow: { fontSize: 22, color: "#CED4DA" },
  adminBtn: { backgroundColor: "#1B4332", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 8 },
  adminBtnIcon: { fontSize: 22, marginRight: 14 },
  adminBtnText: { flex: 1, fontSize: 15, fontWeight: "700", color: "#fff" },
  langRow: { backgroundColor: "#fff", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 8, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  langLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: "#212529" },
  langBtns: { flexDirection: "row", gap: 8 },
  langBtn: { borderWidth: 1.5, borderColor: "#DEE2E6", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: "#F8F9FA" },
  langBtnActive: { borderColor: "#1B4332", backgroundColor: "#1B4332" },
  langBtnText: { fontSize: 13, fontWeight: "700", color: "#495057" },
  langBtnTextActive: { color: "#fff" },
  logoutBtn: { marginTop: 20, borderWidth: 1.5, borderColor: "#DEE2E6", borderRadius: 12, padding: 14, alignItems: "center" },
  logoutText: { color: "#DC3545", fontWeight: "700", fontSize: 15 },
  version: { textAlign: "center", fontSize: 12, color: "#ADB5BD", marginTop: 20 },
});
