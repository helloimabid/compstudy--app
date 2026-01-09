import { Colors } from "@/constants/Colors";
import { COLLECTIONS, databases, DB_ID } from "@/lib/appwrite";
import { router } from "expo-router";
import { ArrowLeft, Calendar, Clock } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";

interface BlogPost {
    $id: string;
    slug: string;
    title: string;
    excerpt: string;
    publishedAt: string;
    readTime: number;
}

export default function BlogListScreen() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPosts = async () => {
        try {
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.BLOG_POSTS,
                [Query.orderDesc("publishedAt"), Query.limit(20)]
            );
            setPosts(response.documents as unknown as BlogPost[]);
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPosts();
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Blog</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.dark.primary}
                    />
                }
            >
                {posts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No blog posts yet.</Text>
                    </View>
                ) : (
                    posts.map((post) => (
                        <TouchableOpacity
                            key={post.$id}
                            style={styles.postCard}
                            onPress={() => router.push({ pathname: "/blog/[slug]", params: { slug: post.slug } })}
                        >
                            <Text style={styles.postTitle}>{post.title}</Text>
                            <Text style={styles.postExcerpt} numberOfLines={2}>
                                {post.excerpt}
                            </Text>
                            <View style={styles.postMeta}>
                                <View style={styles.metaItem}>
                                    <Calendar size={14} color={Colors.dark.textMuted} />
                                    <Text style={styles.metaText}>
                                        {new Date(post.publishedAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Clock size={14} color={Colors.dark.textMuted} />
                                    <Text style={styles.metaText}>{post.readTime || 5} min read</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: Colors.dark.text,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    postCard: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    postTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: Colors.dark.text,
        marginBottom: 8,
    },
    postExcerpt: {
        fontSize: 14,
        color: Colors.dark.textMuted,
        lineHeight: 20,
        marginBottom: 12,
    },
    postMeta: {
        flexDirection: "row",
        gap: 16,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    metaText: {
        fontSize: 12,
        color: Colors.dark.textMuted,
    },
    emptyState: {
        padding: 48,
        alignItems: "center",
    },
    emptyStateText: {
        color: Colors.dark.textMuted,
        fontSize: 14,
    },
});
