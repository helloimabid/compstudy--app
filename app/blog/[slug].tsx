import { Colors } from "@/constants/Colors";
import { COLLECTIONS, databases, DB_ID } from "@/lib/appwrite";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Tag,
  User,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
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
  category: string;
  tags: string[];
  viewCount: number;
}

// Category colors matching web
const categoryColors: Record<
  string,
  { bg: string; text: string; hex: string }
> = {
  Productivity: {
    bg: "rgba(99, 102, 241, 0.1)",
    text: "text-indigo-400",
    hex: "#818cf8",
  },
  "Study Tips": {
    bg: "rgba(168, 85, 247, 0.1)",
    text: "text-purple-400",
    hex: "#c084fc",
  },
  Focus: {
    bg: "rgba(16, 185, 129, 0.1)",
    text: "text-emerald-400",
    hex: "#34d399",
  },
  Community: {
    bg: "rgba(14, 165, 233, 0.1)",
    text: "text-sky-400",
    hex: "#38bdf8",
  },
  Wellness: {
    bg: "rgba(245, 158, 11, 0.1)",
    text: "text-amber-400",
    hex: "#fbbf24",
  },
};

function getColors(category: string) {
  return categoryColors[category] || categoryColors.Productivity;
}

// Markdown-like content renderer
function ArticleContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <View key={`list-${elements.length}`} style={styles.listContainer}>
          {listItems.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.listItemText}>{formatInline(item)}</Text>
            </View>
          ))}
        </View>
      );
      listItems = [];
    }
  };

  const formatInline = (text: string) => {
    // Simple removal of markdown syntax for now, or basic handling
    // React Native doesn't support inline HTML/complex styling easily without a library
    // We'll just strip the ** and * markers but keep text
    return text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <Text key={index} style={styles.h2}>
          {trimmed.replace("## ", "")}
        </Text>
      );
    } else if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <Text key={index} style={styles.h3}>
          {trimmed.replace("### ", "")}
        </Text>
      );
    } else if (trimmed.startsWith("# ")) {
      flushList();
      // Skip main title
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listItems.push(trimmed.slice(2));
    } else if (/^\d+\.\s/.test(trimmed)) {
      listItems.push(trimmed.replace(/^\d+\.\s/, ""));
    } else if (trimmed === "") {
      flushList();
      elements.push(<View key={index} style={{ height: 16 }} />);
    } else {
      flushList();
      elements.push(
        <Text key={index} style={styles.paragraph}>
          {formatInline(trimmed)}
        </Text>
      );
    }
  });

  flushList();

  return <View>{elements}</View>;
}

export default function BlogPostScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();

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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={Colors.dark.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const colors = getColors(post.category);
  const publishedDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Background Blur Effect */}
          <LinearGradient
            colors={[colors.bg, "transparent"]}
            style={styles.heroBackground}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          <SafeAreaView edges={["top"]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.heroBackButton}
            >
              <ArrowLeft size={20} color={Colors.dark.textMuted} />
              <Text style={styles.backButtonText}>Back to Blog</Text>
            </TouchableOpacity>

            <View style={styles.heroContent}>
              <View style={styles.metaRow}>
                <View
                  style={[styles.categoryBadge, { backgroundColor: colors.bg }]}
                >
                  <Text style={[styles.categoryText, { color: colors.hex }]}>
                    {post.category || "General"}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Calendar size={12} color={Colors.dark.textMuted} />
                  <Text style={styles.metaText}>{publishedDate}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Clock size={12} color={Colors.dark.textMuted} />
                  <Text style={styles.metaText}>
                    {post.readTime || 5} min read
                  </Text>
                </View>
              </View>

              <Text style={styles.title}>{post.title}</Text>
              <Text style={styles.excerpt}>{post.excerpt}</Text>

              <View style={styles.authorRow}>
                <View style={styles.authorInfo}>
                  <View style={styles.authorAvatar}>
                    <User size={16} color={Colors.dark.textMuted} />
                  </View>
                  <View>
                    <Text style={styles.authorName}>{post.author}</Text>
                    <Text style={styles.authorLabel}>Author</Text>
                  </View>
                </View>
                <View style={styles.statsRow}>
                  {post.viewCount > 0 && (
                    <View style={styles.metaItem}>
                      <Eye size={14} color={Colors.dark.textMuted} />
                      <Text style={styles.metaText}>
                        {post.viewCount} views
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <ArticleContent content={post.content} />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <View style={styles.tagIcon}>
                <Tag size={16} color={Colors.dark.textMuted} />
              </View>
              <View style={styles.tagsList}>
                {post.tags.map((tag, i) => (
                  <View key={i} style={styles.tagBadge}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505", // Deep black background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    position: "relative",
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  heroBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    opacity: 0.6,
  },
  heroBackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
    marginTop: 16,
  },
  backButtonText: {
    color: Colors.dark.textMuted,
    fontSize: 14,
  },
  heroContent: {
    gap: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: Colors.dark.text,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  excerpt: {
    fontSize: 16,
    color: Colors.dark.textMuted,
    lineHeight: 24,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  authorName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.dark.text,
  },
  authorLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  contentSection: {
    padding: 24,
  },
  h2: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.dark.text,
    marginTop: 32,
    marginBottom: 16,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.text,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: "#d4d4d8", // zinc-300ish
    lineHeight: 28,
    marginBottom: 16,
  },
  listContainer: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  listItem: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  bulletPoint: {
    color: Colors.dark.primary,
    fontSize: 16,
    marginTop: 4,
  },
  listItemText: {
    fontSize: 16,
    color: "#d4d4d8",
    lineHeight: 26,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
  },
  tagIcon: {
    marginTop: 6,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    flex: 1,
  },
  tagBadge: {
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  tagText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
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
