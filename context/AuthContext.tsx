import { account, COLLECTIONS, databases, DB_ID } from "@/lib/appwrite";
import { makeRedirectUri } from "expo-auth-session";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { ID, Models, OAuthProvider, Permission, Query, Role } from "react-native-appwrite";

// Ensure web browser environment is ready
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    profile: any | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    register: (email: string, password: string, username: string) => Promise<void>;
    logout: () => Promise<void>;
    checkUsernameAvailable: (username: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const session = await account.get();
            setUser(session);

            // Fetch profile
            try {
                const profiles = await databases.listDocuments(
                    DB_ID,
                    COLLECTIONS.PROFILES,
                    [Query.equal("userId", session.$id)]
                );

                if (profiles.documents.length > 0) {
                    setProfile(profiles.documents[0]);
                } else if (session.name && !session.name.includes("@")) {
                    // Create profile if missing but user has a name (e.g. from OAuth)
                    // Note: Ideally we prompt for a username if it's auto-generated
                    await createProfile(session.$id, session.name, session.email);

                    // Re-fetch profile
                    const newProfiles = await databases.listDocuments(
                        DB_ID,
                        COLLECTIONS.PROFILES,
                        [Query.equal("userId", session.$id)]
                    );
                    if (newProfiles.documents.length > 0) {
                        setProfile(newProfiles.documents[0]);
                    }
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        } catch {
            setUser(null);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const createProfile = async (userId: string, username: string, email: string) => {
        try {
            await databases.createDocument(
                DB_ID,
                COLLECTIONS.PROFILES,
                ID.unique(),
                {
                    userId: userId,
                    username: username,
                    totalHours: 0.0,
                    streak: 0,
                    xp: 0,
                },
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.user(userId)),
                    Permission.delete(Role.user(userId)),
                ]
            );
        } catch (error) {
            console.error("Error creating profile:", error);
        }
    }

    const login = async (email: string, password: string) => {
        try {
            await account.createEmailPasswordSession(email, password);
        } catch (error: any) {
            if (!error.message?.includes("Creation of a session is prohibited when a session is active")) {
                throw error;
            }
        }

        await checkUser();
        router.replace("/(tabs)");
    };

    const loginWithGoogle = async () => {
        try {
            const redirectUri = makeRedirectUri({
                scheme: "compstudy",
            });

            // Use SDK's createOAuth2Token to generate the URL with the correct platform signature
            // Using object syntax as per official docs
            const url = await account.createOAuth2Token({
                provider: OAuthProvider.Google,
                success: redirectUri,
                failure: redirectUri,
            });

            if (!url) {
                throw new Error("Failed to create OAuth token");
            }

            // Open the browser session
            const result = await WebBrowser.openAuthSessionAsync(
                url.toString(),
                redirectUri
            );

            if (result.type === "success" && result.url) {
                const url = new URL(result.url);
                const secret = url.searchParams.get("secret");
                const userId = url.searchParams.get("userId");

                if (secret && userId) {
                    await account.createSession(userId, secret);
                    await checkUser();
                    router.replace("/(tabs)");
                } else {
                    throw new Error("Failed to extract session details");
                }
            }
        } catch (error: any) {
            console.error("Google OAuth error:", error);
            throw error;
        }
    };

    const register = async (email: string, password: string, username: string) => {
        const userId = ID.unique();

        try {
            // Check if username is available
            const isAvailable = await checkUsernameAvailable(username);
            if (!isAvailable) {
                throw new Error("Username is already taken");
            }

            // Create account
            await account.create(userId, email, password, username);

            // Create session
            await account.createEmailPasswordSession(email, password);

            // Create profile
            await createProfile(userId, username, email);

            await checkUser();
            router.replace("/(tabs)");
        } catch (error: any) {
            console.error("Registration error:", error);
            throw new Error(error.message || "Registration failed. Please try again.");
        }
    };

    const logout = async () => {
        await account.deleteSession("current");
        setUser(null);
        setProfile(null);
        router.replace("/login");
    };

    const checkUsernameAvailable = async (username: string): Promise<boolean> => {
        try {
            const profiles = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.PROFILES,
                [Query.equal("username", username)]
            );
            return profiles.documents.length === 0;
        } catch (error) {
            console.error("Error checking username:", error);
            return false;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                login,
                loginWithGoogle,
                register,
                logout,
                checkUsernameAvailable,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
