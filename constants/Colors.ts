export const Colors = {
    dark: {
        background: "#050505",
        surface: "#0a0a0a",
        surfaceHighlight: "#111111",
        primary: "#6366f1", // indigo-500
        primaryForeground: "#ffffff",
        secondary: "#18181b", // zinc-900
        text: "#f4f4f5", // zinc-100
        textMuted: "#a1a1aa", // zinc-400
        border: "rgba(255, 255, 255, 0.1)",
        success: "#22c55e", // green-500
        warning: "#f97316", // orange-500
        error: "#ef4444", // red-500
        glass: "rgba(10, 10, 10, 0.8)",
        glassBorder: "rgba(255, 255, 255, 0.1)",
        gradients: {
            primary: ["#6366f1", "#9333ea"] as const, // indigo-500 to purple-600
            streak: ["#f97316", "#ef4444"] as const, // orange-500 to red-500
            success: ["#22c55e", "#10b981"] as const,
            gold: ["#fbbf24", "#d97706"] as const,
        }
    },
};
