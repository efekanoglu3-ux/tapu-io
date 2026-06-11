import { useState } from "react";
import { useRouter } from "expo-router";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "INVESTOR" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleRegister() {
    if (!form.name || !form.email || !form.password) { setError("Tüm alanları doldurun"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.errors?.[0]?.msg || "Kayıt başarısız");
        return;
      }
      router.replace("/(investor)/market");
    } catch {
      setError("Sunucuya bağlanılamadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.card}>
        <Text style={s.logo}>TAPU<Text style={s.gold}>.IO</Text></Text>
        <Text style={s.title}>Hesap Oluştur</Text>
        <Text style={s.sub}>Gayrimenkule yatırım yapmaya başlayın</Text>

        {error ? <View style={s.errorBox}><Text style={s.errorText}>⚠ {error}</Text></View> : null}

        {/* Rol seçimi */}
        <View style={s.roleRow}>
          {[
            { val: "INVESTOR", label: "🏦 Yatırımcı", desc: "Mülklere pay satın al" },
            { val: "OWNER", label: "🏠 Mülk Sahibi", desc: "Mülkünü tokenize et" },
          ].map((r) => (
            <TouchableOpacity
              key={r.val}
              style={[s.roleCard, form.role === r.val && s.roleCardActive]}
              onPress={() => set("role", r.val)}
            >
              <Text style={[s.roleLabel, form.role === r.val && s.roleLabelActive]}>{r.label}</Text>
              <Text style={[s.roleDesc, form.role === r.val && s.roleDescActive]}>{r.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Ad Soyad</Text>
        <TextInput style={s.input} placeholder="Ali Yılmaz" value={form.name} onChangeText={(v) => set("name", v)} />

        <Text style={s.label}>E-posta</Text>
        <TextInput style={s.input} placeholder="ornek@mail.com" value={form.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" autoCapitalize="none" />

        <Text style={s.label}>Şifre</Text>
        <TextInput style={s.input} placeholder="En az 8 karakter" value={form.password} onChangeText={(v) => set("password", v)} secureTextEntry />
        <Text style={s.hint}>Büyük harf, küçük harf ve rakam içermeli</Text>

        <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Hesap Oluştur →</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={s.link}>Zaten hesabın var mı? <Text style={s.linkBold}>Giriş Yap</Text></Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.backBtn} onPress={() => router.replace("/")}>
          <Text style={s.backText}>← Ana Sayfa</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const GREEN = "#1B4332"; const GOLD = "#D4AF37";

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREEN },
  content: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 36, width: "100%", maxWidth: 440, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 },
  logo: { fontSize: 28, fontWeight: "800", color: GREEN, textAlign: "center", marginBottom: 8 },
  gold: { color: GOLD },
  title: { fontSize: 24, fontWeight: "800", color: "#212529", textAlign: "center", marginBottom: 4 },
  sub: { fontSize: 14, color: "#6C757D", textAlign: "center", marginBottom: 24 },
  errorBox: { backgroundColor: "#FFF3CD", borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: "#856404", fontSize: 13 },
  roleRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  roleCard: { flex: 1, borderWidth: 1.5, borderColor: "#DEE2E6", borderRadius: 10, padding: 12, alignItems: "center" },
  roleCardActive: { borderColor: GREEN, backgroundColor: "#E8F5E9" },
  roleLabel: { fontSize: 13, fontWeight: "700", color: "#495057", marginBottom: 2 },
  roleLabelActive: { color: GREEN },
  roleDesc: { fontSize: 11, color: "#ADB5BD", textAlign: "center" },
  roleDescActive: { color: "#2D6A4F" },
  label: { fontSize: 13, fontWeight: "600", color: "#495057", marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: "#DEE2E6", borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 14, backgroundColor: "#F8F9FA" },
  hint: { fontSize: 11, color: "#ADB5BD", marginTop: -10, marginBottom: 14 },
  btn: { backgroundColor: GREEN, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 4, marginBottom: 20 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  link: { textAlign: "center", color: "#6C757D", fontSize: 14 },
  linkBold: { color: GREEN, fontWeight: "700" },
  backBtn: { marginTop: 20, alignItems: "center" },
  backText: { color: "#ADB5BD", fontSize: 13 },
});
