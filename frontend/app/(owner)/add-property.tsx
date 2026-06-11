import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import API from "../../src/services/api";

const TYPES = [
  { value: "RESIDENTIAL", label: "🏠 Konut" },
  { value: "COMMERCIAL", label: "🏢 Ticari" },
  { value: "LAND", label: "🌍 Arsa" },
  { value: "HOTEL", label: "🏨 Otel" },
];

export default function AddPropertyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", nameTr: "", location: "",
    type: "RESIDENTIAL",
    value: "", totalTokens: "", tokenPrice: "",
    monthlyRent: "", annualYield: "",
    description: "", descriptionTr: "",
    sqm: "", yearBuilt: "",
  });

  function set(field: string, val: string) {
    setForm((prev) => ({ ...prev, [field]: val }));
    setError("");
  }

  // Auto-calculate tokenPrice when value + totalTokens set
  function calcTokenPrice() {
    const v = parseFloat(form.value);
    const t = parseInt(form.totalTokens);
    if (v && t && t > 0) {
      setForm((prev) => ({ ...prev, tokenPrice: (v / t).toFixed(2) }));
    }
  }

  async function handleSubmit() {
    const required = ["name", "nameTr", "location", "value", "totalTokens", "tokenPrice", "monthlyRent", "annualYield"];
    for (const f of required) {
      if (!form[f as keyof typeof form]) {
        setError(`"${f}" alanı zorunlu`);
        return;
      }
    }
    setLoading(true);
    setError("");
    try {
      await API.post("/properties", {
        name: form.name,
        nameTr: form.nameTr,
        location: form.location,
        type: form.type,
        value: parseFloat(form.value),
        totalTokens: parseInt(form.totalTokens),
        tokenPrice: parseFloat(form.tokenPrice),
        monthlyRent: parseFloat(form.monthlyRent),
        annualYield: parseFloat(form.annualYield),
        description: form.description || undefined,
        descriptionTr: form.descriptionTr || undefined,
        sqm: form.sqm ? parseFloat(form.sqm) : undefined,
        yearBuilt: form.yearBuilt ? parseInt(form.yearBuilt) : undefined,
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.response?.data?.errors?.[0]?.msg || "Mülk eklenemedi");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={s.successRoot}>
        <Text style={s.successIcon}>✓</Text>
        <Text style={s.successTitle}>Mülk Eklendi!</Text>
        <Text style={s.successSub}>Admin onayından sonra yatırımcılar token satın alabilecek.</Text>
        <TouchableOpacity style={s.successBtn} onPress={() => { setSuccess(false); setForm({ name: "", nameTr: "", location: "", type: "RESIDENTIAL", value: "", totalTokens: "", tokenPrice: "", monthlyRent: "", annualYield: "", description: "", descriptionTr: "", sqm: "", yearBuilt: "" }); }}>
          <Text style={s.successBtnText}>Başka Mülk Ekle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.successLink} onPress={() => router.push("/(owner)/my-properties" as any)}>
          <Text style={s.successLinkText}>Mülklerime Git →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.logo}>TAPU<Text style={s.gold}>.IO</Text></Text>
        <Text style={s.headerTitle}>Yeni Mülk Ekle</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {error ? <View style={s.errorBox}><Text style={s.errorText}>⚠ {error}</Text></View> : null}

        <Text style={s.section}>Temel Bilgiler</Text>

        <Text style={s.label}>Mülk Adı (İngilizce) *</Text>
        <TextInput style={s.input} value={form.name} onChangeText={(v) => set("name", v)} placeholder="Luxury Apartment Beşiktaş" />

        <Text style={s.label}>Mülk Adı (Türkçe) *</Text>
        <TextInput style={s.input} value={form.nameTr} onChangeText={(v) => set("nameTr", v)} placeholder="Beşiktaş Lüks Daire" />

        <Text style={s.label}>Konum *</Text>
        <TextInput style={s.input} value={form.location} onChangeText={(v) => set("location", v)} placeholder="Beşiktaş, İstanbul" />

        <Text style={s.label}>Mülk Tipi *</Text>
        <View style={s.typeRow}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[s.typeBtn, form.type === t.value && s.typeBtnActive]}
              onPress={() => set("type", t.value)}
            >
              <Text style={[s.typeBtnText, form.type === t.value && s.typeBtnTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.section}>Finansal Detaylar</Text>

        <Text style={s.label}>Mülk Değeri (₺) *</Text>
        <TextInput style={s.input} value={form.value} onChangeText={(v) => set("value", v)} onBlur={calcTokenPrice} keyboardType="decimal-pad" placeholder="5000000" />

        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Toplam Token Adedi *</Text>
            <TextInput style={s.input} value={form.totalTokens} onChangeText={(v) => set("totalTokens", v)} onBlur={calcTokenPrice} keyboardType="number-pad" placeholder="5000" />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Token Fiyatı (₺) *</Text>
            <TextInput style={s.input} value={form.tokenPrice} onChangeText={(v) => set("tokenPrice", v)} keyboardType="decimal-pad" placeholder="1000" />
          </View>
        </View>

        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Aylık Kira (₺) *</Text>
            <TextInput style={s.input} value={form.monthlyRent} onChangeText={(v) => set("monthlyRent", v)} keyboardType="decimal-pad" placeholder="25000" />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Yıllık Getiri (%) *</Text>
            <TextInput style={s.input} value={form.annualYield} onChangeText={(v) => set("annualYield", v)} keyboardType="decimal-pad" placeholder="8.5" />
          </View>
        </View>

        {/* Özet */}
        {form.value && form.totalTokens && form.tokenPrice ? (
          <View style={s.preview}>
            <Text style={s.previewTitle}>📊 Özet</Text>
            <Text style={s.previewLine}>Mülk Değeri: ₺{parseFloat(form.value || "0").toLocaleString()}</Text>
            <Text style={s.previewLine}>Token: {form.totalTokens} adet × ₺{parseFloat(form.tokenPrice || "0").toLocaleString()}</Text>
            <Text style={s.previewLine}>Aylık Kira: ₺{parseFloat(form.monthlyRent || "0").toLocaleString()}</Text>
            <Text style={s.previewLine}>Yıllık Getiri: %{form.annualYield}</Text>
          </View>
        ) : null}

        <Text style={s.section}>Ek Bilgiler (İsteğe Bağlı)</Text>

        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Alan (m²)</Text>
            <TextInput style={s.input} value={form.sqm} onChangeText={(v) => set("sqm", v)} keyboardType="decimal-pad" placeholder="120" />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Yapım Yılı</Text>
            <TextInput style={s.input} value={form.yearBuilt} onChangeText={(v) => set("yearBuilt", v)} keyboardType="number-pad" placeholder="2020" />
          </View>
        </View>

        <Text style={s.label}>Açıklama (Türkçe)</Text>
        <TextInput style={[s.input, s.textarea]} value={form.descriptionTr} onChangeText={(v) => set("descriptionTr", v)} placeholder="Mülk hakkında detaylı bilgi..." multiline numberOfLines={4} />

        <View style={s.noteBox}>
          <Text style={s.noteText}>ℹ️ Mülk eklendikten sonra admin onayına gönderilir. Onaylandıktan sonra yatırımcılar token satın alabilir.</Text>
        </View>

        <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.submitBtnText}>🏠 Mülkü Admin Onayına Gönder</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const GREEN = "#1B4332"; const GOLD = "#D4AF37";
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FA" },
  successRoot: { flex: 1, backgroundColor: GREEN, justifyContent: "center", alignItems: "center", padding: 40 },
  successIcon: { fontSize: 64, color: GOLD, marginBottom: 16 },
  successTitle: { fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: 8 },
  successSub: { fontSize: 14, color: "rgba(255,255,255,0.75)", textAlign: "center", marginBottom: 32 },
  successBtn: { backgroundColor: GOLD, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14, marginBottom: 12 },
  successBtnText: { color: GREEN, fontWeight: "800", fontSize: 15 },
  successLink: { paddingVertical: 8 },
  successLinkText: { color: "rgba(255,255,255,0.75)", fontSize: 14 },
  header: { backgroundColor: GREEN, flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  logo: { fontSize: 20, fontWeight: "800", color: "#fff" },
  gold: { color: GOLD },
  headerTitle: { fontSize: 15, color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  errorBox: { backgroundColor: "#F8D7DA", borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: "#721C24", fontSize: 13 },
  section: { fontSize: 16, fontWeight: "800", color: "#212529", marginTop: 20, marginBottom: 14, borderBottomWidth: 1, borderBottomColor: "#E9ECEF", paddingBottom: 8 },
  label: { fontSize: 13, fontWeight: "600", color: "#495057", marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: "#DEE2E6", borderRadius: 10, padding: 13, fontSize: 15, marginBottom: 14, backgroundColor: "#fff" },
  textarea: { height: 100, textAlignVertical: "top" },
  row: { flexDirection: "row" },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  typeBtn: { borderWidth: 1.5, borderColor: "#DEE2E6", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: "#fff" },
  typeBtnActive: { borderColor: GREEN, backgroundColor: GREEN },
  typeBtnText: { fontSize: 13, fontWeight: "600", color: "#495057" },
  typeBtnTextActive: { color: "#fff" },
  preview: { backgroundColor: "#D4EDDA", borderRadius: 12, padding: 16, marginBottom: 14 },
  previewTitle: { fontSize: 14, fontWeight: "800", color: "#155724", marginBottom: 8 },
  previewLine: { fontSize: 13, color: "#155724", marginBottom: 4 },
  noteBox: { backgroundColor: "#D1ECF1", borderRadius: 10, padding: 12, marginBottom: 16 },
  noteText: { color: "#0C5460", fontSize: 13 },
  submitBtn: { backgroundColor: GREEN, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 4 },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
