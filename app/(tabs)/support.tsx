import * as Clipboard from 'expo-clipboard';
import { Check, Copy, Heart, Share2, Smartphone, Sparkles, Star, Wallet, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DONATION_TIERS = [
    {
        id: "small",
        name: "Cup of Tea",
        amount: "৳50",
        emoji: "🍵",
        description: "A quick pick-me-up",
        color: ["rgba(245, 158, 11, 0.1)", "rgba(249, 115, 22, 0.1)"],
        borderColor: "rgba(245, 158, 11, 0.3)",
        textColor: "#FBBF24",
    },
    {
        id: "medium",
        name: "Lunch Treat",
        amount: "৳100",
        emoji: "🍱",
        description: "Keep the code flowing",
        color: ["rgba(249, 115, 22, 0.1)", "rgba(239, 68, 68, 0.1)"],
        borderColor: "rgba(249, 115, 22, 0.3)",
        textColor: "#FB923C",
        popular: true,
    },
    {
        id: "large",
        name: "Night Snacks",
        amount: "৳200",
        emoji: "🍕",
        description: "Fuel for late-night coding",
        color: ["rgba(239, 68, 68, 0.1)", "rgba(236, 72, 153, 0.1)"],
        borderColor: "rgba(239, 68, 68, 0.3)",
        textColor: "#F87171",
    },
    {
        id: "xl",
        name: "Champion",
        amount: "৳500",
        emoji: "🏆",
        description: "You're amazing!",
        color: ["rgba(236, 72, 153, 0.1)", "rgba(168, 85, 247, 0.1)"],
        borderColor: "rgba(236, 72, 153, 0.3)",
        textColor: "#F472B6",
    },
];

const SUPPORTERS = [
    { name: "Anonymous", amount: "৳100", message: "Love this app!" },
    { name: "StudyHero", amount: "৳200", message: "Keep up the great work!" },
    { name: "FocusMaster", amount: "৳50", message: "☕" },
];

const BKASH_NUMBER = "01918742161";

const SupportScreen = () => {
    const [selectedTier, setSelectedTier] = useState("medium");
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await Clipboard.setStringAsync(BKASH_NUMBER);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: 'I love using CompStudy for focused studying! Check it out at https://compstudy.com',
            });
        } catch (error) {
            console.error(error);
        }
    };

    const currentTier = DONATION_TIERS.find(t => t.id === selectedTier) || DONATION_TIERS[1];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Heart size={32} color="#F472B6" />
                    </View>
                    <Text style={styles.title}>Support <Text style={styles.highlight}>CompStudy</Text></Text>
                    <Text style={styles.description}>
                        CompStudy is built with love and dedication. If you find it helpful,
                        consider supporting to keep the development going!
                    </Text>
                </View>

                {/* Donation Tiers Grid */}
                <View style={styles.grid}>
                    {DONATION_TIERS.map((tier) => (
                        <TouchableOpacity
                            key={tier.id}
                            style={[
                                styles.tierCard,
                                { borderColor: selectedTier === tier.id ? tier.borderColor : 'rgba(255,255,255,0.05)' },
                                selectedTier === tier.id && { backgroundColor: tier.color[0] }
                            ]}
                            onPress={() => setSelectedTier(tier.id)}
                        >
                            {tier.popular && (
                                <View style={styles.popularBadge}>
                                    <Text style={styles.popularText}>Popular</Text>
                                </View>
                            )}
                            <Text style={styles.emoji}>{tier.emoji}</Text>
                            <Text style={styles.amount}>{tier.amount}</Text>
                            <Text style={styles.tierName}>{tier.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* bKash Payment Section */}
                <View style={styles.paymentSection}>
                    <View style={styles.bkashHeader}>
                        <View style={styles.bkashIcon}>
                            <Wallet size={24} color="#FFF" />
                        </View>
                        <View>
                            <Text style={styles.paymentTitle}>Send via bKash</Text>
                            <Text style={styles.paymentSubtitle}>Personal Number</Text>
                        </View>
                    </View>

                    <View style={styles.numberContainer}>
                        <View style={styles.numberBox}>
                            <Text style={styles.bkashNumber}>{BKASH_NUMBER}</Text>
                        </View>
                        <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
                            {copied ? <Check size={20} color="#4ADE80" /> : <Copy size={20} color="#F472B6" />}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.instructions}>
                        <View style={styles.instructionHeader}>
                            <Smartphone size={16} color="#F472B6" />
                            <Text style={styles.instructionTitle}>How to Send</Text>
                        </View>
                        {[
                            "Open bKash app or dial *247#",
                            "Select \"Send Money\"",
                            `Enter Number: ${BKASH_NUMBER}`,
                            `Enter Amount: ${currentTier.amount}`,
                            "Reference: \"CompStudy Support\"",
                            "Confirm and enter PIN"
                        ].map((step, idx) => (
                            <View key={idx} style={styles.stepRow}>
                                <Text style={styles.stepNumber}>{idx + 1}.</Text>
                                <Text style={styles.stepText}>{step}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.selectedTierInfo}>
                        <Text style={styles.footerText}>
                            Selected: <Text style={styles.white}>{currentTier.name}</Text> - <Text style={styles.pink}>{currentTier.amount}</Text>
                        </Text>
                    </View>
                </View>

                {/* Value Props */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Sparkles size={20} color="#FBBF24" />
                        <Text style={styles.sectionTitle}>What Your Support Helps</Text>
                    </View>
                    <View style={styles.propsContainer}>
                        <View style={styles.propCard}>
                            <Zap size={20} color="#818CF8" />
                            <Text style={styles.propTitle}>Server Costs</Text>
                            <Text style={styles.propDesc}>Fast & reliable service</Text>
                        </View>
                        <View style={styles.propCard}>
                            <Star size={20} color="#4ADE80" />
                            <Text style={styles.propTitle}>New Features</Text>
                            <Text style={styles.propDesc}>Development fuel</Text>
                        </View>
                    </View>
                </View>

                {/* Sharing */}
                <View style={styles.shareSection}>
                    <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                        <Share2 size={20} color="#4ADE80" />
                        <Text style={styles.shareText}>Share with Friends</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Supporters */}
                <View style={styles.supportersSection}>
                    <View style={styles.sectionHeader}>
                        <Heart size={20} color="#F472B6" />
                        <Text style={styles.sectionTitle}>Recent Supporters</Text>
                    </View>
                    {SUPPORTERS.map((s, idx) => (
                        <View key={idx} style={styles.supporterCard}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{s.name[0]}</Text>
                            </View>
                            <View style={styles.supporterInfo}>
                                <Text style={styles.supporterName}>{s.name}</Text>
                                <Text style={styles.supporterMsg}>"{s.message}"</Text>
                            </View>
                            <Text style={styles.supporterAmt}>{s.amount}</Text>
                        </View>
                    ))}
                    <Text style={styles.thankYou}>Thank you to all our supporters! 💛</Text>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerMsg}>Every taka counts! Thank you for supporting CompStudy. ❤️</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(244, 114, 182, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(244, 114, 182, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFF',
        textAlign: 'center',
    },
    highlight: {
        color: '#6366f1',
    },
    description: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 30,
    },
    tierCard: {
        width: '48%',
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        position: 'relative',
    },
    popularBadge: {
        position: 'absolute',
        top: -10,
        left: '50%',
        marginLeft: -30,
        backgroundColor: '#EC4899',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        zIndex: 1,
    },
    popularText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    emoji: {
        fontSize: 24,
        marginBottom: 8,
    },
    amount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    tierName: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    paymentSection: {
        backgroundColor: 'rgba(244, 114, 182, 0.05)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(244, 114, 182, 0.2)',
        marginBottom: 30,
    },
    bkashHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    bkashIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#E2136E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    paymentSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
    },
    numberContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    numberBox: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(244, 114, 182, 0.2)',
        justifyContent: 'center',
    },
    bkashNumber: {
        color: '#F472B6',
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'monospace',
        textAlign: 'center',
        letterSpacing: 2,
    },
    copyButton: {
        width: 54,
        height: 54,
        borderRadius: 12,
        backgroundColor: 'rgba(244, 114, 182, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(244, 114, 182, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructions: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 16,
        padding: 16,
    },
    instructionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 12,
    },
    instructionTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    stepRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    stepNumber: {
        color: '#F472B6',
        fontWeight: '600',
    },
    stepText: {
        color: '#94A3B8',
        fontSize: 13,
        flex: 1,
    },
    selectedTierInfo: {
        marginTop: 15,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
        color: '#64748B',
    },
    white: { color: '#FFF' },
    pink: { color: '#F472B6', fontWeight: '700' },
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    propsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    propCard: {
        flex: 1,
        backgroundColor: '#0F172A',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    propTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 4,
    },
    propDesc: {
        color: '#64748B',
        fontSize: 11,
    },
    shareSection: {
        marginBottom: 30,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#0F172A',
    },
    shareText: {
        color: '#FFF',
        fontWeight: '600',
    },
    supportersSection: {
        backgroundColor: '#0F172A',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    supporterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    supporterInfo: {
        flex: 1,
        marginLeft: 12,
    },
    supporterName: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    supporterMsg: {
        color: '#64748B',
        fontSize: 11,
    },
    supporterAmt: {
        color: '#F472B6',
        fontWeight: '700',
        fontSize: 13,
    },
    thankYou: {
        textAlign: 'center',
        color: '#64748B',
        fontSize: 12,
        marginTop: 15,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerMsg: {
        textAlign: 'center',
        color: '#475569',
        fontSize: 12,
    }
});

export default SupportScreen;
