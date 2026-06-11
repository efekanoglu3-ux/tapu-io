import { useState } from "react";
import { useRouter } from "expo-router";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from "react-native";
import { useAuthStore } from "../../src/store/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!email || !password) { setError("Tüm alanları doldurun"); return; }
    setError("");
    try {
      const result = await login(email, password);
      if (result?.role === "ADMIN" || result?.role === "SUPER_ADMIN") {
        router.replace("/(admin)/dashboard" as any);
      } else if (result?.role === "OWNER") {
        router.replace("/(owner)/my-properties" as any);
      } else {
        router.replace("/(investor)/(tabs)/market" as any);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || "Giriş başarısız");
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.card}>
        <Text style={s.logo}>TAPU<Text style={s.gold}>.IO</Text></Text>
        <Text style={s.title}>Hoş Geldiniz</Text>
        <Text style={s.sub}>Hesabınıza giriş yapın</Text>

        {error ? <View style={s.errorBox}><Text style={s.errorText}>⚠ {error}</Text></View> : null}

        <Text style={s.label}>E-posta</Text>
        <TextInput style={s.input} placeholder="ornek@mail.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={s.label}>Şifre</Text>
        <TextInput style={s.input} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Giriş Yap</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={s.link}>Hesabın yok mu? <Text style={s.linkBold}>Ücretsiz Kaydol</Text></Text>
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
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 36, width: "100%", maxWidth: 420, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 },
  logo: { fontSize: 28, fontWeight: "800", color: GREEN, textAlign: "center", marginBottom: 8 },
  gold: { color: GOLD },
  title: { fontSize: 24, fontWeight: "800", color: "#212529", textAlign: "center", marginBottom: 4 },
  sub: { fontSize: 14, color: "#6C757D", textAlign: "center", marginBottom: 28 },
  errorBox: { backgroundColor: "#FFF3CD", borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: "#856404", fontSize: 13 },
  label: { fontSize: 13, fontWeight: "600", color: "#495057", marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: "#DEE2E6", borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 16, backgroundColor: "#F8F9FA" },
  btn: { backgroundColor: GREEN, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 4, marginBottom: 20 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  link: { textAlign: "center", color: "#6C757D", fontSize: 14 },
  linkBold: { color: GREEN, fontWeight: "700" },
  backBtn: { marginTop: 20, alignItems: "center" },
  backText: { color: "#ADB5BD", fontSize: 13 },
});
