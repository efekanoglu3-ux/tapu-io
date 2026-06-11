import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import API from "../../../src/services/api";
import { useAuthStore } from "../../../src/store/authStore";

interface Holding {
  id: string;
  tokens: number;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: string;
  property: {
    id: string;
    nameTr: string;
    location: string;
    type: string;
    tokenPrice: number;
    monthlyRent: number;
    annualYield: number;
    totalTokens: number;
  };
}

interface Summary {
  totalValue: number;
  monthlyIncome: number;
  propertyCount: number;
  totalTokens: number;
}

export default function PortfolioScreen() {
  const router = useRouter();
  const { user, token, hydrated } = useAuthStore();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rentIncome, setRentIncome] = useState<any[]>([]);
  const [totalRent, setTotalRent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"holdings" | "rent">("holdings");

  useEffect(() => {
    if (!hydrated) return;
    if (!token) { router.replace("/(auth)/login"); return; }
    fetchPortfolio();
  }, [token, hydrated]);

  async function fetchPortfolio() {
    try {
      const [portfolioRes, rentRes] = await Promise.all([
        API.get("/tokens/portfolio"),
        API.get("/rent/my-income"),
      ]);
      setHoldings(portfolioRes.data.data.holdings);
      setSummary(portfolioRes.data.data.summary);
      setRentIncome(rentRes.data.data ?? []);
      setTotalRent(rentRes.data.totalIncome ?? 0);
    } catch {
      router.replace("/(auth)/login");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color="#1B4332" /></View>;
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.logo}>TAPU<Text style={s.gold}>.IO</Text></Text>
        <Text style={s.headerTitle}>Portföyüm</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {/* Summary Cards */}
        {summary && (
          <View style={s.summaryGrid}>
            <View style={[s.summaryCard, { backgroundColor: "#1B4332" }]}>
              <Text style={s.summaryVal}>₺{summary.totalValue.toLocaleString()}</Text>
              <Text style={s.summaryLbl}>Toplam Değer</Text>
            </View>
            <View style={[s.summaryCard, { backgroundColor: "#D4AF37" }]}>
              <Text style={[s.summaryVal, { color: "#1B4332" }]}>₺{Math.round(summary.monthlyIncome).toLocaleString()}</Text>
              <Text style={[s.summaryLbl, { color: "#1B4332" }]}>Aylık Kira</Text>
            </View>
            <View style={[s.summaryCard, { backgroundColor: "#2D6A4F" }]}>
              <Text style={s.summaryVal}>{summary.propertyCount}</Text>
              <Text style={s.summaryLbl}>Mülk</Text>
            </View>
            <View style={[s.summaryCard, { backgroundColor: "#40916C" }]}>
              <Text style={s.summaryVal}>{summary.totalTokens}</Text>
              <Text style={s.summaryLbl}>Toplam Pay</Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={s.tabRow}>
          <TouchableOpacity style={[s.tabBtn, activeTab === "holdings" && s.tabBtnActive]} onPress={() => setActiveTab("holdings")}>
            <Text style={[s.tabBtnText, activeTab === "holdings" && s.tabBtnTextActive]}>🏠 Mülklerim</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tabBtn, activeTab === "rent" && s.tabBtnActive]} onPress={() => setActiveTab("rent")}>
            <Text style={[s.tabBtnText, activeTab === "rent" && s.tabBtnTextActive]}>💸 Kira Geliri</Text>
          </TouchableOpacity>
        </View>

        {activeTab === "rent" ? (
          <>
            <View style={s.totalRentCard}>
              <Text style={s.totalRentLbl}>Toplam Kira Geliri</Text>
              <Text style={s.totalRentVal}>₺{totalRent.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            {rentIncome.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyIcon}>💸</Text>
                <Text style={s.emptyTitle}>Henüz kira gelirin yok</Text>
                <Text style={s.emptySub}>Token satın aldıktan sonra aylık kira ödemeleri burada görünecek</Text>
              </View>
            ) : (
              rentIncome.map((tx) => (
                <View key={tx.id} style={s.rentRow}>
                  <View style={s.rentLeft}>
                    <Text style={s.rentDesc} numberOfLines={2}>{tx.description}</Text>
                    <Text style={s.rentDate}>{new Date(tx.createdAt).toLocaleDateString("tr-TR")}</Text>
                  </View>
                  <Text style={s.rentAmount}>+₺{tx.amount.toFixed(2)}</Text>
                </View>
              ))
            )}
          </>
        ) : (
        <>
        {holdings.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>🏠</Text>
            <Text style={s.emptyTitle}>Henüz yatırımın yok</Text>
            <Text style={s.emptySub}>Market'ten mülk seç ve yatırım yapmaya başla</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push("/(investor)/(tabs)/market" as any)}>
              <Text style={s.emptyBtnText}>Mülklere Göz At →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          holdings.map((h) => {
            const share = h.tokens / h.property.totalTokens;
            const monthlyIncome = h.property.monthlyRent * share;
            const currentVal = h.tokens * h.property.tokenPrice;
            const pct = h.property.annualYield;

            return (
              <View key={h.id} style={s.holdingCard}>
                <View style={s.holdingHeader}>
                  <View>
                    <Text style={s.holdingName}>{h.property.nameTr}</Text>
                    <Text style={s.holdingLoc}>📍 {h.property.location}</Text>
                  </View>
                  <View style={s.yieldBadge}>
                    <Text style={s.yieldText}>%{pct} / yıl</Text>
                  </View>
                </View>

                <View style={s.statsRow}>
                  <View style={s.stat}>
                    <Text style={s.statVal}>₺{currentVal.toLocaleString()}</Text>
                    <Text style={s.statLbl}>Değer</Text>
                  </View>
                  <View style={s.stat}>
                    <Text style={s.statVal}>{h.tokens}</Text>
                    <Text style={s.statLbl}>Pay Sayısı</Text>
                  </View>
                  <View style={s.stat}>
                    <Text style={s.statVal}>₺{Math.round(monthlyIncome)}</Text>
                    <Text style={s.statLbl}>Aylık Kira</Text>
                  </View>
                  <View style={s.stat}>
                    <Text style={s.statVal}>₺{h.purchasePrice.toLocaleString()}</Text>
                    <Text style={s.statLbl}>Alış Fiyatı</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
        </>
        )}
      </ScrollView>
    </View>
  );
}

const GREEN = "#1B4332"; const GOLD = "#D4AF37";

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: GREEN, paddingHorizontal: 24, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { fontSize: 20, fontWeight: "800", color: "#fff" },
  gold: { color: GOLD },
  headerTitle: { fontSize: 16, color: "rgba(255,255,255,0.7)", fontWeight: "600" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  summaryCard: { flex: 1, minWidth: 130, borderRadius: 14, padding: 16 },
  summaryVal: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 4 },
  summaryLbl: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#212529", marginBottom: 16 },
  holdingCard: { backgroundColor: "#fff", borderRadius: 16, padding: 18, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  holdingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  holdingName: { fontSize: 15, fontWeight: "700", color: "#212529", marginBottom: 3 },
  holdingLoc: { fontSize: 13, color: "#6C757D" },
  yieldBadge: { backgroundColor: "#E8F5E9", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  yieldText: { color: GREEN, fontWeight: "700", fontSize: 13 },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  stat: { alignItems: "center", flex: 1 },
  statVal: { fontSize: 15, fontWeight: "700", color: "#212529", marginBottom: 2 },
  statLbl: { fontSize: 11, color: "#ADB5BD" },
  emptyBox: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#343A40", marginBottom: 8 },
  emptySub: { fontSize: 14, color: "#6C757D", textAlign: "center", marginBottom: 24 },
  emptyBtn: { backgroundColor: GREEN, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  emptyBtnText: { color: "#fff", fontWeight: "700" },
  tabRow: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 4, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabBtnActive: { backgroundColor: GREEN },
  tabBtnText: { fontSize: 13, fontWeight: "700", color: "#6C757D" },
  tabBtnTextActive: { color: "#fff" },
  totalRentCard: { backgroundColor: GREEN, borderRadius: 14, padding: 20, marginBottom: 16, alignItems: "center" },
  totalRentLbl: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 4 },
  totalRentVal: { fontSize: 28, fontWeight: "800", color: GOLD },
  rentRow: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  rentLeft: { flex: 1 },
  rentDesc: { fontSize: 14, fontWeight: "600", color: "#212529" },
  rentDate: { fontSize: 12, color: "#ADB5BD", marginTop: 2 },
  rentAmount: { fontSize: 16, fontWeight: "800", color: "#155724" },
});
