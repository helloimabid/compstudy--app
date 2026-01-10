import { useAuth } from "@/components/AppwriteProvider";
import { Colors } from "@/constants/Colors";
import { BUCKET_ID, storage } from "@/lib/appwrite";
import {
    DrawerContentComponentProps,
    DrawerContentScrollView,
    DrawerItemList,
} from "@react-navigation/drawer";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
    BarChart2,
    Book,
    BookOpen,
    Clock,
    DoorOpen,
    FileText,
    Heart,
    Home,
    LogOut,
    Trophy,
    User,
} from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function CustomDrawerContent(props: DrawerContentComponentProps) {
    const { user, profile, logout } = useAuth();

    return (
        <View style={styles.container}>
            <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    {user ? (
                        <>
                            <View style={styles.avatar}>
                                {profile?.profilePicture ? (
                                    <Image
                                        source={{
                                            uri: profile.profilePicture.startsWith("http")
                                                ? profile.profilePicture
                                                : storage.getFilePreview(BUCKET_ID, profile.profilePicture).toString(),
                                        }}
                                        style={styles.avatarImage}
                                        contentFit="cover"
                                        transition={1000}
                                    />
                                ) : (
                                    <Text style={styles.avatarText}>
                                        {profile?.username?.[0]?.toUpperCase() || user.name?.[0]?.toUpperCase() || "?"}
                                    </Text>
                                )}
                            </View>
                            <Text style={styles.username}>{profile?.username || user.name || "Student"}</Text>
                            <Text style={styles.email}>{user.email}</Text>
                        </>
                    ) : (
                        <>
                            <View style={styles.logoContainer}>
                                <View style={styles.logo}>
                                <Image source={require("@/assets/images/favicon.png")} style={styles.logoImage} contentFit="cover" transition={1000} />
                                    </View>
                            </View>
                            <Text style={styles.appName}>CompStudy</Text>
                            <Text style={styles.tagline}>Study Alone, Compete Together</Text>
                        </>
                    )}
                </View>

                {/* Navigation Items */}
                <DrawerItemList {...props} />

                {/* Extra Links */}
                <View style={styles.extraLinks}>
                    <Text style={styles.sectionTitle}>More</Text>

                    <TouchableOpacity
                        style={styles.extraLink}
                        onPress={() => router.push("/blog")}
                    >
                        <FileText size={20} color={Colors.dark.textMuted} />
                        <Text style={styles.extraLinkText}>Blog</Text>
                    </TouchableOpacity>

                    {user && (
                        <TouchableOpacity
                            style={styles.extraLink}
                            onPress={() => router.push(`/profile/${user.$id}`)}
                        >
                            <User size={20} color={Colors.dark.textMuted} />
                            <Text style={styles.extraLinkText}>My Profile</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.extraLink}
                        onPress={() => router.push("/support")}
                    >
                        <Heart size={20} color={Colors.dark.textMuted} />
                        <Text style={styles.extraLinkText}>Support CompStudy</Text>
                    </TouchableOpacity>
                </View>
            </DrawerContentScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                {user ? (
                    <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                        <LogOut size={20} color={Colors.dark.error} />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => router.push("/login")}
                    >
                        <Text style={styles.loginButtonText}>Login / Register</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

export const drawerScreenOptions = {
    drawerActiveTintColor: Colors.dark.primary,
    drawerInactiveTintColor: Colors.dark.textMuted,
    drawerActiveBackgroundColor: "rgba(99, 102, 241, 0.1)",
    drawerLabelStyle: {
        fontSize: 15,
        fontWeight: "500" as const,
        marginLeft: -16,
    },
    drawerItemStyle: {
        borderRadius: 12,
        paddingHorizontal: 8,
        marginVertical: 2,
    },
    headerShown: false,
    drawerStyle: {
        backgroundColor: Colors.dark.background,
        width: 280,
    },
};

export const drawerIcons = {
    Home: Home,
    Rooms: DoorOpen,
    Timer: Clock,
    Subjects: Book,
    Ranks: Trophy,
    Stats: BarChart2,
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    scrollContent: {
        paddingTop: 0,
    },
    header: {
        padding: 20,
        paddingTop: 48,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
        marginBottom: 8,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.dark.primary,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
        overflow: "hidden", // Ensure image clips to circle
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    avatarText: {
        fontSize: 28,
        fontWeight: "700",
        color: "#fff",
    },
    username: {
        fontSize: 18,
        fontWeight: "600",
        color: Colors.dark.text,
        marginBottom: 4,
    },
    email: {
        fontSize: 13,
        color: Colors.dark.textMuted,
    },


    logoContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    logo: {
        width: "100%",
        height: "100%",
    },
    logoImage: {
        width: "100%",
        height: "100%",
    },
    
    appName: {
        fontSize: 22,
        fontWeight: "700",
        color: Colors.dark.text,
        marginBottom: 4,
    },
    tagline: {
        fontSize: 13,
        color: Colors.dark.textMuted,
    },
    extraLinks: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "600",
        color: Colors.dark.textMuted,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    extraLink: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
        gap: 16,
    },
    extraLinkText: {
        fontSize: 15,
        color: Colors.dark.textMuted,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
    },
    logoutText: {
        fontSize: 15,
        color: Colors.dark.error,
        fontWeight: "500",
    },
    loginButton: {
        backgroundColor: Colors.dark.primary,
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
    },
    loginButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },
});
