import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import API from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";

export default function SecondaryMarket() {
  const router = useRouter();
  const { token, fetchMe } = useAuthStore();
  const [listings, setListings] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [myHoldings, setMyHoldings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"browse" | "sell" | "my">("browse");

  // Buy state
  const [buyModal, setBuyModal] = useState(false);
  const [buyTarget, setBuyTarget] = useState<any>(null);
  const [buying, setBuying] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);

  // Sell state
  const [sellModal, setSellModal] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<any>(null);
  const [sellTokens, setSellTokens] = useState("1");
  const [sellPrice, setSellPrice] = useState("");
  const [listing, setListing] = useState(false);
  const [listSuccess, setListSuccess] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) { router.replace("/(auth)/login"); return; }
    fetchData();
  }, [token]);

  async function fetchData() {
    setLoading(true);
    try {
      const [listingsRes, myRes, portfolioRes] = await Promise.all([
        API.get("/market"),
        API.get("/market/my-listings"),
        API.get("/tokens/portfolio"),
      ]);
      setListings(listingsRes.data.data ?? []);
      setMyListings(myRes.data.data ?? []);
      setMyHoldings(portfolioRes.data.data?.holdings ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy(listingItem: any) {
    setBuyTarget(listingItem);
    setBuySuccess(false);
    setErrorMsg("");
    setBuyModal(true);
  }

  async function confirmBuy() {
    setBuying(true);
    setErrorMsg("");
    try {
      await API.post(`/market/${buyTarget.id}/buy`);
      setBuySuccess(true);
      fetchMe();
      fetchData();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || "Satın alma başarısız");
    } finally {
      setBuying(false);
    }
  }

  async function handleList(holding: any) {
    setSelectedHolding(holding);
    setSellTokens("1");
    setSellPrice(holding.property.tokenPrice?.toString() ?? "");
    setListSuccess(false);
    setErrorMsg("");
    setSellModal(true);
  }

  async function confirmList() {
    if (!selectedHolding || !sellTokens || !sellPrice) {
      setErrorMsg("Tüm alanları doldurun");
      return;
    }
    setListing(true);
    setErrorMsg("");
    try {
      await API.post("/market/list", {
        propertyId: selectedHolding.property.id,
        tokens: parseInt(sellTokens),
        pricePerToken: parseFloat(sellPrice),
      });
      setListSuccess(true);
      fetchData();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || "İlan oluşturulamadı");
    } finally {
      setListing(false);
    }
  }

  async function cancelListing(listingId: string) {
    try {
      await API.delete(`/market/${listingId}`);
      fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.error || "İptal başarısız");
    }
  }

  const activeListings = listings.filter((l) => l.status === "ACTIVE");

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(investor)/(tabs)/market' as any)}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>İkincil Piyasa</Text>
        <Text style={s.headerSub}>Token Al / Sat</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {[
          ["browse", "🔍 İlanlar"],
          ["sell", "📤 Token Sat"],
          ["my", "📋 İlanlarım"],
        ].map(([tab, label]) => (
          <TouchableOpacity
            key={tab}
            style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[s.tabBtnText, activeTab === tab && s.tabBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {loading ? (
          <View style={s.center}><ActivityIndicator color="#1B4332" /></View>
        ) : (
          <>
            {/* Browse listings */}
            {activeTab === "browse" && (
              <>
                {activeListings.length === 0 ? (
                  <View style={s.empty}>
                    <Text style={s.emptyIcon}>🏪</Text>
                    <Text style={s.emptyTitle}>Aktif ilan yok</Text>
                    <Text style={s.emptySub}>Token sahipleri ilan oluşturduğunda burada görünecek</Text>
                  </View>
                ) : (
                  activeListings.map((item) => (
                    <View key={item.id} style={s.card}>
                      <View style={s.cardTop}>
                        <View style={s.info}>
                          <Text style={s.propName}>{item.property?.nameTr || item.property?.name}</Text>
                          <Text style={s.propLoc}>📍 {item.property?.location}</Text>
                          <Text style={s.seller}>Satıcı: {item.seller?.name}</Text>
                        </View>
                        <View style={s.priceCol}>
                          <Text style={s.price}>₺{item.pricePerToken?.toLocaleString()}</Text>
                          <Text style={s.priceLbl}>/ pay</Text>
                        </View>
                      </View>

                      <View style={s.cardBottom}>
                        <View style={s.tokenInfo}>
                          <Text style={s.tokenCount}>{item.tokens} pay</Text>
                          <Text style={s.tokenTotal}>
                            Toplam: ₺{(item.tokens * item.pricePerToken).toLocaleString()}
                          </Text>
                        </View>
                        <TouchableOpacity style={s.buyBtn} onPress={() => handleBuy(item)}>
                          <Text style={s.buyBtnText}>Satın Al</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {/* Sell tokens */}
            {activeTab === "sell" && (
              <>
                <Text style={s.sectionTitle}>Portföyünüzdeki Tokenlar</Text>
                {myHoldings.length === 0 ? (
                  <View style={s.empty}>
                    <Text style={s.emptyIcon}>💼</Text>
                    <Text style={s.emptyTitle}>Satılacak token yok</Text>
                    <Text style={s.emptySub}>Önce marketten token satın alın</Text>
                  </View>
                ) : (
                  myHoldings.map((h) => (
                    <View key={h.id} style={s.card}>
                      <View style={s.cardTop}>
                        <View style={s.info}>
                          <Text style={s.propName}>{h.property?.nameTr}</Text>
                          <Text style={s.propLoc}>📍 {h.property?.location}</Text>
                          <Text style={s.tokenCount}>{h.tokens} pay elinde</Text>
                        </View>
                        <TouchableOpacity style={s.listBtn} onPress={() => handleList(h)}>
                          <Text style={s.listBtnText}>İlan Ver</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {/* My listings */}
            {activeTab === "my" && (
              <>
                {myListings.length === 0 ? (
                  <View style={s.empty}>
                    <Text style={s.emptyIcon}>📋</Text>
                    <Text style={s.emptyTitle}>Henüz ilanınız yok</Text>
                    <Text style={s.emptySub}>"Token Sat" sekmesinden ilan oluşturun</Text>
                  </View>
                ) : (
                  myListings.map((item) => (
                    <View key={item.id} style={s.card}>
                      <View style={s.cardTop}>
                        <View style={s.info}>
                          <Text style={s.propName}>{item.property?.nameTr || item.property?.name}</Text>
                          <Text style={s.propLoc}>📍 {item.property?.location}</Text>
                          <Text style={s.tokenCount}>{item.tokens} pay · ₺{item.pricePerToken}/pay</Text>
                        </View>
                        <View style={[
                          s.statusBadge,
                          { backgroundColor: item.status === "ACTIVE" ? "#D4EDDA" : item.status === "SOLD" ? "#D1ECF1" : "#E2E3E5" }
                        ]}>
                          <Text style={[
                            s.statusText,
                            { color: item.status === "ACTIVE" ? "#155724" : item.status === "SOLD" ? "#0C5460" : "#383D41" }
                          ]}>
                            {item.status === "ACTIVE" ? "Aktif" : item.status === "SOLD" ? "Satıldı" : "İptal"}
                          </Text>
                        </View>
                      </View>
                      {item.status === "ACTIVE" && (
                        <TouchableOpacity style={s.cancelBtn} onPress={() => cancelListing(item.id)}>
                          <Text style={s.cancelBtnText}>İlanı İptal Et</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Buy Modal */}
      <Modal visible={buyModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Token Satın Al</Text>

            {buySuccess ? (
              <View style={s.successBox}>
                <Text style={s.successIcon}>✓</Text>
                <Text style={s.successText}>Başarıyla satın alındı!</Text>
                <TouchableOpacity style={s.modalCloseBtn} onPress={() => setBuyModal(false)}>
                  <Text style={s.modalCloseBtnText}>Kapat</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {buyTarget && (
                  <View style={s.buyPreview}>
                    <Text style={s.buyPreviewName}>{buyTarget.property?.nameTr}</Text>
                    <View style={s.buyRow}>
                      <Text style={s.buyRowLbl}>Token Sayısı</Text>
                      <Text style={s.buyRowVal}>{buyTarget.tokens} pay</Text>
                    </View>
                    <View style={s.buyRow}>
                      <Text style={s.buyRowLbl}>Fiyat / Pay</Text>
                      <Text style={s.buyRowVal}>₺{buyTarget.pricePerToken?.toLocaleString()}</Text>
                    </View>
                    <View style={[s.buyRow, s.buyRowTotal]}>
                      <Text style={s.buyRowTotalLbl}>Toplam Tutar</Text>
                      <Text style={s.buyRowTotalVal}>
                        ₺{(buyTarget.tokens * buyTarget.pricePerToken).toLocaleString()}
                      </Text>
                    </View>
                    <Text style={s.feeNote}>%1 ikincil piyasa komisyonu dahildir</Text>
                  </View>
                )}

                {errorMsg ? <View style={s.errorBox}><Text style={s.errorText}>⚠ {errorMsg}</Text></View> : null}

                <View style={s.modalActions}>
                  <TouchableOpacity style={s.cancelActionBtn} onPress={() => setBuyModal(false)}>
                    <Text style={s.cancelActionText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.confirmBtn} onPress={confirmBuy} disabled={buying}>
                    {buying
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={s.confirmBtnText}>✓ Onayla</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Sell / List Modal */}
      <Modal visible={sellModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>İlan Oluştur</Text>
            {selectedHolding && (
              <Text style={s.modalSub}>{selectedHolding.property?.nameTr} · {selectedHolding.tokens} pay elinde</Text>
            )}

            {listSuccess ? (
              <View style={s.successBox}>
                <Text style={s.successIcon}>✓</Text>
                <Text style={s.successText}>İlan oluşturuldu!</Text>
                <TouchableOpacity style={s.modalCloseBtn} onPress={() => setSellModal(false)}>
                  <Text style={s.modalCloseBtnText}>Kapat</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {errorMsg ? <View style={s.errorBox}><Text style={s.errorText}>⚠ {errorMsg}</Text></View> : null}

                <Text style={s.label}>Satılacak Pay Adedi</Text>
                <TextInput
                  style={s.input}
                  value={sellTokens}
                  onChangeText={setSellTokens}
                  keyboardType="number-pad"
                  placeholder="1"
                />

                <Text style={s.label}>Pay Başına Fiyat (₺)</Text>
                <TextInput
                  style={s.input}
                  value={sellPrice}
                  onChangeText={setSellPrice}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />

                {sellTokens && sellPrice ? (
                  <View style={s.previewBox}>
                    <Text style={s.previewText}>
                      Toplam ₺{(parseInt(sellTokens || "0") * parseFloat(sellPrice || "0")).toLocaleString()} · %1 komisyon düşülür
                    </Text>
                  </View>
                ) : null}

                <View style={s.modalActions}>
                  <TouchableOpacity style={s.cancelActionBtn} onPress={() => setSellModal(false)}>
                    <Text style={s.cancelActionText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.confirmBtn} onPress={confirmList} disabled={listing}>
                    {listing
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={s.confirmBtnText}>İlan Ver</Text>}
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
  center: { paddingVertical: 60, alignItems: "center" },
  header: { backgroundColor: GREEN, paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  back: { fontSize: 22, color: "#fff", fontWeight: "700", paddingRight: 4 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 13, color: GOLD, fontWeight: "600", marginLeft: "auto" },
  tabRow: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E9ECEF" },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabBtnActive: { borderBottomWidth: 2.5, borderBottomColor: GREEN },
  tabBtnText: { fontSize: 12, fontWeight: "600", color: "#6C757D" },
  tabBtnTextActive: { color: GREEN, fontWeight: "800" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#212529", marginBottom: 14 },
  empty: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#343A40", marginBottom: 6 },
  emptySub: { fontSize: 13, color: "#6C757D", textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  info: { flex: 1 },
  propName: { fontSize: 15, fontWeight: "700", color: "#212529" },
  propLoc: { fontSize: 12, color: "#6C757D", marginTop: 2 },
  seller: { fontSize: 12, color: "#ADB5BD", marginTop: 2 },
  priceCol: { alignItems: "flex-end" },
  price: { fontSize: 18, fontWeight: "800", color: GREEN },
  priceLbl: { fontSize: 11, color: "#ADB5BD" },
  cardBottom: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#F1F3F5", paddingTop: 10 },
  tokenInfo: { flex: 1 },
  tokenCount: { fontSize: 14, fontWeight: "700", color: "#212529" },
  tokenTotal: { fontSize: 12, color: "#6C757D", marginTop: 2 },
  buyBtn: { backgroundColor: GREEN, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
  buyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  listBtn: { backgroundColor: GOLD, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  listBtnText: { color: GREEN, fontWeight: "700", fontSize: 13 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: "700" },
  cancelBtn: { backgroundColor: "#F8D7DA", borderRadius: 8, padding: 10, alignItems: "center", marginTop: 8 },
  cancelBtnText: { color: "#721C24", fontWeight: "700", fontSize: 13 },
  // Modal
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#212529", marginBottom: 4 },
  modalSub: { fontSize: 13, color: "#6C757D", marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#495057", marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: "#DEE2E6", borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 14, backgroundColor: "#F8F9FA" },
  buyPreview: { backgroundColor: "#F8F9FA", borderRadius: 12, padding: 16, marginBottom: 20 },
  buyPreviewName: { fontSize: 15, fontWeight: "700", color: "#212529", marginBottom: 12 },
  buyRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  buyRowLbl: { fontSize: 14, color: "#6C757D" },
  buyRowVal: { fontSize: 14, fontWeight: "600", color: "#212529" },
  buyRowTotal: { borderTopWidth: 1, borderTopColor: "#DEE2E6", paddingTop: 10, marginTop: 4 },
  buyRowTotalLbl: { fontSize: 15, fontWeight: "700", color: "#212529" },
  buyRowTotalVal: { fontSize: 17, fontWeight: "800", color: GREEN },
  feeNote: { fontSize: 11, color: "#ADB5BD", marginTop: 8 },
  errorBox: { backgroundColor: "#FFF3CD", borderRadius: 8, padding: 12, marginBottom: 14 },
  errorText: { color: "#856404", fontSize: 13 },
  previewBox: { backgroundColor: "#D4EDDA", borderRadius: 10, padding: 12, marginBottom: 16 },
  previewText: { color: "#155724", fontSize: 13, fontWeight: "600" },
  successBox: { alignItems: "center", paddingVertical: 20 },
  successIcon: { fontSize: 48, color: GREEN, marginBottom: 12 },
  successText: { fontSize: 16, fontWeight: "700", color: "#155724", textAlign: "center", marginBottom: 20 },
  modalActions: { flexDirection: "row", gap: 12 },
  cancelActionBtn: { flex: 1, backgroundColor: "#F8F9FA", borderRadius: 12, padding: 14, alignItems: "center" },
  cancelActionText: { color: "#495057", fontWeight: "700" },
  confirmBtn: { flex: 2, backgroundColor: GREEN, borderRadius: 12, padding: 14, alignItems: "center" },
  confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  modalCloseBtn: { backgroundColor: GREEN, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  modalCloseBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
