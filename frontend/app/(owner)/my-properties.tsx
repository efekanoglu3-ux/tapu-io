import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import API from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Onay Bekliyor", ACTIVE: "Aktif", REJECTED: "Reddedildi",
  APPROVED: "Onaylandı", SUSPENDED: "Askıya Alındı", SOLD: "Satıldı",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#FFF3CD", ACTIVE: "#D4EDDA", REJECTED: "#F8D7DA",
  APPROVED: "#D1ECF1", SUSPENDED: "#E2E3E5", SOLD: "#E2E3E5",
};
const STATUS_TEXT: Record<string, string> = {
  PENDING: "#856404", ACTIVE: "#155724", REJECTED: "#721C24",
  APPROVED: "#0C5460", SUSPENDED: "#383D41", SOLD: "#383D41",
};

export default function MyPropertiesScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProperties(); }, []);

  async function fetchProperties() {
    setLoading(true);
    try {
      const res = await API.get("/properties/my");
      setProperties(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace("/(owner)/my-properties" as any)}>
          <Text style={s.logo}>TAPU<Text style={s.gold}>.IO</Text></Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mülk Sahibi</Text>
        <TouchableOpacity style={s.logoutBtn} onPress={() => { logout(); router.replace("/"); }}>
          <Text style={s.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Mülklerim</Text>
          <Text style={s.count}>{properties.length} mülk</Text>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator color="#1B4332" /></View>
        ) : properties.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🏠</Text>
            <Text style={s.emptyTitle}>Henüz mülkünüz yok</Text>
            <Text style={s.emptySub}>Aşağıdan yeni mülk ekleyerek tokenizasyon sürecini başlatın</Text>
          </View>
        ) : (
          properties.map((p) => {
            const pct = Math.round((p.soldTokens / p.totalTokens) * 100);
            return (
              <View key={p.id} style={s.card}>
                <View style={s.cardTop}>
                  <Text style={s.emoji}>
                    {p.type === "RESIDENTIAL" ? "🏠" : p.type === "COMMERCIAL" ? "🏢" : "🏨"}
                  </Text>
                  <View style={s.info}>
                    <Text style={s.propName}>{p.nameTr || p.name}</Text>
                    <Text style={s.propLoc}>📍 {p.location}</Text>
                    <Text style={s.propMeta}>
                      {p._count?.holdings ?? 0} yatırımcı · ₺{p.tokenPrice?.toLocaleString()}/pay
                    </Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: STATUS_COLORS[p.status] }]}>
                    <Text style={[s.badgeText, { color: STATUS_TEXT[p.status] }]}>{STATUS_LABELS[p.status]}</Text>
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
                    <Text style={s.statLbl}>Token Satışı</Text>
                  </View>
                  <View style={s.stat}>
                    <Text style={s.statVal}>%{p.annualYield}</Text>
                    <Text style={s.statLbl}>Getiri</Text>
                  </View>
                </View>

                {/* Token satış bar */}
                <View style={s.barRow}>
                  <View style={s.bar}>
                    <View style={[s.fill, { width: `${Math.min(pct, 100)}%` as any }]} />
                  </View>
                  <Text style={s.barLabel}>{p.soldTokens}/{p.totalTokens} pay satıldı</Text>
                </View>

                {p.status === "PENDING" && (
                  <View style={s.pendingNote}>
                    <Text style={s.pendingText}>⏳ Admin onayı bekleniyor. Onaylandıktan sonra yatırımcılar token satın alabilecek.</Text>
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
  center: { paddingVertical: 60, alignItems: "center" },
  header: { backgroundColor: GREEN, flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  logo: { fontSize: 20, fontWeight: "800", color: "#fff" },
  gold: { color: GOLD },
  headerTitle: { flex: 1, fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: "600" },
  logoutBtn: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: "800", color: "#212529" },
  count: { fontSize: 14, color: "#6C757D", fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#343A40", marginBottom: 8 },
  emptySub: { fontSize: 14, color: "#6C757D", textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  emoji: { fontSize: 36 },
  info: { flex: 1 },
  propName: { fontSize: 15, fontWeight: "700", color: "#212529" },
  propLoc: { fontSize: 13, color: "#6C757D", marginTop: 2 },
  propMeta: { fontSize: 12, color: "#ADB5BD", marginTop: 3 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  statsRow: { flexDirection: "row", backgroundColor: "#F8F9FA", borderRadius: 10, padding: 12, marginBottom: 12 },
  stat: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 14, fontWeight: "700", color: "#212529" },
  statLbl: { fontSize: 11, color: "#ADB5BD", marginTop: 2 },
  barRow: { gap: 6 },
  bar: { height: 6, backgroundColor: "#E9ECEF", borderRadius: 3 },
  fill: { height: 6, backgroundColor: GREEN, borderRadius: 3 },
  barLabel: { fontSize: 11, color: "#ADB5BD" },
  pendingNote: { backgroundColor: "#FFF3CD", borderRadius: 8, padding: 10, marginTop: 10 },
  pendingText: { color: "#856404", fontSize: 12 },
});
