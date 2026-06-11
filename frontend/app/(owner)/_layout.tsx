import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function OwnerLayout() {
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
      <Tabs.Screen name="my-properties" options={{ title: "Mülklerim", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }} />
      <Tabs.Screen name="add-property" options={{ title: "Mülk Ekle", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>➕</Text> }} />
      <Tabs.Screen name="earnings" options={{ title: "Kazançlar", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💰</Text> }} />
    </Tabs>
  );
}
