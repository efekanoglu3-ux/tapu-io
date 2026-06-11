import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, TextInput, Dimensions, ActivityIndicator,
} from "react-native";
import API from "../../../src/services/api";
import { useLang } from "../../../src/store/langStore";

const { width } = Dimensions.get("window");
const isWeb = width > 768;

const TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL: "KONUT", COMMERCIAL: "TİCARİ", LAND: "ARSA", HOTEL: "OTEL",
};
const TYPES = ["Tümü", "RESIDENTIAL", "COMMERCIAL", "HOTEL"];
const TYPE_DISPLAY: Record<string, string> = {
  "Tümü": "Tümü", RESIDENTIAL: "Konut", COMMERCIAL: "Ticari", HOTEL: "Otel",
};

export default function MarketScreen() {
  const router = useRouter();
  const { t, lang } = useLang();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tümü");
  const [sortBy, setSortBy] = useState("yield");

  useEffect(() => {
    fetchProperties();
  }, [filter]);

  async function fetchProperties() {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (filter !== "Tümü") params.type = filter;
      const res = await API.get("/properties", { params });
      setProperties(res.data.data || []);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = properties
    .filter((p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.nameTr?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sortBy === "yield" ? b.annualYield - a.annualYield :
      sortBy === "price" ? a.tokenPrice - b.tokenPrice :
      (b.soldTokens / b.totalTokens) - (a.soldTokens / a.totalTokens)
    );

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.logo}>TAPU<Text style={s.gold}>.IO</Text></Text>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.registerBtn} onPress={() => router.push("/(investor)/(tabs)/profile" as any)}>
            <Text style={s.registerBtnText}>👤 Profil</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <View style={s.pageHeader}>
          <View>
            <Text style={s.pageTitle}>{lang === "tr" ? "Mülk Marketi" : "Property Market"}</Text>
            <Text style={s.pageSub}>{properties.length} {lang === "tr" ? "aktif mülk" : "active properties"}</Text>
          </View>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => router.push("/(investor)/secondary-market" as any)}>
            <Text style={s.secondaryBtnText}>🔄 İkincil Piyasa</Text>
          </TouchableOpacity>
        </View>

        {/* Search + filters */}
        <View style={s.toolbar}>
          <TextInput
            style={s.search}
            placeholder="🔍  Mülk veya konum ara..."
            value={search}
            onChangeText={setSearch}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters}>
            {TYPES.map((t) => (
              <TouchableOpacity key={t} style={[s.filterChip, filter === t && s.filterChipActive]} onPress={() => setFilter(t)}>
                <Text style={[s.filterText, filter === t && s.filterTextActive]}>{TYPE_DISPLAY[t] || t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={s.sortRow}>
            <Text style={s.sortLabel}>Sırala: </Text>
            {[["yield", "En Yüksek Getiri"], ["price", "En Düşük Fiyat"], ["funded", "Doluluk"]].map(([val, label]) => (
              <TouchableOpacity key={val} onPress={() => setSortBy(val)} style={[s.sortChip, sortBy === val && s.sortChipActive]}>
                <Text style={[s.sortText, sortBy === val && s.sortTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Loading */}
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color="#1B4332" />
            <Text style={s.loadingText}>Mülkler yükleniyor...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>🏚️</Text>
            <Text style={s.emptyText}>Mülk bulunamadı</Text>
          </View>
        ) : (
          /* Property grid */
          <View style={s.grid}>
            {filtered.map((p) => {
              const pct = Math.round((p.soldTokens / p.totalTokens) * 100);
              const monthly = Math.round((p.tokenPrice * p.annualYield) / 100 / 12);
              const typeLabel = TYPE_LABELS[p.type] || p.type;
              const emoji = p.type === "RESIDENTIAL" ? "🏠" : p.type === "COMMERCIAL" ? "🏢" : p.type === "HOTEL" ? "🏨" : "🌍";

              return (
                <View key={p.id} style={s.card}>
                  <View style={s.cardImg}>
                    <Text style={s.cardEmoji}>{emoji}</Text>
                    <View style={s.typeBadge}><Text style={s.typeBadgeText}>{typeLabel}</Text></View>
                    <View style={s.yieldBadge}><Text style={s.yieldBadgeText}>%{p.annualYield} / yıl</Text></View>
                  </View>

                  <View style={s.cardBody}>
                    <Text style={s.cardName}>{p.nameTr || p.name}</Text>
                    <Text style={s.cardLoc}>📍 {p.location}</Text>

                    <View style={s.progressRow}>
                      <Text style={s.progressLabel}>Doluluk</Text>
                      <Text style={s.progressPct}>%{pct}</Text>
                    </View>
                    <View style={s.bar}>
                      <View style={[s.fill, { width: `${Math.min(pct, 100)}%` as any }]} />
                    </View>

                    <View style={s.statsRow}>
                      <View style={s.stat}>
                        <Text style={s.statVal}>₺{p.tokenPrice?.toLocaleString()}</Text>
                        <Text style={s.statLbl}>Pay fiyatı</Text>
                      </View>
                      <View style={s.stat}>
                        <Text style={s.statVal}>₺{monthly?.toLocaleString()}</Text>
                        <Text style={s.statLbl}>Aylık kira/pay</Text>
                      </View>
                      <View style={s.stat}>
                        <Text style={s.statVal}>%{p.occupancyRate ? Math.round(p.occupancyRate * 100) : 92}</Text>
                        <Text style={s.statLbl}>Doluluk</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={s.investBtn}
                      onPress={() => router.push(("/(investor)/property-detail?id=" + p.id) as any)}
                    >
                      <Text style={s.investBtnText}>İncele →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const GREEN = "#1B4332"; const GOLD = "#D4AF37";

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FA" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 14, backgroundColor: GREEN },
  logo: { fontSize: 22, fontWeight: "800", color: "#fff" },
  gold: { color: GOLD },
  headerRight: { flexDirection: "row", gap: 10 },
  registerBtn: { backgroundColor: GOLD, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  registerBtnText: { color: GREEN, fontWeight: "700", fontSize: 14 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 },
  pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  pageTitle: { fontSize: 26, fontWeight: "800", color: "#212529" },
  pageSub: { fontSize: 14, color: "#6C757D", marginTop: 2 },
  secondaryBtn: { backgroundColor: "#E8F5E9", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5, borderColor: GREEN },
  secondaryBtnText: { color: GREEN, fontWeight: "700", fontSize: 13 },
  toolbar: { marginBottom: 24 },
  search: { borderWidth: 1.5, borderColor: "#DEE2E6", borderRadius: 12, padding: 14, fontSize: 15, backgroundColor: "#fff", marginBottom: 12 },
  filters: { marginBottom: 10 },
  filterChip: { borderWidth: 1.5, borderColor: "#DEE2E6", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7, marginRight: 8, backgroundColor: "#fff" },
  filterChipActive: { borderColor: GREEN, backgroundColor: GREEN },
  filterText: { fontSize: 13, fontWeight: "600", color: "#495057" },
  filterTextActive: { color: "#fff" },
  sortRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  sortLabel: { fontSize: 13, color: "#6C757D" },
  sortChip: { borderWidth: 1, borderColor: "#DEE2E6", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: "#fff" },
  sortChipActive: { borderColor: GOLD, backgroundColor: "#FFF9E6" },
  sortText: { fontSize: 12, color: "#6C757D" },
  sortTextActive: { color: "#856404", fontWeight: "700" },
  loadingBox: { alignItems: "center", paddingVertical: 60, gap: 12 },
  loadingText: { color: "#6C757D", fontSize: 14 },
  emptyBox: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: "#6C757D" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", flex: 1, minWidth: isWeb ? 300 : "100%", shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 14, elevation: 3 },
  cardImg: { height: 156, backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center" },
  cardEmoji: { fontSize: 52 },
  typeBadge: { position: "absolute", top: 12, left: 12, backgroundColor: GREEN, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  typeBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  yieldBadge: { position: "absolute", top: 12, right: 12, backgroundColor: GOLD, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  yieldBadgeText: { color: GREEN, fontSize: 11, fontWeight: "800" },
  cardBody: { padding: 16 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#212529", marginBottom: 3 },
  cardLoc: { fontSize: 13, color: "#6C757D", marginBottom: 14 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  progressLabel: { fontSize: 12, color: "#6C757D" },
  progressPct: { fontSize: 12, fontWeight: "700", color: GREEN },
  bar: { height: 6, backgroundColor: "#E9ECEF", borderRadius: 3, marginBottom: 14 },
  fill: { height: 6, backgroundColor: GREEN, borderRadius: 3 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  stat: { alignItems: "center", flex: 1 },
  statVal: { fontSize: 14, fontWeight: "700", color: "#212529" },
  statLbl: { fontSize: 11, color: "#ADB5BD", marginTop: 2, textAlign: "center" },
  investBtn: { backgroundColor: GREEN, borderRadius: 10, padding: 13, alignItems: "center" },
  investBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
