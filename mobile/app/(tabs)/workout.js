import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { workoutAPI } from '../../src/services/api';
import { Card, GradientButton, SectionHeader, EmptyState, TextInput, Badge } from '../../src/components/UI';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';

export default function WorkoutScreen() {
  const [logs, setLogs] = useState([]);
  const [library, setLibrary] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [form, setForm] = useState({
    exercise_name: '', sets: '', reps: '', weight: '',
    duration_minutes: '', calories_burned: '', notes: '',
  });

  const today = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    try {
      const [logsRes, libRes] = await Promise.allSettled([
        workoutAPI.getLogs(today),
        workoutAPI.getLibrary(),
      ]);
      if (logsRes.status === 'fulfilled') {
        setLogs(Array.isArray(logsRes.value.data) ? logsRes.value.data : []);
      }
      if (libRes.status === 'fulfilled') {
        setLibrary(Array.isArray(libRes.value.data) ? libRes.value.data : []);
      }
    } catch (e) {
      console.log('Workout load error:', e);
    }
  }, [today]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const saveWorkout = async () => {
    if (!form.exercise_name || !form.sets || !form.reps) {
      Alert.alert('Error', 'Please fill exercise name, sets, and reps');
      return;
    }
    try {
      await workoutAPI.createLog({
        exercise_name: form.exercise_name,
        sets: parseInt(form.sets) || 0,
        reps: parseInt(form.reps) || 0,
        weight: form.weight ? parseFloat(form.weight) : null,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        calories_burned: form.calories_burned ? parseFloat(form.calories_burned) : null,
        notes: form.notes || null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAdd(false);
      setForm({ exercise_name: '', sets: '', reps: '', weight: '', duration_minutes: '', calories_burned: '', notes: '' });
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to save workout');
    }
  };

  const deleteLog = async (id) => {
    Alert.alert('Delete', 'Remove this workout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await workoutAPI.deleteLog(id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            loadData();
          } catch (e) { Alert.alert('Error', 'Failed to delete'); }
        },
      },
    ]);
  };

  const totalSets = logs.reduce((sum, l) => sum + (l.sets || 0), 0);
  const totalCalories = logs.reduce((sum, l) => sum + (l.calories_burned || 0), 0);

  const difficultyColor = (d) => {
    if (d === 'beginner') return Colors.accentGreen;
    if (d === 'intermediate') return Colors.accentOrange;
    return Colors.accentRed;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Text style={styles.screenTitle}>Workout</Text>
        <Text style={styles.screenSubtitle}>Track your exercises & discover workouts</Text>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <Card style={styles.quickStatCard}>
            <Ionicons name="barbell" size={24} color={Colors.accentOrange} />
            <Text style={styles.quickStatValue}>{logs.length}</Text>
            <Text style={styles.quickStatLabel}>Exercises</Text>
          </Card>
          <Card style={styles.quickStatCard}>
            <Ionicons name="layers" size={24} color={Colors.primary} />
            <Text style={styles.quickStatValue}>{totalSets}</Text>
            <Text style={styles.quickStatLabel}>Total Sets</Text>
          </Card>
          <Card style={styles.quickStatCard}>
            <Ionicons name="flame" size={24} color={Colors.accentRed} />
            <Text style={styles.quickStatValue}>{Math.round(totalCalories)}</Text>
            <Text style={styles.quickStatLabel}>Calories</Text>
          </Card>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowAdd(true)} activeOpacity={0.7}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.actionGradient}>
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.actionText}>Log Exercise</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowLibrary(true)} activeOpacity={0.7}>
            <LinearGradient colors={Colors.gradients.accent} style={styles.actionGradient}>
              <Ionicons name="library" size={24} color="#fff" />
              <Text style={styles.actionText}>Library</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Today's Workouts */}
        <SectionHeader title="Today's Workouts" subtitle={`${logs.length} exercises`} />
        {logs.length === 0 ? (
          <EmptyState icon="barbell-outline" title="No workouts today" subtitle="Log an exercise to start tracking" />
        ) : (
          logs.map((log, i) => (
            <TouchableOpacity key={log.id || i} onLongPress={() => deleteLog(log.id)} activeOpacity={0.8}>
              <Card style={[styles.workoutCard, { marginBottom: Spacing.md }]}>
                <View style={styles.workoutHeader}>
                  <Text style={styles.workoutName}>{log.exercise_name}</Text>
                  {log.calories_burned > 0 && (
                    <Badge text={`${Math.round(log.calories_burned)} kcal`} color={Colors.accentOrange} icon="flame" />
                  )}
                </View>
                <View style={styles.workoutDetails}>
                  <View style={styles.detailChip}>
                    <Text style={styles.detailValue}>{log.sets}</Text>
                    <Text style={styles.detailLabel}>sets</Text>
                  </View>
                  <Text style={styles.detailX}>×</Text>
                  <View style={styles.detailChip}>
                    <Text style={styles.detailValue}>{log.reps}</Text>
                    <Text style={styles.detailLabel}>reps</Text>
                  </View>
                  {log.weight && (
                    <>
                      <Text style={styles.detailX}>@</Text>
                      <View style={styles.detailChip}>
                        <Text style={styles.detailValue}>{log.weight}</Text>
                        <Text style={styles.detailLabel}>kg</Text>
                      </View>
                    </>
                  )}
                  {log.duration_minutes && (
                    <View style={[styles.detailChip, { marginLeft: 'auto' }]}>
                      <Ionicons name="time-outline" size={12} color={Colors.textTertiary} />
                      <Text style={styles.detailLabel}>{log.duration_minutes}m</Text>
                    </View>
                  )}
                </View>
                {log.notes && <Text style={styles.workoutNotes}>{log.notes}</Text>}
              </Card>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Add Workout Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Exercise</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Ionicons name="close-circle" size={28} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <TextInput label="Exercise Name" icon="barbell-outline" placeholder="e.g., Bench Press" value={form.exercise_name} onChangeText={(v) => setForm(p => ({ ...p, exercise_name: v }))} />
            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <TextInput label="Sets" placeholder="3" value={form.sets} onChangeText={(v) => setForm(p => ({ ...p, sets: v }))} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput label="Reps" placeholder="12" value={form.reps} onChangeText={(v) => setForm(p => ({ ...p, reps: v }))} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput label="Weight (kg)" placeholder="0" value={form.weight} onChangeText={(v) => setForm(p => ({ ...p, weight: v }))} keyboardType="numeric" />
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <TextInput label="Duration (min)" placeholder="0" value={form.duration_minutes} onChangeText={(v) => setForm(p => ({ ...p, duration_minutes: v }))} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput label="Calories Burned" placeholder="0" value={form.calories_burned} onChangeText={(v) => setForm(p => ({ ...p, calories_burned: v }))} keyboardType="numeric" />
              </View>
            </View>
            <TextInput label="Notes (optional)" icon="document-text-outline" placeholder="Any notes..." value={form.notes} onChangeText={(v) => setForm(p => ({ ...p, notes: v }))} multiline />
            <GradientButton title="Save Workout" onPress={saveWorkout} icon="checkmark-circle-outline" style={{ marginTop: Spacing.xl }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Workout Library Modal */}
      <Modal visible={showLibrary} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Workout Library</Text>
            <TouchableOpacity onPress={() => setShowLibrary(false)}>
              <Ionicons name="close-circle" size={28} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {library.map((video) => (
              <Card key={video.id} style={[styles.libraryCard, { marginBottom: Spacing.md }]}>
                <View style={styles.libraryHeader}>
                  <Text style={styles.libraryTitle}>{video.title}</Text>
                  <Badge text={video.difficulty} color={difficultyColor(video.difficulty)} />
                </View>
                <Text style={styles.libraryDesc}>{video.description}</Text>
                <View style={styles.libraryMeta}>
                  <View style={styles.metaChip}>
                    <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
                    <Text style={styles.metaText}>{video.duration_minutes} min</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Ionicons name="body-outline" size={14} color={Colors.textTertiary} />
                    <Text style={styles.metaText}>{video.muscle_group}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Ionicons name="construct-outline" size={14} color={Colors.textTertiary} />
                    <Text style={styles.metaText}>{video.equipment}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
  screenTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, marginTop: Spacing.md },
  screenSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xxl },

  quickStats: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  quickStatCard: { flex: 1, alignItems: 'center', paddingVertical: Spacing.lg, gap: 6 },
  quickStatValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  quickStatLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },

  actionRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  actionBtn: { flex: 1 },
  actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: BorderRadius.lg },
  actionText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  workoutCard: { padding: Spacing.lg },
  workoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  workoutName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, flex: 1 },
  workoutDetails: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailChip: { flexDirection: 'row', alignItems: 'baseline', gap: 2, backgroundColor: Colors.surfaceElevated, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.sm },
  detailValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  detailLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },
  detailX: { fontSize: FontSize.sm, color: Colors.textTertiary },
  workoutNotes: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: Spacing.md, fontStyle: 'italic' },

  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  modalContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.xxxl },
  formRow: { flexDirection: 'row', gap: Spacing.md },

  libraryCard: { padding: Spacing.lg },
  libraryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  libraryTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, flex: 1, marginRight: Spacing.sm },
  libraryDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 20 },
  libraryMeta: { flexDirection: 'row', gap: Spacing.md },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSize.xs, color: Colors.textTertiary, textTransform: 'capitalize' },
});
