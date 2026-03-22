import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { foodAPI, waterAPI, workoutAPI, analyticsAPI } from '../../src/services/api';
import StatCard from '../../src/components/StatCard';
import { Card, SectionHeader, Badge } from '../../src/components/UI';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [todayStats, setTodayStats] = useState({
    calories: 0, protein: 0, carbs: 0, fat: 0,
    water: 0, workouts: 0,
  });
  const [insights, setInsights] = useState([]);

  const today = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    try {
      const [foodRes, waterRes, workoutRes, insightsRes] = await Promise.allSettled([
        foodAPI.getLogs(today),
        waterAPI.getLogs(today),
        workoutAPI.getLogs(today),
        analyticsAPI.getInsights(),
      ]);

      const foodLogs = foodRes.status === 'fulfilled' && Array.isArray(foodRes.value.data)
        ? foodRes.value.data
        : [];
      const waterLogs = waterRes.status === 'fulfilled' && Array.isArray(waterRes.value.data)
        ? waterRes.value.data
        : [];
      const workoutLogs = workoutRes.status === 'fulfilled' && Array.isArray(workoutRes.value.data)
        ? workoutRes.value.data
        : [];
      const insightsData = insightsRes.status === 'fulfilled' && Array.isArray(insightsRes.value.data?.insights)
        ? insightsRes.value.data.insights
        : [];

      setTodayStats({
        calories: Math.round(foodLogs.reduce((sum, l) => sum + (l.calories || 0), 0)),
        protein: Math.round(foodLogs.reduce((sum, l) => sum + (l.protein || 0), 0)),
        carbs: Math.round(foodLogs.reduce((sum, l) => sum + (l.carbs || 0), 0)),
        fat: Math.round(foodLogs.reduce((sum, l) => sum + (l.fat || 0), 0)),
        water: Math.round(waterLogs.reduce((sum, l) => sum + (l.amount_ml || 0), 0)),
        workouts: workoutLogs.length,
      });

      setInsights(insightsData);
    } catch (e) {
      console.log('Dashboard load error:', e);
    }
  }, [today]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickActions = [
    { icon: 'camera', label: 'Scan Food', color: Colors.accentGreen, route: '/(tabs)/food' },
    { icon: 'water', label: 'Log Water', color: Colors.accent, route: '/(tabs)/water' },
    { icon: 'barbell', label: 'Workout', color: Colors.accentOrange, route: '/(tabs)/workout' },
    { icon: 'analytics', label: 'Analytics', color: Colors.accentPink, route: '/(tabs)/more' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.userName}>{user?.name || 'Athlete'} 💪</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/(tabs)/more')}
          >
            <LinearGradient colors={Colors.gradients.primary} style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {quickActions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.quickAction}
              onPress={() => router.push(action.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '18' }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Stats */}
        <SectionHeader title="Today's Progress" subtitle={today} />
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              title="Calories"
              value={todayStats.calories}
              unit="kcal"
              icon="flame"
              iconColor={Colors.accentOrange}
              compact
            />
            <StatCard
              title="Water"
              value={todayStats.water}
              unit="ml"
              icon="water"
              iconColor={Colors.accent}
              compact
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              title="Protein"
              value={todayStats.protein}
              unit="g"
              icon="fish"
              iconColor={Colors.accentGreen}
              compact
            />
            <StatCard
              title="Workouts"
              value={todayStats.workouts}
              icon="barbell"
              iconColor={Colors.accentPink}
              compact
            />
          </View>
        </View>

        {/* Macro Breakdown */}
        <SectionHeader title="Macros" />
        <Card style={styles.macroCard}>
          <View style={styles.macroRow}>
            <MacroBar label="Protein" value={todayStats.protein} max={150} color={Colors.accentGreen} />
            <MacroBar label="Carbs" value={todayStats.carbs} max={250} color={Colors.accent} />
            <MacroBar label="Fat" value={todayStats.fat} max={80} color={Colors.accentOrange} />
          </View>
        </Card>

        {/* Insights */}
        {insights.length > 0 && (
          <>
            <SectionHeader title="AI Insights" />
            {insights.map((insight, i) => (
              <Card key={i} style={[styles.insightCard, { marginBottom: Spacing.md }]}>
                <View style={styles.insightRow}>
                  <View style={[
                    styles.insightIcon,
                    { backgroundColor: insight.type === 'success' ? Colors.success + '20' : Colors.warning + '20' }
                  ]}>
                    <Ionicons
                      name={insight.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                      size={20}
                      color={insight.type === 'success' ? Colors.success : Colors.warning}
                    />
                  </View>
                  <Text style={styles.insightText}>{insight.message}</Text>
                </View>
              </Card>
            ))}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroBar({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <View style={macroStyles.container}>
      <View style={macroStyles.labelRow}>
        <Text style={macroStyles.label}>{label}</Text>
        <Text style={macroStyles.value}>{value}g</Text>
      </View>
      <View style={macroStyles.barBg}>
        <LinearGradient
          colors={[color, color + 'AA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[macroStyles.barFill, { width: `${pct}%` }]}
        />
      </View>
      <Text style={macroStyles.target}>/ {max}g goal</Text>
    </View>
  );
}

const macroStyles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  value: { fontSize: FontSize.xs, color: Colors.text, fontWeight: '700' },
  barBg: { height: 6, backgroundColor: Colors.surfaceElevated, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  target: { fontSize: 10, color: Colors.textTertiary, marginTop: 4 },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    marginTop: Spacing.md,
  },
  greeting: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  profileBtn: {
    ...Shadows.glow,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: '#fff',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statsGrid: {
    gap: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  macroCard: {
    padding: Spacing.xl,
  },
  macroRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  insightCard: {
    paddingVertical: Spacing.md,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
