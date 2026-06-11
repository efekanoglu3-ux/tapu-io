import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Modal } from "react-native";
import { useRouter } from "expo-router";
import API from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";

export default function AdminRent() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [properties, setProperties] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [propsRes, paymentsRes] = await Promise.all([
        API.get("/admin/rent/active-properties"),
        API.get("/admin/rent/payments", { params: { limit: 10 } }),
      ]);
      setProperties(propsRes.data.data ?? []);
      setPayments(paymentsRes.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  function openModal(prop: any) {
    setSelected(prop);
    setAmount(prop.monthlyRent?.toString() ?? "");
    setSuccessMsg("");
    setErrorMsg("");
    setModal(true);
  }

  async function handleDistribute() {
    if (!selected || !amount || !period) {
      setErrorMsg("Tüm alanları doldurun");
      return;
    }
    setDistributing(true);
    setErrorMsg("");
    try {
      const res = await API.post("/admin/rent/distribute", {
        propertyId: selected.id,
        amount: parseFloat(amount),
        period,
      });
      setSuccessMsg(res.data.message);
      await fetchData();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || "Dağıtım başarısız");
    } finally {
      setDistributing(false);
    }
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace("/(admin)/dashboard" as any)}>
          <Text style={s.logo}>TAPU<Text style={s.gold}>.IO</Text></Text>
        </TouchableOpacity>
        <Text style={s.adminBadge}>💸 Kira</Text>
        <TouchableOpacity style={s.logoutBtn} onPress={() => { logout(); router.replace("/"); }}>
          <Text style={s.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.pageTitle}>Kira Dağıtımı</Text>

        {loading ? (
          <View style={s.center}><ActivityIndicator color="#1B4332" /></View>
        ) : (
          <>
            <Text style={s.sectionTitle}>Aktif Mülkler</Text>
            {properties.length === 0 ? (
              <View style={s.empty}><Text style={s.emptyText}>Aktif ve token satılmış mülk yok</Text></View>
            ) : (
              properties.map((p) => (
                <View key={p.id} style={s.card}>
                  <View style={s.cardRow}>
                    <View style={s.info}>
                      <Text style={s.propName}>{p.nameTr || p.name}</Text>
                      <Text style={s.propLoc}>📍 {p.location}</Text>
                      <Text style={s.propMeta}>
                        {p._count?.holdings ?? 0} yatırımcı · {p.soldTokens}/{p.totalTokens} token
                      </Text>
                    </View>
                    <View style={s.rightCol}>
                      <Text style={s.rentVal}>₺{p.monthlyRent?.toLocaleString()}</Text>
                      <Text style={s.rentLbl}>Aylık Kira</Text>
                      <TouchableOpacity style={s.distBtn} onPress={() => openModal(p)}>
                        <Text style={s.distBtnText}>Dağıt</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}

            <Text style={[s.sectionTitle, { marginTop: 24 }]}>Son Dağıtımlar</Text>
            {payments.length === 0 ? (
              <View style={s.empty}><Text style={s.emptyText}>Henüz kira dağıtımı yapılmadı</Text></View>
            ) : (
              payments.map((pay) => (
                <View key={pay.id} style={s.payCard}>
                  <View style={s.payLeft}>
                    <Text style={s.payName}>{pay.property?.nameTr || pay.property?.name}</Text>
                    <Text style={s.payPeriod}>📅 {pay.period}</Text>
                  </View>
                  <View style={s.payRight}>
                    <Text style={s.payAmount}>₺{pay.amount?.toLocaleString()}</Text>
                    <View style={[s.badge, { backgroundColor: pay.distributed ? "#D4EDDA" : "#FFF3CD" }]}>
                      <Text style={[s.badgeText, { color: pay.distributed ? "#155724" : "#856404" }]}>
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

      {/* Distribute Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Kira Dağıt</Text>
            {selected && (
              <Text style={s.modalSub}>{selected.nameTr || selected.name}</Text>
            )}

            {successMsg ? (
              <View style={s.successBox}>
                <Text style={s.successIcon}>✓</Text>
                <Text style={s.successText}>{successMsg}</Text>
                <TouchableOpacity style={s.modalCloseBtn} onPress={() => setModal(false)}>
                  <Text style={s.modalCloseBtnText}>Kapat</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {errorMsg ? (
                  <View style={s.errorBox}><Text style={s.errorText}>⚠ {errorMsg}</Text></View>
                ) : null}

                <Text style={s.label}>Dönem (YYYY-MM)</Text>
                <TextInput
                  style={s.input}
                  value={period}
                  onChangeText={setPeriod}
                  placeholder="2026-05"
                />

                <Text style={s.label}>Dağıtılacak Tutar (₺)</Text>
                <TextInput
                  style={s.input}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />

                {selected && amount ? (
                  <View style={s.previewBox}>
                    <Text style={s.previewText}>
                      {selected._count?.holdings ?? 0} yatırımcıya oransal olarak
                      toplam ₺{parseFloat(amount || "0").toLocaleString()} dağıtılacak
                    </Text>
                  </View>
                ) : null}

                <View style={s.modalActions}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(false)}>
                    <Text style={s.cancelBtnText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.confirmBtn} onPress={handleDistribute} disabled={distributing}>
                    {distributing
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={s.confirmBtnText}>💸 Dağıt</Text>}
                  </TouchableOpacity>
                </View>
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
  center: { paddingVertical: 40, alignItems: "center" },
  header: { backgroundColor: GREEN, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16 },
  logo: { fontSize: 22, fontWeight: "800", color: "#fff" },
  gold: { color: GOLD },
  adminBadge: { color: GOLD, fontSize: 13, fontWeight: "700" },
  logoutBtn: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: "800", color: "#212529", marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#212529", marginBottom: 12 },
  empty: { alignItems: "center", paddingVertical: 30 },
  emptyText: { color: "#6C757D", fontSize: 14 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardRow: { flexDirection: "row", alignItems: "center" },
  info: { flex: 1 },
  propName: { fontSize: 15, fontWeight: "700", color: "#212529" },
  propLoc: { fontSize: 13, color: "#6C757D", marginTop: 2 },
  propMeta: { fontSize: 12, color: "#ADB5BD", marginTop: 3 },
  rightCol: { alignItems: "flex-end", gap: 4 },
  rentVal: { fontSize: 18, fontWeight: "800", color: GREEN },
  rentLbl: { fontSize: 11, color: "#ADB5BD" },
  distBtn: { backgroundColor: GREEN, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, marginTop: 4 },
  distBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  payCard: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  payLeft: { flex: 1 },
  payName: { fontSize: 14, fontWeight: "700", color: "#212529" },
  payPeriod: { fontSize: 12, color: "#6C757D", marginTop: 2 },
  payRight: { alignItems: "flex-end", gap: 6 },
  payAmount: { fontSize: 16, fontWeight: "800", color: GREEN },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  // Modal
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#212529", marginBottom: 4 },
  modalSub: { fontSize: 14, color: "#6C757D", marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#495057", marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: "#DEE2E6", borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 14, backgroundColor: "#F8F9FA" },
  previewBox: { backgroundColor: "#D4EDDA", borderRadius: 10, padding: 12, marginBottom: 16 },
  previewText: { color: "#155724", fontSize: 13, fontWeight: "600" },
  errorBox: { backgroundColor: "#FFF3CD", borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: "#856404", fontSize: 13 },
  successBox: { alignItems: "center", paddingVertical: 20 },
  successIcon: { fontSize: 48, color: GREEN, marginBottom: 12 },
  successText: { fontSize: 16, fontWeight: "700", color: "#155724", textAlign: "center", marginBottom: 20 },
  modalActions: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: "#F8F9FA", borderRadius: 12, padding: 14, alignItems: "center" },
  cancelBtnText: { color: "#495057", fontWeight: "700" },
  confirmBtn: { flex: 2, backgroundColor: GREEN, borderRadius: 12, padding: 14, alignItems: "center" },
  confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  modalCloseBtn: { backgroundColor: GREEN, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  modalCloseBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
