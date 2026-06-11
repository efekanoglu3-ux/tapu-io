import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, Alert,
} from "react-native";
import API from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";

const TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL: "Konut", COMMERCIAL: "Ticari", LAND: "Arsa", HOTEL: "Otel",
};

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token, user, fetchMe } = useAuthStore();

  const [property, setProperty] = useState<any>(null);
  const [tokens, setTokens] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showBuy, setShowBuy] = useState(false);
  const [tokenCount, setTokenCount] = useState("1");
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState("");
  const [buySuccess, setBuySuccess] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  async function fetchProperty() {
    try {
      const [propRes, tokenRes] = await Promise.all([
        API.get(`/properties/${id}`),
        API.get(`/properties/${id}/tokens`),
      ]);
      setProperty(propRes.data.data);
      setTokens(tokenRes.data.data);
    } catch {
      router.canGoBack() ? router.back() : router.replace('/(investor)/(tabs)/market' as any);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy() {
    if (!token) { router.push("/(auth)/login"); return; }
    const count = parseInt(tokenCount);
    if (!count || count < 1) { setBuyError("Geçerli bir pay sayısı girin"); return; }

    setBuying(true); setBuyError("");
    try {
      await API.post("/tokens/buy", { propertyId: id, tokenCount: count });
      setBuySuccess(true);
      await fetchMe(); // bakiyeyi güncelle
      fetchProperty(); // mülk token sayısını güncelle
    } catch (e: any) {
      setBuyError(e?.response?.data?.error || "Satın alma başarısız");
    } finally {
      setBuying(false);
    }
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#1B4332" /></View>;
  if (!property) return null;

  const pct = tokens ? Math.round((tokens.soldTokens / tokens.totalTokens) * 100) : 0;
  const count = parseInt(tokenCount) || 0;
  const subtotal = count * (property.tokenPrice || 0);
  const fee = Math.round(subtotal * 0.025 * 100) / 100;
  const total = subtotal + fee;
  const monthlyPerToken = property.monthlyRent / property.totalTokens;

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(investor)/(tabs)/market' as any)} style={s.backBtn}>
          <Text style={s.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{property.nameTr}</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.heroEmoji}>
            {property.type === "RESIDENTIAL" ? "🏠" : property.type === "COMMERCIAL" ? "🏢" : property.type === "HOTEL" ? "🏨" : "🌍"}
          </Text>
          <View style={s.heroBadges}>
            <View style={s.typeBadge}><Text style={s.typeBadgeText}>{TYPE_LABELS[property.type] || property.type}</Text></View>
            <View style={s.yieldBadge}><Text style={s.yieldBadgeText}>%{property.annualYield} Yıllık Getiri</Text></View>
          </View>
        </View>

        {/* Title */}
        <Text style={s.title}>{property.nameTr}</Text>
        <Text style={s.location}>📍 {property.location}</Text>

        {/* Funding Progress */}
        <View style={s.card}>
          <View style={s.progressHeader}>
            <Text style={s.cardTitle}>Finansman Durumu</Text>
            <Text style={s.pct}>%{pct}</Text>
          </View>
          <View style={s.bar}><View style={[s.fill, { width: `${pct}%` as any }]} /></View>
          <View style={s.progressStats}>
            <Text style={s.progressStat}><Text style={s.bold}>{tokens?.soldTokens?.toLocaleString()}</Text> pay satıldı</Text>
            <Text style={s.progressStat}><Text style={s.bold}>{tokens?.availableTokens?.toLocaleString()}</Text> pay kaldı</Text>
          </View>
        </View>

        {/* Key Stats */}
        <View style={s.statsGrid}>
          {[
            { label: "Pay Fiyatı", val: `₺${property.tokenPrice?.toLocaleString()}` },
            { label: "Toplam Değer", val: `₺${(property.value / 1000000).toFixed(1)}M` },
            { label: "Aylık Kira/Pay", val: `₺${Math.round(monthlyPerToken)}` },
            { label: "Yıllık Getiri", val: `%${property.annualYield}` },
            { label: "Doluluk", val: `%${Math.round((property.occupancyRate || 0.92) * 100)}` },
            { label: "Toplam Pay", val: property.totalTokens?.toLocaleString() },
          ].map((s2) => (
            <View key={s2.label} style={s.statCard}>
              <Text style={s.statVal}>{s2.val}</Text>
              <Text style={s.statLbl}>{s2.label}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        {property.descriptionTr && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Mülk Hakkında</Text>
            <Text style={s.desc}>{property.descriptionTr}</Text>
          </View>
        )}

        {/* Details */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Mülk Detayları</Text>
          {[
            ["Mülk Tipi", TYPE_LABELS[property.type]],
            ["Konum", property.location],
            property.sqm && ["Alan", `${property.sqm} m²`],
            property.yearBuilt && ["Yapım Yılı", property.yearBuilt],
            ["Rezerv Fon", property.hasReserveFund ? `%${(property.reserveFundPct * 100).toFixed(0)}` : "Yok"],
          ].filter(Boolean).map(([label, val]: any) => (
            <View key={label} style={s.detailRow}>
              <Text style={s.detailLabel}>{label}</Text>
              <Text style={s.detailVal}>{val}</Text>
            </View>
          ))}
        </View>

        {/* Owner info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Hukuki Güvence</Text>
          <View style={s.guaranteeRow}>
            <Text style={s.guaranteeIcon}>🏛️</Text>
            <Text style={s.guaranteeText}>Bu mülk tapuya şerh kaydı ile güvence altındadır. Bağımsız değerleme zorunludur.</Text>
          </View>
          <View style={s.guaranteeRow}>
            <Text style={s.guaranteeIcon}>🔒</Text>
            <Text style={s.guaranteeText}>MASAK uyumlu işlem altyapısı. KYC doğrulaması zorunludur.</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Buy Button */}
      <View style={s.footer}>
        <View>
          <Text style={s.footerPrice}>₺{property.tokenPrice?.toLocaleString()} / pay</Text>
          <Text style={s.footerYield}>%{property.annualYield} yıllık getiri</Text>
        </View>
        <TouchableOpacity
          style={[s.buyBtn, pct >= 100 && s.buyBtnDisabled]}
          onPress={() => { setBuySuccess(false); setBuyError(""); setTokenCount("1"); setShowBuy(true); }}
          disabled={pct >= 100}
        >
          <Text style={s.buyBtnText}>{pct >= 100 ? "Tükendi" : "Yatırım Yap →"}</Text>
        </TouchableOpacity>
      </View>

      {/* Buy Modal */}
      <Modal visible={showBuy} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            {buySuccess ? (
              <View style={s.successBox}>
                <Text style={s.successIcon}>🎉</Text>
                <Text style={s.successTitle}>Yatırım Başarılı!</Text>
                <Text style={s.successSub}>{tokenCount} pay başarıyla satın alındı.</Text>
                <TouchableOpacity style={s.successBtn} onPress={() => { setShowBuy(false); router.push("/(investor)/portfolio"); }}>
                  <Text style={s.successBtnText}>Portföyüme Git →</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowBuy(false)}>
                  <Text style={s.closeText}>Kapat</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={s.modalHeader}>
                  <Text style={s.modalTitle}>Pay Satın Al</Text>
                  <TouchableOpacity onPress={() => setShowBuy(false)}><Text style={s.modalClose}>✕</Text></TouchableOpacity>
                </View>
                <Text style={s.modalProp}>{property.nameTr}</Text>

                {buyError ? <View style={s.errorBox}><Text style={s.errorText}>⚠ {buyError}</Text></View> : null}

                <Text style={s.modalLabel}>Pay Sayısı</Text>
                <View style={s.countRow}>
                  <TouchableOpacity style={s.countBtn} onPress={() => setTokenCount(String(Math.max(1, count - 1)))}>
                    <Text style={s.countBtnText}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={s.countInput}
                    value={tokenCount}
                    onChangeText={setTokenCount}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                  <TouchableOpacity style={s.countBtn} onPress={() => setTokenCount(String(count + 1))}>
                    <Text style={s.countBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                <View style={s.summary}>
                  <View style={s.summaryRow}><Text style={s.summaryLbl}>Pay fiyatı</Text><Text style={s.summaryVal}>₺{property.tokenPrice?.toLocaleString()}</Text></View>
                  <View style={s.summaryRow}><Text style={s.summaryLbl}>Adet</Text><Text style={s.summaryVal}>× {count}</Text></View>
                  <View style={s.summaryRow}><Text style={s.summaryLbl}>Ara toplam</Text><Text style={s.summaryVal}>₺{subtotal.toLocaleString()}</Text></View>
                  <View style={s.summaryRow}><Text style={s.summaryLbl}>Platform komisyonu (%2.5)</Text><Text style={s.summaryVal}>₺{fee.toLocaleString()}</Text></View>
                  <View style={[s.summaryRow, s.totalRow]}><Text style={s.totalLbl}>Toplam</Text><Text style={s.totalVal}>₺{total.toLocaleString()}</Text></View>
                  <View style={s.summaryRow}><Text style={s.summaryLbl}>Tahmini aylık kira</Text><Text style={[s.summaryVal, { color: "#1B4332" }]}>₺{Math.round(monthlyPerToken * count)}</Text></View>
                </View>

                {user?.walletBalance !== undefined && (
                  <Text style={s.balanceNote}>Bakiyeniz: ₺{user.walletBalance.toLocaleString()}</Text>
                )}

                <TouchableOpacity style={s.confirmBtn} onPress={handleBuy} disabled={buying}>
                  {buying ? <ActivityIndicator color="#fff" /> : <Text style={s.confirmBtnText}>Satın Al → ₺{total.toLocaleString()}</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const GREEN = "#1B4332"; const GOLD = "#D4AF37";
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: GREEN, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn: { padding: 4 },
  backText: { color: "#fff", fontSize: 15, opacity: 0.85 },
  headerTitle: { flex: 1, color: "#fff", fontSize: 16, fontWeight: "700" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 20 },
  hero: { height: 180, backgroundColor: "#E8F5E9", borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  heroEmoji: { fontSize: 64, marginBottom: 8 },
  heroBadges: { flexDirection: "row", gap: 8 },
  typeBadge: { backgroundColor: GREEN, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  yieldBadge: { backgroundColor: GOLD, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  yieldBadgeText: { color: GREEN, fontSize: 12, fontWeight: "800" },
  title: { fontSize: 22, fontWeight: "800", color: "#212529", marginBottom: 6 },
  location: { fontSize: 14, color: "#6C757D", marginBottom: 20 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 18, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#212529", marginBottom: 14 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  pct: { fontSize: 18, fontWeight: "800", color: GREEN },
  bar: { height: 8, backgroundColor: "#E9ECEF", borderRadius: 4, marginBottom: 10 },
  fill: { height: 8, backgroundColor: GREEN, borderRadius: 4 },
  progressStats: { flexDirection: "row", justifyContent: "space-between" },
  progressStat: { fontSize: 13, color: "#6C757D" },
  bold: { fontWeight: "700", color: "#212529" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  statCard: { flex: 1, minWidth: "30%", backgroundColor: "#fff", borderRadius: 12, padding: 14, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  statVal: { fontSize: 16, fontWeight: "800", color: GREEN, marginBottom: 4 },
  statLbl: { fontSize: 11, color: "#ADB5BD", textAlign: "center" },
  desc: { fontSize: 14, color: "#495057", lineHeight: 22 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F1F3F5" },
  detailLabel: { fontSize: 14, color: "#6C757D" },
  detailVal: { fontSize: 14, fontWeight: "600", color: "#212529" },
  guaranteeRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  guaranteeIcon: { fontSize: 18 },
  guaranteeText: { flex: 1, fontSize: 13, color: "#495057", lineHeight: 20 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#E9ECEF", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 8 },
  footerPrice: { fontSize: 18, fontWeight: "800", color: GREEN },
  footerYield: { fontSize: 12, color: "#6C757D" },
  buyBtn: { backgroundColor: GREEN, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  buyBtnDisabled: { backgroundColor: "#ADB5BD" },
  buyBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#212529" },
  modalClose: { fontSize: 20, color: "#ADB5BD", padding: 4 },
  modalProp: { fontSize: 14, color: "#6C757D", marginBottom: 16 },
  errorBox: { backgroundColor: "#FFF3CD", borderRadius: 8, padding: 10, marginBottom: 12 },
  errorText: { color: "#856404", fontSize: 13 },
  modalLabel: { fontSize: 13, fontWeight: "600", color: "#495057", marginBottom: 8 },
  countRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  countBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center" },
  countBtnText: { fontSize: 22, color: GREEN, fontWeight: "700" },
  countInput: { flex: 1, borderWidth: 1.5, borderColor: "#DEE2E6", borderRadius: 10, padding: 10, fontSize: 18, fontWeight: "700", backgroundColor: "#F8F9FA" },
  summary: { backgroundColor: "#F8F9FA", borderRadius: 12, padding: 14, marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLbl: { fontSize: 13, color: "#6C757D" },
  summaryVal: { fontSize: 13, fontWeight: "600", color: "#212529" },
  totalRow: { borderTopWidth: 1, borderTopColor: "#DEE2E6", marginTop: 4, paddingTop: 10, marginBottom: 4 },
  totalLbl: { fontSize: 15, fontWeight: "800", color: "#212529" },
  totalVal: { fontSize: 15, fontWeight: "800", color: GREEN },
  balanceNote: { fontSize: 12, color: "#6C757D", textAlign: "center", marginBottom: 12 },
  confirmBtn: { backgroundColor: GREEN, borderRadius: 14, padding: 16, alignItems: "center" },
  confirmBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  successBox: { alignItems: "center", paddingVertical: 20 },
  successIcon: { fontSize: 56, marginBottom: 12 },
  successTitle: { fontSize: 22, fontWeight: "800", color: "#212529", marginBottom: 8 },
  successSub: { fontSize: 14, color: "#6C757D", marginBottom: 24 },
  successBtn: { backgroundColor: GREEN, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, marginBottom: 14 },
  successBtnText: { color: "#fff", fontWeight: "800" },
  closeText: { color: "#ADB5BD", fontSize: 14 },
});
