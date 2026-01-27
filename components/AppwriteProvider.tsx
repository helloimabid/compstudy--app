import {
  account,
  avatars,
  COLLECTIONS,
  databases,
  DB_ID,
} from "@/lib/appwrite";
import { ExpoPushTokenManager } from "@/services/expoPushNotifications";
import { makeRedirectUri } from "expo-auth-session";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ID,
  Models,
  OAuthProvider,
  Permission,
  Query,
  Role,
} from "react-native-appwrite";

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  profile: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (
    email: string,
    password: string,
    username: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AppwriteProvider");
  }
  return context;
}

export function AppwriteProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null,
  );
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    await checkUser();
  };

  const checkUser = async () => {
    try {
      const session = await account.get();
      setUser(session);

      // Fetch profile
      try {
        const profiles = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.PROFILES,
          [Query.equal("userId", session.$id)],
        );

        if (profiles.documents.length > 0) {
          setProfile(profiles.documents[0]);
        } else if (session.name && !session.name.includes("@")) {
          // Create profile if missing but user has a name (e.g. from OAuth)
          // Use Appwrite's initials avatar as default
          const avatarUrl = avatars
            .getInitials(session.name, 200, 200)
            .toString();
          await createProfile(
            session.$id,
            session.name,
            session.email,
            avatarUrl,
          );

          // Re-fetch profile
          const newProfiles = await databases.listDocuments(
            DB_ID,
            COLLECTIONS.PROFILES,
            [Query.equal("userId", session.$id)],
          );
          if (newProfiles.documents.length > 0) {
            setProfile(newProfiles.documents[0]);
          }
        }

        try {
          await ExpoPushTokenManager.initializeToken(session.$id);
        } catch (error) {
          console.error("Failed to initialize push token:", error);
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

  const createProfile = async (
    userId: string,
    username: string,
    email: string,
    profilePicture?: string,
  ) => {
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
          ...(profilePicture && { profilePicture }),
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ],
      );
    } catch (error) {
      console.error("Error creating profile:", error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession(email, password);
    } catch (error: any) {
      if (
        !error.message?.includes(
          "Creation of a session is prohibited when a session is active",
        )
      ) {
        throw error;
      }
    }

    await checkUser();
    router.replace("/(tabs)");
  };

  const loginWithGoogle = async () => {
    try {
      // Create deep link that works across Expo environments
      // Ensure localhost is used for the hostname to validation error for success/failure URLs
      const deepLink = new URL(makeRedirectUri({ preferLocalhost: true }));
      const scheme = `${deepLink.protocol}//`; // e.g. 'exp://' or 'appwrite-callback-<PROJECT_ID>://'

      console.log("Deep link:", deepLink.toString());
      console.log("Scheme:", scheme);

      // Start OAuth flow
      const loginUrl = await account.createOAuth2Token({
        provider: OAuthProvider.Google,
        success: deepLink.toString(),
        failure: deepLink.toString(),
      });

      if (!loginUrl) {
        throw new Error("Failed to generate OAuth login URL");
      }

      console.log("Login URL:", loginUrl);

      // Open loginUrl and listen for the scheme redirect
      const result = await WebBrowser.openAuthSessionAsync(
        loginUrl.toString(),
        scheme,
      );

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const secret = url.searchParams.get("secret");
        const userId = url.searchParams.get("userId");

        console.log(
          "OAuth success - userId:",
          userId,
          "secret present:",
          !!secret,
        );

        if (secret && userId) {
          // Create session with OAuth credentials
          await account.createSession({
            userId,
            secret,
          });

          // Fetch user info to get profile picture
          const session = await account.get();

          // Check if profile exists, if not create with Google avatar
          const profiles = await databases.listDocuments(
            DB_ID,
            COLLECTIONS.PROFILES,
            [Query.equal("userId", session.$id)],
          );

          if (profiles.documents.length === 0 && session.name) {
            // Get initials avatar from Appwrite as fallback
            const avatarUrl = avatars
              .getInitials(session.name, 200, 200)
              .toString();
            await createProfile(
              session.$id,
              session.name,
              session.email,
              avatarUrl,
            );
          }

          await checkUser();
          router.replace("/(tabs)");
        } else {
          throw new Error("Failed to extract OAuth credentials from redirect");
        }
      } else if (result.type === "cancel") {
        console.log("User cancelled Google login");
      } else {
        console.error("OAuth result type:", result.type);
      }
    } catch (error: any) {
      console.error("Google OAuth error:", error);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    username: string,
  ) => {
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
      throw new Error(
        error.message || "Registration failed. Please try again.",
      );
    }
  };

  const logout = async () => {
    await ExpoPushTokenManager.clearToken();
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
        [Query.equal("username", username)],
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
        refetchUser: checkUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
