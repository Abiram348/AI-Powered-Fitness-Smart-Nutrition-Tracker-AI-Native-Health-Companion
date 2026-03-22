import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, RefreshControl, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { foodAPI } from '../../src/services/api';
import { Card, GradientButton, SectionHeader, EmptyState, Badge, TextInput } from '../../src/components/UI';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../src/constants/theme';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function FoodScreen() {
  const [logs, setLogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    food_name: '', calories: '', protein: '', carbs: '', fat: '', meal_type: 'lunch',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const loadLogs = useCallback(async () => {
    try {
      const res = await foodAPI.getLogs(today);
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.log('Failed to load food logs:', e);
    }
  }, [today]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  const ensureImagePermissions = async (useCamera) => {
    if (useCamera) {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPerm.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to take a food photo.');
        return false;
      }
      return true;
    }

    const libraryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!libraryPerm.granted) {
      Alert.alert('Permission Required', 'Photo library permission is needed to select an image.');
      return false;
    }
    return true;
  };

  const pickImage = async (useCamera) => {
    try {
      const hasPermission = await ensureImagePermissions(useCamera);
      if (!hasPermission) return;

      const method = useCamera 
        ? ImagePicker.launchCameraAsync 
        : ImagePicker.launchImageLibraryAsync;
      
      const result = await method({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      const pickedAsset = result?.assets?.[0];
      if (!result?.canceled && pickedAsset?.uri) {
        setSelectedImage(pickedAsset.uri);
        analyzeImage(pickedAsset.uri);
      }
    } catch (e) {
      console.log('Image picker error:', e);
      const errorMessage = e?.message ? `Failed to pick image: ${e.message}` : 'Failed to pick image';
      Alert.alert('Error', errorMessage);
    }
  };

  const analyzeImage = async (uri) => {
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'food.jpg',
      });

      const res = await foodAPI.analyze(formData);
      setAnalysisResult(res.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Analysis Failed', 'Could not analyze the food image. Try again or add manually.');
      setSelectedImage(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const saveAnalyzedFood = async (mealType) => {
    if (!analysisResult) return;
    try {
      await foodAPI.createLog({
        food_name: analysisResult.food_name,
        calories: analysisResult.calories,
        protein: analysisResult.protein,
        carbs: analysisResult.carbs,
        fat: analysisResult.fat,
        fiber: analysisResult.fiber || 0,
        sugar: analysisResult.sugar || 0,
        meal_type: mealType,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAnalysisResult(null);
      setSelectedImage(null);
      loadLogs();
    } catch (e) {
      Alert.alert('Error', 'Failed to save food log');
    }
  };

  const saveManualFood = async () => {
    const { food_name, calories, protein, carbs, fat, meal_type } = manualForm;
    if (!food_name || !calories) {
      Alert.alert('Error', 'Please enter at least food name and calories');
      return;
    }
    try {
      await foodAPI.createLog({
        food_name,
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        fiber: 0,
        sugar: 0,
        meal_type,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowManual(false);
      setManualForm({ food_name: '', calories: '', protein: '', carbs: '', fat: '', meal_type: 'lunch' });
      loadLogs();
    } catch (e) {
      Alert.alert('Error', 'Failed to save food log');
    }
  };

  const deleteLog = async (id) => {
    Alert.alert('Delete', 'Remove this food entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await foodAPI.deleteLog(id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            loadLogs();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete');
          }
        }
      },
    ]);
  };

  const totals = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + (l.calories || 0),
      protein: acc.protein + (l.protein || 0),
      carbs: acc.carbs + (l.carbs || 0),
      fat: acc.fat + (l.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <Text style={styles.screenTitle}>Food Tracker</Text>
        <Text style={styles.screenSubtitle}>AI-powered nutrition tracking</Text>

        {/* Scan Buttons */}
        <View style={styles.scanRow}>
          <TouchableOpacity style={styles.scanBtn} onPress={() => pickImage(true)} activeOpacity={0.7}>
            <LinearGradient colors={Colors.gradients.primary} style={styles.scanGradient}>
              <Ionicons name="camera" size={28} color="#fff" />
              <Text style={styles.scanLabel}>Camera</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scanBtn} onPress={() => pickImage(false)} activeOpacity={0.7}>
            <LinearGradient colors={Colors.gradients.accent} style={styles.scanGradient}>
              <Ionicons name="images" size={28} color="#fff" />
              <Text style={styles.scanLabel}>Gallery</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scanBtn} onPress={() => setShowManual(true)} activeOpacity={0.7}>
            <LinearGradient colors={Colors.gradients.success} style={styles.scanGradient}>
              <Ionicons name="create" size={28} color="#fff" />
              <Text style={styles.scanLabel}>Manual</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Analyzing Indicator */}
        {analyzing && (
          <Card style={styles.analyzingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.analyzingText}>Analyzing your food with AI...</Text>
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            )}
          </Card>
        )}

        {/* Analysis Result */}
        {analysisResult && !analyzing && (
          <Card style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="sparkles" size={20} color={Colors.primary} />
              <Text style={styles.resultTitle}>{analysisResult.food_name}</Text>
              <Badge text={analysisResult.confidence || 'AI'} color={Colors.accentGreen} />
            </View>
            <View style={styles.resultNutrients}>
              <NutrientPill label="Cal" value={Math.round(analysisResult.calories)} color={Colors.accentOrange} />
              <NutrientPill label="Protein" value={`${Math.round(analysisResult.protein)}g`} color={Colors.accentGreen} />
              <NutrientPill label="Carbs" value={`${Math.round(analysisResult.carbs)}g`} color={Colors.accent} />
              <NutrientPill label="Fat" value={`${Math.round(analysisResult.fat)}g`} color={Colors.accentPink} />
            </View>
            <Text style={styles.mealTypeLabel}>Save as:</Text>
            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map((mt) => (
                <TouchableOpacity
                  key={mt}
                  style={styles.mealTypeBtn}
                  onPress={() => saveAnalyzedFood(mt)}
                >
                  <Text style={styles.mealTypeBtnText}>{mt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Today's Summary */}
        <SectionHeader title="Today's Nutrition" subtitle={`${logs.length} entries`} />
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.accentOrange }]}>{Math.round(totals.calories)}</Text>
              <Text style={styles.summaryLabel}>Calories</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.accentGreen }]}>{Math.round(totals.protein)}g</Text>
              <Text style={styles.summaryLabel}>Protein</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.accent }]}>{Math.round(totals.carbs)}g</Text>
              <Text style={styles.summaryLabel}>Carbs</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.accentPink }]}>{Math.round(totals.fat)}g</Text>
              <Text style={styles.summaryLabel}>Fat</Text>
            </View>
          </View>
        </Card>

        {/* Food Logs */}
        <SectionHeader title="Food Log" />
        {logs.length === 0 ? (
          <EmptyState icon="nutrition-outline" title="No food logged today" subtitle="Scan or add food to start tracking" />
        ) : (
          logs.map((log, i) => (
            <TouchableOpacity
              key={log.id || i}
              onLongPress={() => deleteLog(log.id)}
              activeOpacity={0.8}
            >
              <Card style={[styles.logCard, { marginBottom: Spacing.md }]}>
                <View style={styles.logRow}>
                  <View style={[styles.mealDot, {
                    backgroundColor: log.meal_type === 'breakfast' ? Colors.accentOrange
                      : log.meal_type === 'lunch' ? Colors.accentGreen
                      : log.meal_type === 'dinner' ? Colors.primary
                      : Colors.accent
                  }]} />
                  <View style={styles.logInfo}>
                    <Text style={styles.logName}>{log.food_name}</Text>
                    <Text style={styles.logMeal}>{log.meal_type}</Text>
                  </View>
                  <View style={styles.logCals}>
                    <Text style={styles.logCalValue}>{Math.round(log.calories)}</Text>
                    <Text style={styles.logCalUnit}>kcal</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Manual Entry Modal */}
      <Modal visible={showManual} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Food Manually</Text>
            <TouchableOpacity onPress={() => setShowManual(false)}>
              <Ionicons name="close-circle" size={28} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <TextInput label="Food Name" icon="restaurant-outline" placeholder="e.g., Chicken Breast" value={manualForm.food_name} onChangeText={(v) => setManualForm(p => ({ ...p, food_name: v }))} />
            <TextInput label="Calories" icon="flame-outline" placeholder="0" value={manualForm.calories} onChangeText={(v) => setManualForm(p => ({ ...p, calories: v }))} keyboardType="numeric" />
            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <TextInput label="Protein (g)" placeholder="0" value={manualForm.protein} onChangeText={(v) => setManualForm(p => ({ ...p, protein: v }))} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput label="Carbs (g)" placeholder="0" value={manualForm.carbs} onChangeText={(v) => setManualForm(p => ({ ...p, carbs: v }))} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput label="Fat (g)" placeholder="0" value={manualForm.fat} onChangeText={(v) => setManualForm(p => ({ ...p, fat: v }))} keyboardType="numeric" />
              </View>
            </View>
            <Text style={styles.mealSelectLabel}>Meal Type</Text>
            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map((mt) => (
                <TouchableOpacity
                  key={mt}
                  style={[styles.mealChip, manualForm.meal_type === mt && styles.mealChipActive]}
                  onPress={() => setManualForm(p => ({ ...p, meal_type: mt }))}
                >
                  <Text style={[styles.mealChipText, manualForm.meal_type === mt && styles.mealChipTextActive]}>
                    {mt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <GradientButton title="Save Food" onPress={saveManualFood} icon="checkmark-circle-outline" style={{ marginTop: Spacing.xxl }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function NutrientPill({ label, value, color }) {
  return (
    <View style={[pillStyles.pill, { backgroundColor: color + '15' }]}>
      <Text style={[pillStyles.value, { color }]}>{value}</Text>
      <Text style={pillStyles.label}>{label}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: BorderRadius.md, flex: 1 },
  value: { fontSize: FontSize.lg, fontWeight: '700' },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
  screenTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, marginTop: Spacing.md },
  screenSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xxl },
  scanRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  scanBtn: { flex: 1 },
  scanGradient: { height: 90, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', ...Shadows.md },
  scanLabel: { color: '#fff', fontSize: FontSize.sm, fontWeight: '600', marginTop: 6 },
  analyzingCard: { alignItems: 'center', padding: Spacing.xxl, marginBottom: Spacing.lg },
  analyzingText: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.lg },
  previewImage: { width: 200, height: 150, borderRadius: BorderRadius.md, marginTop: Spacing.lg },
  resultCard: { marginBottom: Spacing.lg, padding: Spacing.xl },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  resultTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  resultNutrients: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  mealTypeLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  mealTypeRow: { flexDirection: 'row', gap: Spacing.sm },
  mealTypeBtn: { flex: 1, backgroundColor: Colors.surfaceElevated, paddingVertical: 10, borderRadius: BorderRadius.md, alignItems: 'center' },
  mealTypeBtnText: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '600', textTransform: 'capitalize' },
  summaryCard: { padding: Spacing.xl },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: FontSize.xl, fontWeight: '700' },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },
  divider: { width: 1, height: 40, backgroundColor: Colors.border },
  logCard: { paddingVertical: Spacing.md },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  mealDot: { width: 8, height: 8, borderRadius: 4 },
  logInfo: { flex: 1 },
  logName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  logMeal: { fontSize: FontSize.xs, color: Colors.textTertiary, textTransform: 'capitalize', marginTop: 2 },
  logCals: { alignItems: 'flex-end' },
  logCalValue: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  logCalUnit: { fontSize: FontSize.xs, color: Colors.textTertiary },
  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  modalContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.xxxl },
  formRow: { flexDirection: 'row', gap: Spacing.md },
  mealSelectLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, fontWeight: '500' },
  mealChip: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md, alignItems: 'center', backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
  mealChipActive: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  mealChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, textTransform: 'capitalize', fontWeight: '500' },
  mealChipTextActive: { color: Colors.primary, fontWeight: '700' },
});
