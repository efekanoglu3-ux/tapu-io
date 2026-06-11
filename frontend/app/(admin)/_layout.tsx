import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1B4332",
        tabBarInactiveTintColor: "#ADB5BD",
        tabBarStyle: { borderTopColor: "#E9ECEF", paddingTop: 6, paddingBottom: 6, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text> }} />
      <Tabs.Screen name="users" options={{ title: "Kullanıcılar", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👥</Text> }} />
      <Tabs.Screen name="properties" options={{ title: "Mülkler", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }} />
      <Tabs.Screen name="rent" options={{ title: "Kira", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💸</Text> }} />
    </Tabs>
  );
}
