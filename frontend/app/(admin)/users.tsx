import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import API from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";

export default function AdminUsers() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("IN_REVIEW");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, [filter]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params: any = filter !== "ALL" ? { kycStatus: filter } : {};
      const res = await API.get("/admin/users", { params });
      setUsers(res.data.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleKYC(userId: string, action: "approve" | "reject") {
    setActionLoading(userId + action);
    try {
      await API.put(`/admin/users/${userId}/kyc`, { action, kycScore: action === "approve" ? 85 : 0 });
      fetchUsers();
    } finally {
      setActionLoading(null);
    }
  }

  const KYC_COLORS: Record<string, string> = { PENDING: "#FFF3CD", IN_REVIEW: "#D1ECF1", APPROVED: "#D4EDDA", REJECTED: "#F8D7DA" };
  const KYC_TEXT: Record<string, string> = { PENDING: "#856404", IN_REVIEW: "#0C5460", APPROVED: "#155724", REJECTED: "#721C24" };
  const KYC_LABELS: Record<string, string> = { PENDING: "Bekliyor", IN_REVIEW: "İnceleniyor", APPROVED: "Onaylı", REJECTED: "Reddedildi", ALL: "Tümü" };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace("/(admin)/dashboard" as any)}>
          <Text style={s.logo}>TAPU<Text style={s.gold}>.IO</Text></Text>
        </TouchableOpacity>
        <Text style={s.adminBadge}>👥 Kullanıcılar</Text>
        <TouchableOpacity style={s.logoutBtn} onPress={() => { logout(); router.replace("/"); }}>
          <Text style={s.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.pageTitle}>Kullanıcı Yönetimi</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters}>
          {["IN_REVIEW", "PENDING", "APPROVED", "REJECTED", "ALL"].map((f) => (
            <TouchableOpacity key={f} style={[s.chip, filter === f && s.chipActive]} onPress={() => setFilter(f)}>
              <Text style={[s.chipText, filter === f && s.chipTextActive]}>{KYC_LABELS[f]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={s.center}><ActivityIndicator color="#1B4332" /></View>
        ) : users.length === 0 ? (
          <View style={s.empty}><Text style={s.emptyText}>Bu filtrede kullanıcı yok</Text></View>
        ) : (
          users.map((user) => (
            <View key={user.id} style={s.card}>
              <View style={s.cardTop}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{user.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={s.info}>
                  <Text style={s.name}>{user.name}</Text>
                  <Text style={s.email}>{user.email}</Text>
                  <Text style={s.meta}>
                    {user.role} · {user._count?.portfolio ?? 0} mülk · {user._count?.transactions ?? 0} işlem
                  </Text>
                </View>
                <View style={[s.kycBadge, { backgroundColor: KYC_COLORS[user.kycStatus] }]}>
                  <Text style={[s.kycText, { color: KYC_TEXT[user.kycStatus] }]}>{KYC_LABELS[user.kycStatus]}</Text>
                </View>
              </View>

              {user.kycStatus === "IN_REVIEW" && (
                <View style={s.actions}>
                  <TouchableOpacity style={s.approveBtn} onPress={() => handleKYC(user.id, "approve")} disabled={!!actionLoading}>
                    {actionLoading === user.id + "approve"
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={s.approveBtnText}>✓ Onayla</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={s.rejectBtn} onPress={() => handleKYC(user.id, "reject")} disabled={!!actionLoading}>
                    {actionLoading === user.id + "reject"
                      ? <ActivityIndicator color="#721C24" size="small" />
                      : <Text style={s.rejectBtnText}>✕ Reddet</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
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
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: GREEN, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700", color: "#212529" },
  email: { fontSize: 13, color: "#6C757D", marginTop: 1 },
  meta: { fontSize: 12, color: "#ADB5BD", marginTop: 3 },
  kycBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  kycText: { fontSize: 12, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  approveBtn: { flex: 1, backgroundColor: GREEN, borderRadius: 10, padding: 12, alignItems: "center" },
  approveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  rejectBtn: { flex: 1, backgroundColor: "#F8D7DA", borderRadius: 10, padding: 12, alignItems: "center" },
  rejectBtnText: { color: "#721C24", fontWeight: "700", fontSize: 14 },
});
