import { CustomDrawerContent } from "@/components/CustomDrawer";
import { Colors } from "@/constants/Colors";
import { SpacedRepetitionProvider } from "@/context/SpacedRepetitionContext";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { Drawer } from "expo-router/drawer";
import {
  Book,
  Brain,
  Clock,
  DoorOpen,
  Heart,
  Home,
  Menu,
  Settings,
  Trophy,
} from "lucide-react-native";
import { StyleSheet, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function MenuButton() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      style={styles.menuButton}
    >
      <Menu size={24} color={Colors.dark.text} />
    </TouchableOpacity>
  );
}

const screenOptions = {
  drawerActiveTintColor: Colors.dark.primary,
  drawerInactiveTintColor: Colors.dark.textMuted,
  drawerActiveBackgroundColor: "rgba(99, 102, 241, 0.1)",
  drawerLabelStyle: {
    fontSize: 15,
    fontWeight: "500" as const,
    marginLeft: -3,
  },
  drawerItemStyle: {
    borderRadius: 12,
    paddingHorizontal: 8,
    marginVertical: 2,
  },
  headerShown: true,
  headerStyle: {
    backgroundColor: Colors.dark.background,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTintColor: Colors.dark.text,
  headerTitleStyle: {
    fontWeight: "600" as const,
  },
  headerLeft: () => <MenuButton />,
  drawerStyle: {
    backgroundColor: Colors.dark.background,
    width: 280,
  },
};

export default function DrawerLayout() {
  return (
    <SpacedRepetitionProvider>
      <GestureHandlerRootView style={styles.container}>
        <Drawer
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={screenOptions}
        >
          <Drawer.Screen
            name="index"
            options={{
              drawerLabel: "Home",
              title: "Home",
              drawerIcon: ({ color, size }) => (
                <Home size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="rooms"
            options={{
              drawerLabel: "Study Rooms",
              title: "Study Rooms",
              drawerIcon: ({ color, size }) => (
                <DoorOpen size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="timer"
            options={{
              drawerLabel: "Focus Timer",
              title: "Focus Timer",
              drawerIcon: ({ color, size }) => (
                <Clock size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="curriculum"
            options={{
              drawerLabel: "My Subjects",
              title: "My Subjects",
              drawerIcon: ({ color, size }) => (
                <Book size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="review"
            options={{
              drawerLabel: "Spaced Repetition",
              title: "Spaced Repetition",
              drawerIcon: ({ color, size }) => (
                <Brain size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="support"
            options={{
              drawerLabel: "Support Us",
              title: "Support",
              drawerIcon: ({ color, size }) => (
                <Heart size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="leaderboard"
            options={{
              drawerLabel: "Leaderboard",
              title: "Leaderboard",
              drawerIcon: ({ color, size }) => (
                <Trophy size={size} color={color} />
              ),
            }}
          />
          {/* Hidden screens - accessible via other navigation */}
          <Drawer.Screen
            name="stats"
            options={{
              drawerItemStyle: { display: "none" },
              title: "Statistics",
            }}
          />
          <Drawer.Screen
            name="settings"
            options={{
              drawerLabel: "Settings",
              title: "Settings",
              drawerIcon: ({ color, size }) => (
                <Settings size={size} color={color} />
              ),
            }}
          />
        </Drawer>
      </GestureHandlerRootView>
    </SpacedRepetitionProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuButton: {
    marginLeft: 16,
    padding: 8,
  },
});
