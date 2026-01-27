import { Colors } from "@/constants/Colors";
// import DateTimePicker from '@react-native-community/datetimepicker';
let DateTimePicker: any = null;
try {
  const RNDTP = require("@react-native-community/datetimepicker");
  DateTimePicker = RNDTP.default || RNDTP;
} catch (e) {
  // Native module not available in this build
}

import {
  BookOpen,
  Clock,
  Coffee,
  Eye,
  EyeOff,
  Play,
  Plus,
  Save,
  Square,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export type GoalItem = {
  id: string;
  text: string;
  completed: boolean;
};

export type SessionBlock = {
  id: string;
  type: "focus" | "break";
  duration: number; // minutes
  subject?: string;
  subjectId?: string;
  topic?: string;
  topicId?: string;
  goal?: string;
  goals?: GoalItem[];
  isPublic?: boolean;
};

interface SessionDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blocks: SessionBlock[], startTime: string) => void;
  onStartNow?: (blocks: SessionBlock[]) => void;
  existingSchedule?: Array<{
    $id: string;
    subject: string;
    goal: string;
    duration: number;
    scheduledAt: string;
    type: "focus" | "break";
  }>;
  onDeleteScheduledItem?: (id: string) => void;
  onStartScheduledSession?: (id: string) => void;
  curriculums?: any[];
  subjects?: any[];
  topics?: any[];
}

const getDefaultBlocks = (): SessionBlock[] => [
  {
    id: Math.random().toString(36).substr(2, 9),
    type: "focus",
    duration: 25,
    subject: "",
    isPublic: false,
  },
  {
    id: Math.random().toString(36).substr(2, 9),
    type: "break",
    duration: 5,
    isPublic: false,
  },
];

const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

export default function SessionDesigner({
  isOpen,
  onClose,
  onSave,
  onStartNow,
  existingSchedule,
  onDeleteScheduledItem,
  onStartScheduledSession,
  curriculums,
  subjects,
  topics,
}: SessionDesignerProps) {
  const [blocks, setBlocks] = useState<SessionBlock[]>(getDefaultBlocks());
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>("");
  const [startTime, setStartTime] = useState(getCurrentTime());
  const [viewMode, setViewMode] = useState<"create" | "view">("create");
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingSchedule && existingSchedule.length > 0) {
        setViewMode("view");
      } else {
        setViewMode("create");
        setStartTime(getCurrentTime());
        setBlocks(getDefaultBlocks());
      }
    }
  }, [isOpen, existingSchedule]);

  const addBlock = (type: "focus" | "break") => {
    setBlocks([
      ...blocks,
      {
        id: Math.random().toString(36).substr(2, 9),
        type,
        duration: type === "focus" ? 25 : 5,
        subject:
          type === "focus"
            ? blocks.find((b) => b.subject)?.subject || ""
            : undefined,
        isPublic: false,
      },
    ]);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const updateBlock = (id: string, updates: Partial<SessionBlock>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const addGoalToBlock = (blockId: string) => {
    setBlocks(
      blocks.map((b) =>
        b.id === blockId
          ? {
              ...b,
              goals: [
                ...(b.goals || []),
                {
                  id: Math.random().toString(36).substr(2, 9),
                  text: "",
                  completed: false,
                },
              ],
            }
          : b,
      ),
    );
  };

  const updateGoal = (blockId: string, goalId: string, text: string) => {
    setBlocks(
      blocks.map((b) =>
        b.id === blockId
          ? {
              ...b,
              goals: b.goals?.map((g) =>
                g.id === goalId ? { ...g, text } : g,
              ),
            }
          : b,
      ),
    );
  };

  const removeGoal = (blockId: string, goalId: string) => {
    setBlocks(
      blocks.map((b) =>
        b.id === blockId
          ? {
              ...b,
              goals: b.goals?.filter((g) => g.id !== goalId),
            }
          : b,
      ),
    );
  };

  const totalDuration = blocks.reduce((acc, b) => acc + b.duration, 0);

  const onTimeChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowTimePicker(Platform.OS === "ios");
    const hours = currentDate.getHours().toString().padStart(2, "0");
    const minutes = currentDate.getMinutes().toString().padStart(2, "0");
    setStartTime(`${hours}:${minutes}`);
    if (Platform.OS !== "ios") setShowTimePicker(false);
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Session Designer</Text>
              <Text style={styles.headerSubtitle}>
                {viewMode === "view"
                  ? "Your scheduled sessions"
                  : "Design your study flow"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              {viewMode === "create" ? (
                <>
                  <Text style={styles.totalDuration}>
                    {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                  </Text>
                  <Text style={styles.totalDurationLabel}>Total Duration</Text>
                </>
              ) : (
                <Text style={styles.headerSubtitle}>
                  {existingSchedule?.length || 0} sessions
                </Text>
              )}
            </View>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              onPress={() => setViewMode("view")}
              style={[
                styles.tabButton,
                viewMode === "view" && styles.tabButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  viewMode === "view" && styles.tabTextActive,
                ]}
              >
                📅 My Schedule ({existingSchedule?.length || 0})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setViewMode("create");
                setStartTime(getCurrentTime());
                setBlocks(getDefaultBlocks());
              }}
              style={[
                styles.tabButton,
                viewMode === "create" && styles.tabButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  viewMode === "create" && styles.tabTextActive,
                ]}
              >
                ✨ Create New
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {viewMode === "view" ? (
              /* Existing Schedule View */
              <View style={styles.scheduleList}>
                {!existingSchedule || existingSchedule.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      No sessions scheduled yet
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setViewMode("create");
                        setStartTime(getCurrentTime());
                        setBlocks(getDefaultBlocks());
                      }}
                      style={styles.createFirstButton}
                    >
                      <Text style={styles.createFirstButtonText}>
                        Create Your First Schedule
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  existingSchedule.map((session, index) => (
                    <View
                      key={session.$id}
                      style={styles.scheduleItemContainer}
                    >
                      {/* Timeline Connector */}
                      {index > 0 && <View style={styles.timelineConnector} />}

                      <View
                        style={[
                          styles.scheduleCard,
                          session.type === "focus"
                            ? styles.focusCard
                            : styles.breakCard,
                        ]}
                      >
                        <View
                          style={[
                            styles.iconContainer,
                            session.type === "focus"
                              ? styles.focusIcon
                              : styles.breakIcon,
                          ]}
                        >
                          {session.type === "focus" ? (
                            <BookOpen size={16} color="#818cf8" />
                          ) : (
                            <Coffee size={16} color="#4ade80" />
                          )}
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={styles.scheduleMeta}>
                            <Text
                              style={[
                                styles.typeTag,
                                session.type === "focus"
                                  ? { color: "#a5b4fc" }
                                  : { color: "#86efac" },
                              ]}
                            >
                              {session.type}
                            </Text>
                            <Text style={styles.metaDivider}>•</Text>
                            <Text style={styles.metaText}>
                              {Math.floor(session.duration / 60)} min
                            </Text>
                            <Text style={styles.metaDivider}>•</Text>
                            <Text style={styles.metaText}>
                              {new Date(session.scheduledAt).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </Text>
                          </View>

                          <Text style={styles.scheduleSubject}>
                            {session.subject ||
                              (session.type === "break"
                                ? "Break"
                                : "Focus Session")}
                          </Text>

                          {/* Display goals */}
                          {session.goal && (
                            <View style={{ marginTop: 8 }}>
                              {(() => {
                                try {
                                  const goals: GoalItem[] = JSON.parse(
                                    session.goal,
                                  );
                                  return goals.length > 0 ? (
                                    <View>
                                      {goals.map((g) => (
                                        <View
                                          key={g.id}
                                          style={styles.miniGoalItem}
                                        >
                                          <Square
                                            size={10}
                                            color="#818cf8"
                                            style={{ opacity: 0.5 }}
                                          />
                                          <Text style={styles.miniGoalText}>
                                            {g.text}
                                          </Text>
                                        </View>
                                      ))}
                                    </View>
                                  ) : null;
                                } catch {
                                  return (
                                    <Text style={styles.miniGoalText}>
                                      {session.goal}
                                    </Text>
                                  );
                                }
                              })()}
                            </View>
                          )}
                        </View>

                        <View style={styles.actionsContainer}>
                          {onDeleteScheduledItem && (
                            <TouchableOpacity
                              onPress={() => onDeleteScheduledItem(session.$id)}
                              style={styles.iconButton}
                            >
                              <Trash2 size={16} color={Colors.dark.textMuted} />
                            </TouchableOpacity>
                          )}
                          {onStartScheduledSession && (
                            <TouchableOpacity
                              onPress={() => {
                                onStartScheduledSession(session.$id);
                                onClose();
                              }}
                              style={[
                                styles.startButton,
                                session.type === "focus"
                                  ? { backgroundColor: Colors.dark.primary }
                                  : { backgroundColor: Colors.dark.success },
                              ]}
                            >
                              <Play size={12} color="#fff" fill="#fff" />
                              <Text style={styles.startButtonText}>Start</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            ) : (
              /* Create View */
              <View style={styles.createContainer}>
                {/* Start Time Input */}
                <View style={styles.timeInputContainer}>
                  <Text style={styles.fieldLabel}>Start Time:</Text>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={styles.timePickerText}>{startTime}</Text>
                  </TouchableOpacity>
                  {showTimePicker && DateTimePicker && (
                    <DateTimePicker
                      value={new Date()}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={onTimeChange}
                    />
                  )}
                  {showTimePicker && !DateTimePicker && (
                    <View
                      style={{
                        padding: 10,
                        backgroundColor: "rgba(255,0,0,0.1)",
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: "#ef4444", fontSize: 12 }}>
                        Time picker native module missing. Please rebuild your
                        dev client or enter time manually.
                      </Text>
                      <TextInput
                        style={[
                          styles.timePickerText,
                          {
                            borderBottomWidth: 1,
                            borderBottomColor: Colors.dark.border,
                            marginTop: 8,
                          },
                        ]}
                        value={startTime}
                        onChangeText={setStartTime}
                        placeholder="HH:MM"
                        placeholderTextColor={Colors.dark.textMuted}
                      />
                      <TouchableOpacity
                        onPress={() => setShowTimePicker(false)}
                        style={{ marginTop: 8 }}
                      >
                        <Text style={{ color: Colors.dark.primary }}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Blocks List */}
                <View style={{ gap: 12 }}>
                  {blocks.map((block, index) => (
                    <View key={block.id} style={styles.scheduleItemContainer}>
                      {index > 0 && <View style={styles.timelineConnector} />}
                      <View
                        style={[
                          styles.scheduleCard,
                          block.type === "focus"
                            ? styles.focusCard
                            : styles.breakCard,
                        ]}
                      >
                        <View
                          style={[
                            styles.iconContainer,
                            block.type === "focus"
                              ? styles.focusIcon
                              : styles.breakIcon,
                          ]}
                        >
                          {block.type === "focus" ? (
                            <BookOpen size={16} color="#818cf8" />
                          ) : (
                            <Coffee size={16} color="#4ade80" />
                          )}
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={styles.editRow}>
                            {/* Duration Input */}
                            <View>
                              <Text style={styles.miniLabel}>DURATION</Text>
                              <View style={styles.durationInputWrapper}>
                                <TextInput
                                  style={styles.durationInput}
                                  value={block.duration.toString()}
                                  keyboardType="number-pad"
                                  onChangeText={(text) =>
                                    updateBlock(block.id, {
                                      duration: parseInt(text) || 0,
                                    })
                                  }
                                />
                                <Text style={styles.unitText}>min</Text>
                              </View>
                            </View>

                            {/* Action: Delete */}
                            <TouchableOpacity
                              onPress={() => removeBlock(block.id)}
                              style={styles.iconButton}
                            >
                              <Trash2 size={16} color={Colors.dark.textMuted} />
                            </TouchableOpacity>
                          </View>

                          {block.type === "focus" && (
                            <View style={{ marginTop: 12 }}>
                              <Text style={styles.miniLabel}>SUBJECT</Text>
                              {/* Dropdowns logic omitted for brevity, using text input for generic usage */}
                              <TextInput
                                style={styles.textInput}
                                placeholder="Subject or Topic..."
                                placeholderTextColor={Colors.dark.textMuted}
                                value={block.subject}
                                onChangeText={(text) =>
                                  updateBlock(block.id, { subject: text })
                                }
                              />

                              {/* Goals Section */}
                              <View style={styles.goalsContainer}>
                                {block.goals?.map((goal) => (
                                  <View key={goal.id} style={styles.goalRow}>
                                    <Square
                                      size={14}
                                      color={Colors.dark.textMuted}
                                    />
                                    <TextInput
                                      style={styles.goalInput}
                                      value={goal.text}
                                      onChangeText={(text) =>
                                        updateGoal(block.id, goal.id, text)
                                      }
                                      placeholder="Goal..."
                                      placeholderTextColor="#555"
                                    />
                                    <TouchableOpacity
                                      onPress={() =>
                                        removeGoal(block.id, goal.id)
                                      }
                                    >
                                      <X
                                        size={14}
                                        color={Colors.dark.textMuted}
                                      />
                                    </TouchableOpacity>
                                  </View>
                                ))}
                                <TouchableOpacity
                                  onPress={() => addGoalToBlock(block.id)}
                                  style={styles.addGoalButton}
                                >
                                  <Plus
                                    size={12}
                                    color={Colors.dark.textMuted}
                                  />
                                  <Text style={styles.addGoalText}>
                                    Add goal
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}

                          {/* Public/Private Toggle - For all block types */}
                          <View style={styles.publicToggleContainer}>
                            {block.isPublic ? (
                              <Eye size={14} color={Colors.dark.primary} />
                            ) : (
                              <EyeOff size={14} color={Colors.dark.textMuted} />
                            )}
                            <Text style={styles.publicToggleLabel}>
                              {block.isPublic
                                ? "Public Session"
                                : "Private Session"}
                            </Text>
                            <Switch
                              value={block.isPublic ?? false}
                              onValueChange={(value) =>
                                updateBlock(block.id, { isPublic: value })
                              }
                              trackColor={{
                                false: "#374151",
                                true: Colors.dark.primary + "40",
                              }}
                              thumbColor={
                                block.isPublic ? Colors.dark.primary : "#9ca3af"
                              }
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Add Block Buttons */}
                <View style={styles.addButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      {
                        backgroundColor: "rgba(99, 102, 241, 0.1)",
                        borderColor: "rgba(99, 102, 241, 0.2)",
                      },
                    ]}
                    onPress={() => addBlock("focus")}
                  >
                    <Plus size={16} color="#818cf8" />
                    <Text style={[styles.addButtonText, { color: "#818cf8" }]}>
                      Add Focus
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      {
                        backgroundColor: "rgba(34, 197, 94, 0.1)",
                        borderColor: "rgba(34, 197, 94, 0.2)",
                      },
                    ]}
                    onPress={() => addBlock("break")}
                  >
                    <Plus size={16} color="#4ade80" />
                    <Text style={[styles.addButtonText, { color: "#4ade80" }]}>
                      Add Break
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            {viewMode === "create" && (
              <View style={styles.footerActions}>
                {onStartNow && (
                  <TouchableOpacity
                    style={styles.actionButtonSecondary}
                    onPress={() => onStartNow(blocks)}
                  >
                    <Clock size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Start Now</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionButtonPrimary}
                  onPress={() => onSave(blocks, startTime)}
                >
                  <Save size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: "92%",
    backgroundColor: "#09090b",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(30,30,30,0.3)",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#a1a1aa",
    marginTop: 4,
  },
  totalDuration: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.dark.primary,
    textAlign: "right",
  },
  totalDurationLabel: {
    fontSize: 12,
    color: "#a1a1aa",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "right",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 18,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: Colors.dark.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#52525b",
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
    opacity: 0.8,
  },
  emptyStateText: {
    color: "#a1a1aa",
    marginBottom: 24,
    fontSize: 16,
  },
  createFirstButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createFirstButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  scheduleList: {
    gap: 16,
  },
  scheduleItemContainer: {
    position: "relative",
  },
  timelineConnector: {
    position: "absolute",
    top: -24,
    left: 31, // Adjusted center
    width: 2,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    zIndex: -1,
  },
  scheduleCard: {
    flexDirection: "row",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    gap: 20,
    alignItems: "flex-start",
  },
  focusCard: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  breakCard: {
    backgroundColor: "rgba(34, 197, 94, 0.08)",
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  focusIcon: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
  },
  breakIcon: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
  },
  scheduleMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  typeTag: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metaDivider: {
    fontSize: 10,
    color: Colors.dark.textMuted,
  },
  metaText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  scheduleSubject: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  miniGoalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  miniGoalText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  actionsContainer: {
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  iconButton: {
    padding: 4,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  createContainer: {
    gap: 24,
  },
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.dark.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  fieldLabel: {
    color: Colors.dark.textMuted,
    fontSize: 14,
  },
  timePickerButton: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timePickerText: {
    color: Colors.dark.text,
    fontSize: 14,
  },
  editRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.dark.textMuted,
    marginBottom: 4,
  },
  durationInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  durationInput: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 60,
    textAlign: "center",
  },
  unitText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  textInput: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 8,
  },
  goalsContainer: {
    marginLeft: 12,
    marginTop: 8,
    gap: 8,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  goalInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    color: Colors.dark.text,
    fontSize: 12,
    paddingVertical: 4,
  },
  addGoalButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  addGoalText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  publicToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  publicToggleLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark.text,
    fontWeight: "500",
  },
  addButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginTop: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: Colors.dark.textMuted,
    fontWeight: "500",
  },
  footerActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButtonSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.dark.success,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionButtonPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
