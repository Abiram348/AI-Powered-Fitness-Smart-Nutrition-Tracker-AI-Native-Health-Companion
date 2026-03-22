import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, FontSize, Shadows } from '../constants/theme';

export default function StatCard({ 
  title, 
  value, 
  unit, 
  icon, 
  iconColor,
  gradient,
  subtitle,
  onPress,
  trend,
  compact = false,
}) {
  const content = (
    <LinearGradient
      colors={gradient || Colors.gradients.card}
      style={[styles.card, compact && styles.cardCompact]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: (iconColor || Colors.primary) + '20' }]}>
          <Ionicons name={icon || 'stats-chart'} size={compact ? 18 : 22} color={iconColor || Colors.primary} />
        </View>
        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: trend > 0 ? Colors.success + '20' : Colors.error + '20' }]}>
            <Ionicons 
              name={trend > 0 ? 'trending-up' : 'trending-down'} 
              size={12} 
              color={trend > 0 ? Colors.success : Colors.error} 
            />
            <Text style={[styles.trendText, { color: trend > 0 ? Colors.success : Colors.error }]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.valueRow}>
        <Text style={[styles.value, compact && styles.valueCompact]}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.touchable}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  cardCompact: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 2,
  },
  trendText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.text,
  },
  valueCompact: {
    fontSize: FontSize.xxl,
  },
  unit: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  title: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  titleCompact: {
    fontSize: FontSize.xs,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});
