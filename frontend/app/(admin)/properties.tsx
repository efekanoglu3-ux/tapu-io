import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import API from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";

const TYPE_LABELS: Record<string, string> = { RESIDENTIAL: "Konut", COMMERCIAL: "Ticari", LAND: "Arsa", HOTEL: "Otel" };
const STATUS_LABELS: Record<string, string> = { PENDING: "Bekliyor", APPROVED: "Onaylı", ACTIVE: "Aktif", REJECTED: "Reddedildi", SUSPENDED: "Askıya Alındı" };
const STATUS_COLORS: Record<string, string> = { PENDING: "#FFF3CD", ACTIVE: "#D4EDDA", APPROVED: "#D1ECF1", REJECTED: "#F8D7DA", SUSPENDED: "#E2E3E5" };
const STATUS_TEXT: Record<string, string> = { PENDING: "#856404", ACTIVE: "#155724", APPROVED: "#0C5460", REJECTED: "#721C24", SUSPENDED: "#383D41" };

export default function AdminProperties() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchProperties(); }, [filter]);

  async function fetchProperties() {
    setLoading(true);
    try {
      const res = await API.get("/properties", {
        params: filter !== "ALL" ? { status: filter, limit: 50 } : { limit: 50 }
      });
      setProperties(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string, action: "approve" | "reject") {
    setActionLoading(id + action);
    try {
      await API.put(`/admin/properties/${id}/approve`, { action });
      fetchProperties();
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace("/(admin)/dashboard" as any)}>
          <Text style={s.logo}>TAPU<Text style={s.gold}>.IO</Text></Text>
        </TouchableOpacity>
        <Text style={s.adminBadge}>🏠 Mülkler</Text>
        <TouchableOpacity style={s.logoutBtn} onPress={() => { logout(); router.replace("/"); }}>
          <Text style={s.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.pageTitle}>Mülk Yönetimi</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters}>
          {[["PENDING", "Bekleyen"], ["ACTIVE", "Aktif"], ["REJECTED", "Reddedilen"], ["ALL", "Tümü"]].map(([val, label]) => (
            <TouchableOpacity key={val} style={[s.chip, filter === val && s.chipActive]} onPress={() => setFilter(val)}>
              <Text style={[s.chipText, filter === val && s.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={s.center}><ActivityIndicator color="#1B4332" /></View>
        ) : properties.length === 0 ? (
          <View style={s.empty}><Text style={s.emptyText}>Bu filtrede mülk yok</Text></View>
        ) : (
          properties.map((p) => {
            const pct = Math.round((p.soldTokens / p.totalTokens) * 100);
            return (
              <View key={p.id} style={s.card}>
                <View style={s.cardTop}>
                  <Text style={s.emoji}>{p.type === "RESIDENTIAL" ? "🏠" : p.type === "COMMERCIAL" ? "🏢" : "🏨"}</Text>
                  <View style={s.info}>
                    <Text style={s.propName}>{p.nameTr || p.name}</Text>
                    <Text style={s.propLoc}>📍 {p.location}</Text>
                    <Text style={s.propMeta}>
                      {TYPE_LABELS[p.type]} · ₺{p.tokenPrice?.toLocaleString()}/pay · %{p.annualYield} getiri
                    </Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[p.status] }]}>
                    <Text style={[s.statusText, { color: STATUS_TEXT[p.status] }]}>{STATUS_LABELS[p.status]}</Text>
                  </View>
                </View>

                <View style={s.statsRow}>
                  <View style={s.stat}>
                    <Text style={s.statVal}>₺{(p.value / 1000000).toFixed(1)}M</Text>
                    <Text style={s.statLbl}>Değer</Text>
                  </View>
                  <View style={s.stat}>
                    <Text style={s.statVal}>₺{p.monthlyRent?.toLocaleString()}</Text>
                    <Text style={s.statLbl}>Aylık Kira</Text>
                  </View>
                  <View style={s.stat}>
                    <Text style={s.statVal}>%{pct}</Text>
                    <Text style={s.statLbl}>Satış</Text>
                  </View>
                </View>

                {p.status === "PENDING" && (
                  <View style={s.actions}>
                    <TouchableOpacity style={s.approveBtn} onPress={() => handleApprove(p.id, "approve")} disabled={!!actionLoading}>
                      {actionLoading === p.id + "approve"
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={s.approveBtnText}>✓ Onayla & Yayınla</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={s.rejectBtn} onPress={() => handleApprove(p.id, "reject")} disabled={!!actionLoading}>
                      {actionLoading === p.id + "reject"
                        ? <ActivityIndicator color="#721C24" size="small" />
                        : <Text style={s.rejectBtnText}>✕ Reddet</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const GREEN = "#1B4332"; const GOLD = "#D4AF37";
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FA" },
  center: { paddingVertical: 40, alignItems: "center" },
  header: { backgroundColor: GREEN, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16 },
  logo: { fontSize: 22, fontWeight: "800", color: "#fff" },
  gold: { color: GOLD },
  adminBadge: { color: GOLD, fontSize: 13, fontWeight: "700" },
  logoutBtn: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: "800", color: "#212529", marginBottom: 16 },
  filters: { marginBottom: 20 },
  chip: { borderWidth: 1.5, borderColor: "#DEE2E6", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7, marginRight: 8, backgroundColor: "#fff" },
  chipActive: { borderColor: GREEN, backgroundColor: GREEN },
  chipText: { fontSize: 13, fontWeight: "600", color: "#495057" },
  chipTextActive: { color: "#fff" },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: "#6C757D", fontSize: 15 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  emoji: { fontSize: 36 },
  info: { flex: 1 },
  propName: { fontSize: 15, fontWeight: "700", color: "#212529" },
  propLoc: { fontSize: 13, color: "#6C757D", marginTop: 2 },
  propMeta: { fontSize: 12, color: "#ADB5BD", marginTop: 3 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: "700" },
  statsRow: { flexDirection: "row", backgroundColor: "#F8F9FA", borderRadius: 10, padding: 12, marginBottom: 14 },
  stat: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 15, fontWeight: "700", color: "#212529" },
  statLbl: { fontSize: 11, color: "#ADB5BD", marginTop: 2 },
  actions: { flexDirection: "row", gap: 10 },
  approveBtn: { flex: 2, backgroundColor: GREEN, borderRadius: 10, padding: 12, alignItems: "center" },
  approveBtnText: { color: "#fff", fontWeight: "700" },
  rejectBtn: { flex: 1, backgroundColor: "#F8D7DA", borderRadius: 10, padding: 12, alignItems: "center" },
  rejectBtnText: { color: "#721C24", fontWeight: "700" },
});
