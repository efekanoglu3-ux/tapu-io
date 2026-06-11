import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import API from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";

export default function AdminDashboard() {
  const router = useRouter();
  const { token, user, logout } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.replace("/(auth)/login"); return; }
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await API.get("/admin/dashboard");
      setData(res.data.data);
    } catch {
      router.replace("/(auth)/login");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#1B4332" /></View>;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace("/(admin)/dashboard" as any)}>
          <Text style={s.logo}>TAPU<Text style={s.gold}>.IO</Text></Text>
        </TouchableOpacity>
        <Text style={s.adminBadge}>⚙️ Admin</Text>
        <TouchableOpacity style={s.logoutBtn} onPress={() => { logout(); router.replace("/"); }}>
          <Text style={s.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.pageTitle}>Dashboard</Text>

        {/* Stats */}
        <View style={s.grid}>
          {[
            { icon: "👥", label: "Toplam Kullanıcı", val: data?.users?.total ?? 0, color: "#1B4332" },
            { icon: "⏳", label: "KYC Bekleyen", val: data?.users?.kycPending ?? 0, color: "#856404" },
            { icon: "🏠", label: "Aktif Mülk", val: data?.properties?.active ?? 0, color: "#0C5460" },
            { icon: "📋", label: "Onay Bekleyen", val: data?.properties?.pending ?? 0, color: "#721C24" },
            { icon: "✅", label: "İşlem Sayısı", val: data?.transactions?.total ?? 0, color: "#155724" },
            { icon: "💰", label: "Toplam Hacim", val: `₺${((data?.transactions?.volume ?? 0) / 1000).toFixed(0)}K`, color: "#1B4332" },
          ].map((item) => (
            <View key={item.label} style={[s.statCard, { borderLeftColor: item.color }]}>
              <Text style={s.statIcon}>{item.icon}</Text>
              <Text style={[s.statVal, { color: item.color }]}>{item.val}</Text>
              <Text style={s.statLbl}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Son İşlemler */}
        <Text style={s.sectionTitle}>Son İşlemler</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableCell, s.tableHead, { flex: 2 }]}>Kullanıcı</Text>
            <Text style={[s.tableCell, s.tableHead]}>Tür</Text>
            <Text style={[s.tableCell, s.tableHead]}>Tutar</Text>
            <Text style={[s.tableCell, s.tableHead]}>Durum</Text>
          </View>
          {(data?.recentTransactions ?? []).slice(0, 8).map((tx: any) => (
            <View key={tx.id} style={s.tableRow}>
              <Text style={[s.tableCell, { flex: 2 }]} numberOfLines={1}>{tx.user?.name ?? "-"}</Text>
              <Text style={s.tableCell}>{TX_LABELS[tx.type] ?? tx.type}</Text>
              <Text style={s.tableCell}>₺{tx.amount?.toLocaleString()}</Text>
              <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[tx.status] ?? "#E9ECEF" }]}>
                <Text style={s.statusText}>{STATUS_LABELS[tx.status] ?? tx.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Hızlı Linkler */}
        <Text style={s.sectionTitle}>Hızlı İşlemler</Text>
        <View style={s.quickLinks}>
          <TouchableOpacity style={s.quickBtn} onPress={() => router.push("/(admin)/users" as any)}>
            <Text style={s.quickBtnIcon}>🪪</Text>
            <Text style={s.quickBtnText}>KYC Onayla</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={() => router.push("/(admin)/properties" as any)}>
            <Text style={s.quickBtnIcon}>🏠</Text>
            <Text style={s.quickBtnText}>Mülk Onayla</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={() => router.push("/(admin)/rent" as any)}>
            <Text style={s.quickBtnIcon}>💸</Text>
            <Text style={s.quickBtnText}>Kira Dağıt</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const TX_LABELS: Record<string, string> = { TOKEN_PURCHASE: "Token Alım", DEPOSIT: "Yatırma", WITHDRAWAL: "Çekim", PLATFORM_FEE: "Komisyon", RENT_INCOME: "Kira" };
const STATUS_LABELS: Record<string, string> = { CONFIRMED: "Onaylı", PENDING: "Bekliyor", FAILED: "Başarısız" };
const STATUS_COLORS: Record<string, string> = { CONFIRMED: "#D4EDDA", PENDING: "#FFF3CD", FAILED: "#F8D7DA" };

const GREEN = "#1B4332"; const GOLD = "#D4AF37";
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: GREEN, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16 },
  logo: { fontSize: 22, fontWeight: "800", color: "#fff" },
  gold: { color: GOLD },
  adminBadge: { backgroundColor: "rgba(212,175,55,0.2)", borderColor: GOLD, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, color: GOLD, fontSize: 13, fontWeight: "700" },
  logoutBtn: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: "800", color: "#212529", marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  statCard: { flex: 1, minWidth: 140, backgroundColor: "#fff", borderRadius: 12, padding: 16, borderLeftWidth: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statVal: { fontSize: 24, fontWeight: "800", marginBottom: 4 },
  statLbl: { fontSize: 12, color: "#6C757D" },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#212529", marginBottom: 12 },
  table: { backgroundColor: "#fff", borderRadius: 14, overflow: "hidden", marginBottom: 24, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  tableHeader: { flexDirection: "row", backgroundColor: "#F8F9FA", paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#E9ECEF" },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#F1F3F5" },
  tableCell: { flex: 1, fontSize: 13, color: "#495057" },
  tableHead: { fontWeight: "700", color: "#212529", fontSize: 12 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "700", color: "#212529" },
  quickLinks: { flexDirection: "row", gap: 12 },
  quickBtn: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  quickBtnIcon: { fontSize: 28, marginBottom: 6 },
  quickBtnText: { fontSize: 12, fontWeight: "700", color: GREEN },
});
