import { Stack } from "expo-router";

export default function RoomsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="create" options={{ title: "Create Room" }} />
            <Stack.Screen name="start" options={{ title: "Start Studying" }} />
            <Stack.Screen name="[roomId]" options={{ title: "Study Room" }} />
        </Stack>
    );
}
