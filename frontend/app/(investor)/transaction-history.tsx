import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import API from "../../src/services/api";

const TX_ICONS: Record<string, string> = {
  TOKEN_PURCHASE: "🏠", TOKEN_SALE: "💱", RENT_INCOME: "💸",
  DEPOSIT: "⬇️", WITHDRAWAL: "⬆️", PLATFORM_FEE: "💳", RESERVE_FUND: "🔒",
};
const TX_LABELS: Record<string, string> = {
  TOKEN_PURCHASE: "Token Alım", TOKEN_SALE: "Token Satış", RENT_INCOME: "Kira Geliri",
  DEPOSIT: "Para Yatırma", WITHDRAWAL: "Para Çekme", PLATFORM_FEE: "Platform Komisyonu", RESERVE_FUND: "Rezerv Fon",
};
const TX_COLORS: Record<string, string> = {
  TOKEN_PURCHASE: "#F8D7DA", TOKEN_SALE: "#D4EDDA", RENT_INCOME: "#D4EDDA",
  DEPOSIT: "#D4EDDA", WITHDRAWAL: "#F8D7DA", PLATFORM_FEE: "#FFF3CD", RESERVE_FUND: "#E2E3E5",
};
const TX_AMOUNT_COLOR: Record<string, string> = {
  TOKEN_PURCHASE: "#721C24", TOKEN_SALE: "#155724", RENT_INCOME: "#155724",
  DEPOSIT: "#155724", WITHDRAWAL: "#721C24", PLATFORM_FEE: "#856404", RESERVE_FUND: "#383D41",
};
const TX_SIGN: Record<string, string> = {
  TOKEN_PURCHASE: "-", TOKEN_SALE: "+", RENT_INCOME: "+",
  DEPOSIT: "+", WITHDRAWAL: "-", PLATFORM_FEE: "-", RESERVE_FUND: "-",
};

const FILTERS = [
  { val: "ALL", label: "Tümü" },
  { val: "TOKEN_PURCHASE", label: "Alım" },
  { val: "RENT_INCOME", label: "Kira" },
  { val: "DEPOSIT", label: "Yatırma" },
  { val: "WITHDRAWAL", label: "Çekim" },
];

export default function TransactionHistory() {
  const router = useRouter();
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => { setPage(1); fetchTxs(1, filter, true); }, [filter]);

  async function fetchTxs(p: number, f: string, reset = false) {
    setLoading(true);
    try {
      const params: any = { page: p, limit: 20 };
      if (f !== "ALL") params.type = f;
      const res = await API.get("/tokens/history", { params });
      const newTxs = res.data.data ?? [];
      setTxs(reset ? newTxs : (prev) => [...prev, ...newTxs]);
      setHasMore(newTxs.length === 20);
    } finally {
      setLoading(false);
    }
  }

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTxs(nextPage, filter);
  }

  const totalIn = txs.filter((t) => ["RENT_INCOME", "DEPOSIT", "TOKEN_SALE"].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);
  const totalOut = txs.filter((t) => ["TOKEN_PURCHASE", "WITHDRAWAL", "PLATFORM_FEE"].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(investor)/(tabs)/profile' as any)}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>İşlem Geçmişi</Text>
      </View>

      {/* Özet */}
      <View style={s.summary}>
        <View style={s.sumCard}>
          <Text style={s.sumLbl}>Toplam Giriş</Text>
          <Text style={[s.sumVal, { color: "#155724" }]}>+₺{totalIn.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}</Text>
        </View>
        <View style={s.sumDivider} />
        <View style={s.sumCard}>
          <Text style={s.sumLbl}>Toplam Çıkış</Text>
          <Text style={[s.sumVal, { color: "#721C24" }]}>-₺{totalOut.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}</Text>
        </View>
      </View>

      {/* Filtreler */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters} contentContainerStyle={s.filtersContent}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f.val} style={[s.chip, filter === f.val && s.chipActive]} onPress={() => setFilter(f.val)}>
            <Text style={[s.chipText, filter === f.val && s.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {loading && txs.length === 0 ? (
          <View style={s.center}><ActivityIndicator color="#1B4332" /></View>
        ) : txs.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyTitle}>İşlem bulunamadı</Text>
          </View>
        ) : (
          <>
            {txs.map((tx) => (
              <View key={tx.id} style={s.txRow}>
                <View style={[s.txIcon, { backgroundColor: TX_COLORS[tx.type] ?? "#F8F9FA" }]}>
                  <Text style={s.txIconText}>{TX_ICONS[tx.type] ?? "💳"}</Text>
                </View>
                <View style={s.txInfo}>
                  <Text style={s.txLabel}>{TX_LABELS[tx.type] ?? tx.type}</Text>
                  {tx.description ? (
                    <Text style={s.txDesc} numberOfLines={1}>{tx.description}</Text>
                  ) : null}
                  <Text style={s.txDate}>{new Date(tx.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}</Text>
                </View>
                <View style={s.txRight}>
                  <Text style={[s.txAmount, { color: TX_AMOUNT_COLOR[tx.type] ?? "#212529" }]}>
                    {TX_SIGN[tx.type] ?? ""}₺{tx.amount?.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  {tx.tokens ? <Text style={s.txTokens}>{tx.tokens} pay</Text> : null}
                  <View style={[s.statusDot, { backgroundColor: tx.status === "CONFIRMED" ? "#28A745" : tx.status === "PENDING" ? "#FFC107" : "#DC3545" }]} />
                </View>
              </View>
            ))}

            {hasMore && (
              <TouchableOpacity style={s.moreBtn} onPress={loadMore} disabled={loading}>
                {loading ? <ActivityIndicator color="#1B4332" size="small" /> : <Text style={s.moreBtnText}>Daha Fazla Yükle</Text>}
              </TouchableOpacity>
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
  back: { fontSize: 22, color: "#fff", fontWeight: "700" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  summary: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E9ECEF" },
  sumCard: { flex: 1, padding: 16, alignItems: "center" },
  sumLbl: { fontSize: 12, color: "#6C757D", marginBottom: 4 },
  sumVal: { fontSize: 18, fontWeight: "800" },
  sumDivider: { width: 1, backgroundColor: "#E9ECEF", marginVertical: 12 },
  filters: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E9ECEF" },
  filtersContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: "row" },
  chip: { borderWidth: 1.5, borderColor: "#DEE2E6", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: "#fff" },
  chipActive: { borderColor: GREEN, backgroundColor: GREEN },
  chipText: { fontSize: 13, fontWeight: "600", color: "#495057" },
  chipTextActive: { color: "#fff" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#6C757D" },
  txRow: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  txIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  txIconText: { fontSize: 20 },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: "700", color: "#212529" },
  txDesc: { fontSize: 12, color: "#6C757D", marginTop: 1 },
  txDate: { fontSize: 11, color: "#ADB5BD", marginTop: 3 },
  txRight: { alignItems: "flex-end", gap: 3 },
  txAmount: { fontSize: 15, fontWeight: "800" },
  txTokens: { fontSize: 11, color: "#ADB5BD" },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginTop: 2 },
  moreBtn: { backgroundColor: "#fff", borderRadius: 12, padding: 14, alignItems: "center", marginTop: 8, borderWidth: 1.5, borderColor: "#DEE2E6" },
  moreBtnText: { color: GREEN, fontWeight: "700", fontSize: 14 },
});
