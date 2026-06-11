import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import API from "../../src/services/api";

export default function EarningsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEarnings(); }, []);

  async function fetchEarnings() {
    setLoading(true);
    try {
      const res = await API.get("/properties/my/earnings");
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.logo}>TAPU<Text style={s.gold}>.IO</Text></Text>
        <Text style={s.headerTitle}>Kazanç Raporu</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {loading ? (
          <View style={s.center}><ActivityIndicator color="#1B4332" /></View>
        ) : !data ? (
          <View style={s.center}><Text style={s.emptyText}>Veri yüklenemedi</Text></View>
        ) : (
          <>
            {/* Özet kartlar */}
            <View style={s.summaryGrid}>
              <View style={[s.summaryCard, { backgroundColor: GREEN }]}>
                <Text style={s.summaryIcon}>🏠</Text>
                <Text style={s.summaryVal}>{data.summary.propertyCount}</Text>
                <Text style={s.summaryLbl}>Toplam Mülk</Text>
              </View>
              <View style={[s.summaryCard, { backgroundColor: "#2D6A4F" }]}>
                <Text style={s.summaryIcon}>✅</Text>
                <Text style={s.summaryVal}>{data.summary.activeProperties}</Text>
                <Text style={s.summaryLbl}>Aktif</Text>
              </View>
              <View style={[s.summaryCard, { backgroundColor: "#856404" }]}>
                <Text style={s.summaryIcon}>⏳</Text>
                <Text style={s.summaryVal}>{data.summary.pendingProperties}</Text>
                <Text style={s.summaryLbl}>Bekleyen</Text>
              </View>
              <View style={[s.summaryCard, { backgroundColor: GOLD }]}>
                <Text style={[s.summaryIcon]}>💰</Text>
                <Text style={[s.summaryVal, { color: GREEN }]}>₺{(data.summary.totalMonthlyRent / 1000).toFixed(1)}K</Text>
                <Text style={[s.summaryLbl, { color: GREEN }]}>Aylık Kira</Text>
              </View>
            </View>

            {/* Mülk bazlı özet */}
            <Text style={s.sectionTitle}>Mülk Bazlı Durum</Text>
            {data.properties.length === 0 ? (
              <View style={s.empty}><Text style={s.emptyText}>Henüz mülkünüz yok</Text></View>
            ) : (
              data.properties.map((p: any) => {
                const pct = Math.round((p.soldTokens / p.totalTokens) * 100);
                return (
                  <View key={p.id} style={s.propCard}>
                    <View style={s.propTop}>
                      <View style={s.propInfo}>
                        <Text style={s.propName}>{p.nameTr || p.name}</Text>
                        <Text style={s.propLoc}>📍 {p.location}</Text>
                      </View>
                      <View style={s.propRight}>
                        <Text style={s.rentVal}>₺{p.monthlyRent?.toLocaleString()}</Text>
                        <Text style={s.rentLbl}>/ ay</Text>
                      </View>
                    </View>

                    <View style={s.propStats}>
                      <View style={s.pStat}>
                        <Text style={s.pStatVal}>₺{(p.value / 1000000).toFixed(1)}M</Text>
                        <Text style={s.pStatLbl}>Değer</Text>
                      </View>
                      <View style={s.pStat}>
                        <Text style={s.pStatVal}>{p._count?.holdings ?? 0}</Text>
                        <Text style={s.pStatLbl}>Yatırımcı</Text>
                      </View>
                      <View style={s.pStat}>
                        <Text style={s.pStatVal}>%{pct}</Text>
                        <Text style={s.pStatLbl}>Token Satışı</Text>
                      </View>
                      <View style={s.pStat}>
                        <Text style={s.pStatVal}>{p.rentPayments?.length ?? 0}</Text>
                        <Text style={s.pStatLbl}>Kira Dağıtımı</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}

            {/* Kira geçmişi */}
            <Text style={s.sectionTitle}>Son Kira Dağıtımları</Text>
            {data.recentRentPayments.length === 0 ? (
              <View style={s.empty}><Text style={s.emptyText}>Henüz kira dağıtımı yapılmadı</Text></View>
            ) : (
              data.recentRentPayments.map((pay: any) => (
                <View key={pay.id} style={s.rentRow}>
                  <View style={s.rentLeft}>
                    <Text style={s.rentName}>{pay.property?.nameTr || pay.property?.name}</Text>
                    <Text style={s.rentPeriod}>📅 {pay.period}</Text>
                  </View>
                  <View style={s.rentRight}>
                    <Text style={s.rentAmount}>₺{pay.amount?.toLocaleString()}</Text>
                    <View style={[s.rentBadge, { backgroundColor: pay.distributed ? "#D4EDDA" : "#FFF3CD" }]}>
                      <Text style={[s.rentBadgeText, { color: pay.distributed ? "#155724" : "#856404" }]}>
                        {pay.distributed ? "Dağıtıldı" : "Bekliyor"}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
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
  center: { paddingVertical: 60, alignItems: "center" },
  header: { backgroundColor: GREEN, flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  logo: { fontSize: 20, fontWeight: "800", color: "#fff" },
  gold: { color: GOLD },
  headerTitle: { fontSize: 15, color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  summaryGrid: { flexDirection: "row", gap: 10, marginBottom: 24 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: "center" },
  summaryIcon: { fontSize: 22, marginBottom: 4 },
  summaryVal: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 2 },
  summaryLbl: { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#212529", marginBottom: 12 },
  empty: { alignItems: "center", paddingVertical: 24 },
  emptyText: { color: "#6C757D", fontSize: 14 },
  propCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  propTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  propInfo: { flex: 1 },
  propName: { fontSize: 15, fontWeight: "700", color: "#212529" },
  propLoc: { fontSize: 12, color: "#6C757D", marginTop: 2 },
  propRight: { alignItems: "flex-end" },
  rentVal: { fontSize: 18, fontWeight: "800", color: GREEN },
  rentLbl: { fontSize: 11, color: "#ADB5BD" },
  propStats: { flexDirection: "row", backgroundColor: "#F8F9FA", borderRadius: 10, padding: 10 },
  pStat: { flex: 1, alignItems: "center" },
  pStatVal: { fontSize: 14, fontWeight: "700", color: "#212529" },
  pStatLbl: { fontSize: 10, color: "#ADB5BD", marginTop: 2 },
  rentRow: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  rentLeft: { flex: 1 },
  rentName: { fontSize: 14, fontWeight: "700", color: "#212529" },
  rentPeriod: { fontSize: 12, color: "#6C757D", marginTop: 2 },
  rentRight: { alignItems: "flex-end", gap: 6 },
  rentAmount: { fontSize: 16, fontWeight: "800", color: GREEN },
  rentBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  rentBadgeText: { fontSize: 11, fontWeight: "700" },
});
