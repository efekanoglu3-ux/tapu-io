import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "../src/store/authStore";

export default function RootLayout() {
  const { hydrate, hydrated } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1B4332" }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(investor)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(owner)" />
      </Stack>
    </>
  );
}
