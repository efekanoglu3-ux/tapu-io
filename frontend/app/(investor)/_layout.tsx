import { Stack } from "expo-router";

export default function InvestorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="property-detail" />
      <Stack.Screen name="secondary-market" />
      <Stack.Screen name="transaction-history" />
    </Stack>
  );
}
