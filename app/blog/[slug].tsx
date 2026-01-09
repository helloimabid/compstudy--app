import { Colors } from "@/constants/Colors";
import { COLLECTIONS, databases, DB_ID } from "@/lib/appwrite";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Calendar, Clock } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
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
    content: string;
    excerpt: string;
    publishedAt: string;
    readTime: number;
    author: string;
}

export default function BlogPostScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPost();
    }, [slug]);

    const fetchPost = async () => {
        if (!slug) return;

        try {
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.BLOG_POSTS,
                [Query.equal("slug", slug)]
            );

            if (response.documents.length > 0) {
                setPost(response.documents[0] as unknown as BlogPost);
            }
        } catch (error) {
            console.error("Failed to fetch post:", error);
        } finally {
            setLoading(false);
        }
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

    if (!post) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={Colors.dark.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Post not found</Text>
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

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.postTitle}>{post.title}</Text>

                <View style={styles.postMeta}>
                    <View style={styles.metaItem}>
                        <Calendar size={14} color={Colors.dark.textMuted} />
                        <Text style={styles.metaText}>
                            {new Date(post.publishedAt).toLocaleDateString("en-US", {
                                month: "long",
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

                {post.author && (
                    <Text style={styles.author}>By {post.author}</Text>
                )}

                <View style={styles.divider} />

                <Text style={styles.content}>{post.content}</Text>
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
    postTitle: {
        fontSize: 28,
        fontWeight: "700",
        color: Colors.dark.text,
        lineHeight: 36,
        marginBottom: 16,
    },
    postMeta: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 8,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        color: Colors.dark.textMuted,
    },
    author: {
        fontSize: 14,
        color: Colors.dark.primary,
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.dark.border,
        marginVertical: 16,
    },
    content: {
        fontSize: 16,
        color: Colors.dark.text,
        lineHeight: 26,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyStateText: {
        color: Colors.dark.textMuted,
        fontSize: 16,
    },
});
