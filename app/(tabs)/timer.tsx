import NativeStudyTimer from "@/components/NativeStudyTimer";
import { Colors } from "@/constants/Colors";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TimerScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <NativeStudyTimer />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
