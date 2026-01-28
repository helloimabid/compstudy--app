/**
 * Review Stack Layout
 * Handles navigation within the spaced repetition feature
 */

import { SpacedRepetitionProvider } from "@/context/SpacedRepetitionContext";
import { Stack } from "expo-router";
import React from "react";

export default function ReviewLayout() {
  return (
    <SpacedRepetitionProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="add" />
        <Stack.Screen name="settings" />
      </Stack>
    </SpacedRepetitionProvider>
  );
}
