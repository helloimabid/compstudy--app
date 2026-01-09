import { useAuth } from '@/components/AppwriteProvider';
import { COLLECTIONS, databases, DB_ID, ID, Permission, Query, Role } from '@/lib/appwrite';
import { useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, Clock, Download, Globe, Search, Star } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface PublicCurriculum {
    $id: string;
    userId: string;
    username: string;
    name: string;
    description?: string;
    category: string;
    targetHours?: number;
    subjects?: string;
    status: 'pending' | 'approved' | 'rejected';
    downloads: number;
    rating?: number;
    ratingCount?: number;
    submittedAt: string;
    tags?: string;
}

const CATEGORIES = [
    "Science", "Mathematics", "Computer Science", "Engineering",
    "Medicine", "Law", "Business", "Arts & Humanities",
    "Languages", "Test Prep", "Other"
];

const PublicCurriculumScreen = () => {
    const { user } = useAuth();
    const router = useRouter();

    const [curricula, setCurricula] = useState<PublicCurriculum[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [importingId, setImportingId] = useState<string | null>(null);

    const loadCurricula = useCallback(async () => {
        try {
            const queries = [
                Query.equal("status", "approved"),
                Query.orderDesc("downloads"),
                Query.limit(50),
            ];

            if (selectedCategory) {
                queries.push(Query.equal("category", selectedCategory));
            }

            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.PUBLIC_CURRICULUM,
                queries
            );
            setCurricula(response.documents as any);
        } catch (err) {
            console.error("Error loading curricula:", err);
            Alert.alert("Error", "Failed to load public curricula.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategory]);

    useEffect(() => {
        loadCurricula();
    }, [loadCurricula]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadCurricula();
    }, [loadCurricula]);

    const handleImport = async (curriculum: PublicCurriculum) => {
        if (!user) {
            Alert.alert("Login Required", "Please login to import curricula.");
            router.push('/login');
            return;
        }

        setImportingId(curriculum.$id);
        try {
            // Parse subjects
            const subjects = curriculum.subjects ? JSON.parse(curriculum.subjects) : [];

            // 1. Create Curriculum
            const newCurriculum = await databases.createDocument(
                DB_ID,
                COLLECTIONS.CURRICULUM,
                ID.unique(),
                {
                    userId: user.$id,
                    name: curriculum.name,
                    description: curriculum.description || "",
                    targetHours: curriculum.targetHours || 0,
                },
                [
                    Permission.read(Role.user(user.$id)),
                    Permission.update(Role.user(user.$id)),
                    Permission.delete(Role.user(user.$id)),
                ]
            );

            // 2. Create Subjects and Topics
            for (const subject of subjects) {
                const newSubject = await databases.createDocument(
                    DB_ID,
                    COLLECTIONS.SUBJECTS,
                    ID.unique(),
                    {
                        userId: user.$id,
                        curriculumId: newCurriculum.$id,
                        name: subject.name,
                        description: subject.description || "",
                        color: subject.color || "#6366f1",
                        targetHours: subject.targetHours || 0,
                    },
                    [
                        Permission.read(Role.user(user.$id)),
                        Permission.update(Role.user(user.$id)),
                        Permission.delete(Role.user(user.$id)),
                    ]
                );

                if (subject.topics && Array.isArray(subject.topics)) {
                    for (let i = 0; i < subject.topics.length; i++) {
                        const topicName = subject.topics[i];
                        if (topicName && topicName.trim()) {
                            await databases.createDocument(
                                DB_ID,
                                COLLECTIONS.TOPICS,
                                ID.unique(),
                                {
                                    userId: user.$id,
                                    subjectId: newSubject.$id,
                                    curriculumId: newCurriculum.$id,
                                    name: topicName.trim(),
                                    order: i,
                                    completed: false,
                                    studyTime: 0,
                                },
                                [
                                    Permission.read(Role.user(user.$id)),
                                    Permission.update(Role.user(user.$id)),
                                    Permission.delete(Role.user(user.$id)),
                                ]
                            );
                        }
                    }
                }
            }

            // 3. Update Download Count
            await databases.updateDocument(
                DB_ID,
                COLLECTIONS.PUBLIC_CURRICULUM,
                curriculum.$id,
                {
                    downloads: (curriculum.downloads || 0) + 1,
                }
            );

            Alert.alert("Success", "Curriculum imported successfully!");
            router.replace('/curriculum');
        } catch (err) {
            console.error("Error importing curriculum:", err);
            Alert.alert("Error", "Failed to import curriculum.");
        } finally {
            setImportingId(null);
        }
    };

    const filteredCurricula = curricula.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tags?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Globe size={20} color="#6366f1" style={{ marginRight: 8 }} />
                    <Text style={styles.headerTitle}>Discovery</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Search and Filters */}
            <View style={styles.filterSection}>
                <View style={styles.searchBar}>
                    <Search size={20} color="#94A3B8" style={{ marginLeft: 12 }} />
                    <TextInput
                        placeholder="Search curricula..."
                        placeholderTextColor="#94A3B8"
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    <TouchableOpacity
                        onPress={() => setSelectedCategory("")}
                        style={[styles.categoryBadge, !selectedCategory && styles.categoryBadgeActive]}
                    >
                        <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>All</Text>
                    </TouchableOpacity>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setSelectedCategory(cat)}
                            style={[styles.categoryBadge, selectedCategory === cat && styles.categoryBadgeActive]}
                        >
                            <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366f1" />
                </View>
            ) : (
                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
                    }
                >
                    {filteredCurricula.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <BookOpen size={48} color="#475569" />
                            <Text style={styles.emptyText}>No curricula found</Text>
                        </View>
                    ) : (
                        filteredCurricula.map((curriculum) => (
                            <View key={curriculum.$id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.titleContainer}>
                                        <Text style={styles.cardTitle}>{curriculum.name}</Text>
                                        <Text style={styles.cardAuthor}>by {curriculum.username}</Text>
                                    </View>
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{curriculum.category}</Text>
                                    </View>
                                </View>

                                <Text style={styles.cardDescription} numberOfLines={2}>
                                    {curriculum.description || "No description provided"}
                                </Text>

                                <View style={styles.statsRow}>
                                    <View style={styles.stat}>
                                        <Clock size={14} color="#94A3B8" />
                                        <Text style={styles.statText}>{curriculum.targetHours || 0}h</Text>
                                    </View>
                                    <View style={styles.stat}>
                                        <Download size={14} color="#94A3B8" />
                                        <Text style={styles.statText}>{curriculum.downloads || 0}</Text>
                                    </View>
                                    {(curriculum.rating ?? 0) > 0 && (
                                        <View style={styles.stat}>
                                            <Star size={14} color="#F59E0B" fill="#F59E0B" />
                                            <Text style={[styles.statText, { color: '#F59E0B' }]}>
                                                {curriculum.rating?.toFixed(1)}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <TouchableOpacity
                                    style={[styles.importButton, importingId === curriculum.$id && styles.importButtonDisabled]}
                                    onPress={() => handleImport(curriculum)}
                                    disabled={importingId !== null}
                                >
                                    {importingId === curriculum.$id ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Download size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                                            <Text style={styles.importButtonText}>Import Curriculum</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#0F172A',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    filterSection: {
        backgroundColor: '#0F172A',
        paddingBottom: 15,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        marginHorizontal: 20,
        borderRadius: 12,
        height: 45,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
        paddingHorizontal: 12,
    },
    categoryScroll: {
        paddingHorizontal: 15,
    },
    categoryBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1E293B',
        marginHorizontal: 5,
        marginBottom: 5,
    },
    categoryBadgeActive: {
        backgroundColor: '#6366f1',
    },
    categoryText: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '500',
    },
    categoryTextActive: {
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 16,
        marginTop: 12,
    },
    card: {
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    titleContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    cardAuthor: {
        fontSize: 12,
        color: '#6366f1',
    },
    badge: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        color: '#6366f1',
        fontSize: 10,
        fontWeight: '600',
    },
    cardDescription: {
        fontSize: 14,
        color: '#94A3B8',
        lineHeight: 20,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 15,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 12,
        color: '#94A3B8',
    },
    importButton: {
        backgroundColor: '#6366f1',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    importButtonDisabled: {
        opacity: 0.7,
    },
    importButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default PublicCurriculumScreen;
