import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { waterAPI } from '../../src/services/api';
import { Card, SectionHeader, EmptyState } from '../../src/components/UI';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../src/constants/theme';

const QUICK_AMOUNTS = [
  { label: '150ml', value: 150, icon: 'cafe-outline' },
  { label: '250ml', value: 250, icon: 'water-outline' },
  { label: '500ml', value: 500, icon: 'pint-outline' },
  { label: '750ml', value: 750, icon: 'beer-outline' },
  { label: '1000ml', value: 1000, icon: 'flask-outline' },
];

const DAILY_GOAL = 3000; // ml

export default function WaterScreen() {
  const [logs, setLogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const loadLogs = useCallback(async () => {
    try {
      const res = await waterAPI.getLogs(today);
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.log('Failed to load water logs:', e);
    }
  }, [today]);

  const formatLogTime = (timestamp) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return '--:--';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  const addWater = async (amount) => {
    if (adding) return;
    setAdding(true);
    try {
      await waterAPI.createLog({ amount_ml: amount });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await loadLogs();
    } catch (e) {
      Alert.alert('Error', 'Failed to log water');
    } finally {
      setAdding(false);
    }
  };

  const deleteLog = async (id) => {
    if (deletingId) return;
    if (!id) {
      Alert.alert('Error', 'This entry cannot be deleted because it has no log id.');
      return;
    }

    Alert.alert('Delete', 'Remove this water entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingId(id);
            await waterAPI.deleteLog(id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await loadLogs();
          } catch (e) {
            const status = e?.response?.status;
            const detail = e?.response?.data?.detail;

            if (status === 404) {
              Alert.alert(
                'Delete Unavailable',
                'Water delete endpoint was not found on the running backend. Restart backend and try again.'
              );
            } else {
              Alert.alert('Error', detail ? `Failed to delete water log: ${detail}` : 'Failed to delete water log');
            }
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const totalWater = logs.reduce((sum, l) => sum + (l.amount_ml || 0), 0);
  const progress = Math.min(totalWater / DAILY_GOAL, 1);
  const progressPct = Math.round(progress * 100);

  const glassesCount = Math.round(totalWater / 250);
  const remaining = Math.max(DAILY_GOAL - totalWater, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {/* Header */}
        <Text style={styles.screenTitle}>Water Tracker</Text>
        <Text style={styles.screenSubtitle}>Stay hydrated throughout the day</Text>

        {/* Progress Circle */}
        <Card style={styles.progressCard}>
          <View style={styles.circleContainer}>
            <View style={styles.circleOuter}>
              <LinearGradient
                colors={progress >= 1 ? Colors.gradients.success : Colors.gradients.accent}
                style={[styles.circleFill, { height: `${progressPct}%` }]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
              />
              <View style={styles.circleInner}>
                <Ionicons name="water" size={28} color={Colors.accent} />
                <Text style={styles.circleValue}>{Math.round(totalWater)}</Text>
                <Text style={styles.circleUnit}>/ {DAILY_GOAL} ml</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.accentGreen} />
              <Text style={styles.statValue}>{progressPct}%</Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="pint" size={20} color={Colors.accent} />
              <Text style={styles.statValue}>{glassesCount}</Text>
              <Text style={styles.statLabel}>Glasses</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="arrow-forward-circle" size={20} color={Colors.accentOrange} />
              <Text style={styles.statValue}>{remaining}</Text>
              <Text style={styles.statLabel}>ml left</Text>
            </View>
          </View>
        </Card>

        {/* Quick Add */}
        <SectionHeader title="Quick Add" subtitle="Tap to log water" />
        <View style={styles.quickGrid}>
          {QUICK_AMOUNTS.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={styles.quickBtn}
              onPress={() => addWater(item.value)}
              activeOpacity={0.7}
              disabled={adding}
            >
              <LinearGradient
                colors={[Colors.surfaceLight, Colors.surface]}
                style={styles.quickGradient}
              >
                <Ionicons name={item.icon} size={24} color={Colors.accent} />
                <Text style={styles.quickLabel}>{item.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hydration Tips */}
        {progress < 0.5 && (
          <Card style={styles.tipCard}>
            <View style={styles.tipRow}>
              <Ionicons name="bulb" size={20} color={Colors.warning} />
              <Text style={styles.tipText}>
                You're below 50% of your daily goal. Try drinking a glass of water every hour!
              </Text>
            </View>
          </Card>
        )}

        {progress >= 1 && (
          <Card style={[styles.tipCard, { borderColor: Colors.success + '40' }]}>
            <View style={styles.tipRow}>
              <Ionicons name="trophy" size={20} color={Colors.success} />
              <Text style={styles.tipText}>
                Amazing! You've reached your daily hydration goal! 🎉
              </Text>
            </View>
          </Card>
        )}

        {/* Log History */}
        <SectionHeader title="Today's Log" subtitle={`${logs.length} entries`} />
        {logs.length === 0 ? (
          <EmptyState icon="water-outline" title="No water logged" subtitle="Start by tapping a quick add button" />
        ) : (
          logs.slice().reverse().map((log, i) => (
            <Card key={log.id || i} style={[styles.logItem, { marginBottom: Spacing.sm }]}>
              <View style={styles.logRow}>
                <View style={styles.logDot} />
                <View style={styles.logInfo}>
                  <Text style={styles.logAmount}>{log.amount_ml} ml</Text>
                  <Text style={styles.logTime}>
                    {formatLogTime(log.timestamp)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteLog(log.id)}
                  disabled={deletingId === log.id}
                >
                  <Ionicons
                    name={deletingId === log.id ? 'hourglass-outline' : 'trash-outline'}
                    size={16}
                    color={Colors.accentRed}
                  />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
  screenTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, marginTop: Spacing.md },
  screenSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xxl },

  progressCard: { padding: Spacing.xxl, alignItems: 'center', marginBottom: Spacing.lg },
  circleContainer: { marginBottom: Spacing.xxl },
  circleOuter: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderWidth: 3,
    borderColor: Colors.accent + '30',
  },
  circleFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.3,
  },
  circleInner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleValue: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.text, marginTop: 4 },
  circleUnit: { fontSize: FontSize.sm, color: Colors.textSecondary },

  statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  quickBtn: { width: '30%', flexGrow: 1 },
  quickGradient: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  quickLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },

  tipCard: { marginTop: Spacing.lg, padding: Spacing.lg },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  tipText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  logItem: { paddingVertical: Spacing.md },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  logDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  logInfo: { flex: 1 },
  logAmount: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  logTime: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  deleteBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceElevated,
  },
});
